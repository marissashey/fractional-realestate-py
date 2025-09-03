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
    """
    PropertyStruct

    Represents all the details about a property that is listed for fractional ownership.
    This struct is stored in a BoxMap, allowing efficient lookup and update by property asset ID.

    Fields:
    - address: The physical address of the property (as a string)
    - total_shares: Total number of shares created for this property
    - available_shares: Number of shares still available for purchase
    - price_per_share: Price per share in microAlgos
    - property_asset_id: The Algorand asset ID representing this property
    - owner_address: The account address of the user who listed the property
    """

    address: arc4.String
    total_shares: arc4.UInt64
    available_shares: arc4.UInt64
    price_per_share: arc4.UInt64
    property_asset_id: arc4.UInt64
    owner_address: arc4.Address


class FractionalRealEstate(ARC4Contract):
    """
    FractionalRealEstate Contract

    This smart contract allows users to tokenize real estate properties as Algorand Standard Assets (ASAs).
    Users can list properties, and others can purchase fractional shares of those properties.

    Key Algorand concepts demonstrated:
    - Asset creation and transfer using inner transactions (the contract itself creates new assets)
    - Scalable per-asset storage using BoxMap and custom structs
    - Subroutines (private methods) for composability and code reuse
    - Defensive programming using assert statements
    """

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
        """
        List a new property for fractional ownership.

        Steps:
        1. Creates a new Algorand Standard Asset (ASA) to represent shares in the property.
        2. Constructs a PropertyStruct with all relevant details.
        3. Stores the struct in a BoxMap, using the asset ID as the key.

        Args:
            property_address: The physical address of the property (string)
            shares: Total number of shares to be created (uint64)
            price_per_share: Price per share in microAlgos (uint64)
        Returns:
            The asset ID of the created property token (uint64)
        """
        # Create the property asset (ASA) using an inner transaction
        txn_result = itxn.AssetConfig(
            asset_name=property_address.native,  # Asset name is the property address
            unit_name="PROP",
            total=shares.native,
            decimals=0,
            manager=Global.current_application_address,
            reserve=Global.current_application_address,
            fee=0,
        ).submit()

        asset_id = txn_result.created_asset.id

        # Store the property struct in the BoxMap, keyed by property asset ID
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
        """
        Purchase shares of a listed property from the original lister.

        This method:
        1. Validates the purchase (checks payment, share availability, etc.).
        2. Transfers the requested number of shares to the buyer using an inner asset transfer.
        3. Pays the property owner using an inner payment transaction.
        4. Updates the available shares in the BoxMap.

        Args:
            property_id: The asset ID of the property to buy shares of
            shares: Number of shares to buy
            payment: The payment transaction (must be grouped with the app call)
        Returns:
            True if the purchase is successful
        """
        # Ensure the property is listed
        assert property_id in self.listed_properties, "Property not listed"
        property_struct = self.listed_properties[property_id].copy()
        # Ensure the buyer has enough shares available
        assert (
            shares.native <= property_struct.available_shares.native
        ), "Not enough shares available"
        # Ensure the payment amount matches the total price for the requested shares
        assert (
            payment.amount == shares.native * property_struct.price_per_share.native
        ), "Invalid payment amount"
        # Ensure the payment is sent to the contract
        assert (
            payment.receiver == Global.current_application_address
        ), "Invalid payment receiver"
        # Ensure the payment is sent by the buyer
        assert payment.sender == Txn.sender, "Invalid payment sender"

        # Transfer shares to the buyer (inner asset transfer)
        itxn.AssetTransfer(
            xfer_asset=property_struct.property_asset_id.native,
            asset_receiver=Txn.sender,  # Buyer
            asset_amount=shares.native,
        ).submit()

        # Update available shares in the struct and BoxMap
        property_struct.available_shares = arc4.UInt64(
            property_struct.available_shares.native - shares.native
        )
        self.listed_properties[property_id] = property_struct.copy()

        # Pay the property owner (inner payment transaction)
        itxn.Payment(
            amount=shares.native * property_struct.price_per_share.native,
            receiver=property_struct.owner_address.native,
            fee=0,
        ).submit()

        return True

    @abimethod(readonly=True)
    def get_property_info(self, property_id: arc4.UInt64) -> PropertyStruct:
        """
        Get information about a listed property.

        Args:
            property_id: The asset ID of the property
        Returns:
            The PropertyStruct containing the property's information
        """
        assert property_id in self.listed_properties, "Property not listed"
        return self.listed_properties[property_id]
