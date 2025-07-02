from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    Txn,
    arc4,
    gtxn,
    itxn,
)
from algopy.arc4 import abimethod


# PropertyStruct definition
class PropertyStruct(arc4.Struct):
    """Structure representing a property in the fractional real estate system."""

    address: arc4.String
    total_shares: arc4.UInt64
    available_shares: arc4.UInt64
    price_per_share: arc4.UInt64
    property_asset_id: arc4.UInt64
    owner_address: arc4.Address


class FractionalRealEstate(ARC4Contract):
    """Smart contract for fractional real estate ownership."""

    def __init__(self) -> None:
        # BoxMap for listed properties (key: property asset ID, value: PropertyStruct)
        self.listed_properties = BoxMap(
            arc4.UInt64, PropertyStruct, key_prefix="properties"
        )

    @abimethod()
    def create_property_listing(
        self,
        property_address: arc4.String,
        shares: arc4.UInt64,
        price_per_share: arc4.UInt64,
    ) -> arc4.UInt64:
        # Create the property asset (ASA) using an inner transaction
        txn_result = itxn.AssetConfig(
            asset_name=property_address.native,
            unit_name="PROP",
            total=shares.native,
            decimals=0,
            manager=Global.current_application_address,
            reserve=Global.current_application_address,
            fee=0,
        ).submit()

        asset_id = txn_result.created_asset.id

        # Store the property struct in the BoxMap
        self.listed_properties[arc4.UInt64(asset_id)] = PropertyStruct(
            address=property_address,
            total_shares=shares,
            available_shares=shares,
            price_per_share=price_per_share,
            property_asset_id=arc4.UInt64(asset_id),
            owner_address=arc4.Address(Txn.sender),
        )

        return arc4.UInt64(asset_id)

    @abimethod()
    def purchase_from_lister(
        self,
        property_id: arc4.UInt64,
        shares: arc4.UInt64,
        payment: gtxn.PaymentTransaction,
    ) -> bool:
        assert property_id in self.listed_properties, "Property not listed"
        property_struct = self.listed_properties[property_id].copy()
        assert (
            shares.native <= property_struct.available_shares.native
        ), "Not enough shares available"
        assert (
            payment.amount == shares.native * property_struct.price_per_share.native
        ), "Invalid payment amount"
        assert (
            payment.receiver == Global.current_application_address
        ), "Invalid payment receiver"
        assert payment.sender == Txn.sender, "Invalid payment sender"

        # Transfer shares to buyer
        itxn.AssetTransfer(
            xfer_asset=property_struct.property_asset_id.native,
            asset_receiver=Txn.sender,
            asset_amount=shares.native,
        ).submit()

        # Update available shares
        property_struct.available_shares = arc4.UInt64(
            property_struct.available_shares.native - shares.native
        )
        self.listed_properties[property_id] = property_struct.copy()

        # Pay the owner
        itxn.Payment(
            amount=shares.native * property_struct.price_per_share.native,
            receiver=property_struct.owner_address.native,
            fee=0,
        ).submit()

        return True

    @abimethod(readonly=True)
    def get_property_info(self, property_id: arc4.UInt64) -> PropertyStruct:
        assert property_id in self.listed_properties, "Property not listed"
        return self.listed_properties[property_id]
