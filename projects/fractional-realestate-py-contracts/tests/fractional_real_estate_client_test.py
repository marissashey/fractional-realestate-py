import algokit_utils
import pytest
from algokit_utils import (
    AlgoAmount,
    AlgorandClient,
    AssetOptInParams,
    PaymentParams,
    SigningAccount,
)
from algosdk.atomic_transaction_composer import TransactionWithSigner

from smart_contracts.artifacts.fractional_real_estate.fractional_real_estate_client import (
    FractionalRealEstateClient,
    FractionalRealEstateFactory,
)


@pytest.fixture()
def deployer(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.from_environment("DEPLOYER")
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(10)
    )
    return account


@pytest.fixture()
def buyer(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(11)
    )
    return account


@pytest.fixture()
def fractional_real_estate_client(
    algorand_client: AlgorandClient, deployer: SigningAccount
) -> FractionalRealEstateClient:
    factory = algorand_client.client.get_typed_app_factory(
        FractionalRealEstateFactory, default_sender=deployer.address
    )

    client, _ = factory.deploy(
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
        on_update=algokit_utils.OnUpdate.AppendApp,
    )
    # Fund the app account for inner transactions
    algorand_client.send.payment(
        PaymentParams(
            sender=deployer.address,
            receiver=client.app_address,
            amount=AlgoAmount.from_algo(1),
        )
    )
    return client


def ensure_opted_in_to_asset(
    algorand_client: AlgorandClient, account: SigningAccount, asset_id: int
) -> None:
    info = algorand_client.account.get_information(account.address)
    # info.assets is a list of asset holdings
    if not any(asset.asset_id == asset_id for asset in getattr(info, "assets", [])):
        algorand_client.send.asset_opt_in(
            AssetOptInParams(
                asset_id=asset_id,
                sender=account.address,
            )
        )


def test_can_list_property_and_purchase_shares(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    buyer: SigningAccount,
    fractional_real_estate_client: FractionalRealEstateClient,
) -> None:
    # --- SETUP ---
    lister = deployer
    client = fractional_real_estate_client
    # --- PROPERTY LISTING ---
    property_address = "123 Main St"
    total_shares = 100
    price_per_share = 1_000_000  # 1 Algo per share
    create_result = client.send.create_property_listing(
        args=(property_address, total_shares, price_per_share),
        params=algokit_utils.CommonAppCallParams(extra_fee=AlgoAmount(micro_algo=1000)),
    )
    property_id = create_result.abi_return
    assert property_id is not None, "Failed to create property listing"
    # --- BUYER OPT-IN TO ASSET ---
    ensure_opted_in_to_asset(algorand_client, buyer, property_id)
    # --- PURCHASING SHARES ---
    shares_to_buy = 10
    payment_amount = shares_to_buy * price_per_share
    payment_txn = algorand_client.create_transaction.payment(
        PaymentParams(
            sender=buyer.address,
            receiver=client.app_address,
            amount=AlgoAmount(micro_algo=payment_amount),
        )
    )
    payment_with_signer = TransactionWithSigner(payment_txn, buyer.signer)
    # Set the app client to use the buyer as the sender for this group
    buyer_client = client.clone(
        default_sender=buyer.address, default_signer=buyer.signer
    )
    group = buyer_client.new_group().purchase_from_lister(
        args=(property_id, shares_to_buy, payment_with_signer),
        params=algokit_utils.CommonAppCallParams(extra_fee=AlgoAmount(micro_algo=2000)),
    )
    result = group.send()
    assert result.returns[0].value is True
    # --- ASSERTIONS ---
    buyer_asset_info = algorand_client.account.get_information(buyer.address)
    asset_balance = 0
    for asset in getattr(buyer_asset_info, "assets", []):
        if asset.get("asset-id") == property_id:
            asset_balance = asset.get("amount", 0)
    assert asset_balance == shares_to_buy
    property_info_result = client.send.get_property_info(args=(property_id,))
    property_info = property_info_result.abi_return
    assert property_info is not None
    assert property_info.available_shares == total_shares - shares_to_buy
    assert property_info.owner_address == lister.address
    assert property_info.price_per_share == price_per_share
    assert property_info.address == property_address
