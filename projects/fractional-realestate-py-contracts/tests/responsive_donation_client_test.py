import algokit_utils
import pytest
from algokit_utils import (
    AlgoAmount,
    AlgorandClient,
    PaymentParams,
    SigningAccount,
)
from algosdk.atomic_transaction_composer import TransactionWithSigner

# Note: This import will be available after building the contract
# from smart_contracts.artifacts.responsive_donation.responsive_donation_client import (
#     ResponsiveDonationClient,
#     ResponsiveDonationFactory,
# )


@pytest.fixture()
def deployer(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.from_environment("DEPLOYER")
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(10)
    )
    return account


@pytest.fixture()
def donor(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(11)
    )
    return account


@pytest.fixture()
def recipient(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(5)
    )
    return account


@pytest.fixture()
def oracle(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(5)
    )
    return account


# Uncomment and modify this test after building the contract
# @pytest.fixture()
# def responsive_donation_client(
#     algorand_client: AlgorandClient, deployer: SigningAccount
# ) -> ResponsiveDonationClient:
#     factory = algorand_client.client.get_typed_app_factory(
#         ResponsiveDonationFactory, default_sender=deployer.address
#     )
# 
#     client, _ = factory.deploy(
#         on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
#         on_update=algokit_utils.OnUpdate.AppendApp,
#     )
#     # Fund the app account for inner transactions
#     algorand_client.send.payment(
#         PaymentParams(
#             sender=deployer.address,
#             receiver=client.app_address,
#             amount=AlgoAmount.from_algo(10),  # More funding for multiple payouts
#         )
#     )
#     return client


# Basic test template - uncomment after building contract
# def test_can_create_event_and_instantaneous_donation(
#     algorand_client: AlgorandClient,
#     deployer: SigningAccount,
#     donor: SigningAccount,
#     recipient: SigningAccount,
#     oracle: SigningAccount,
#     responsive_donation_client: ResponsiveDonationClient,
# ) -> None:
#     """Test creating an event and making an instantaneous donation."""
#     client = responsive_donation_client
#     
#     # --- CREATE EVENT ---
#     event_description = "Hurricane hits Miami by Dec 31, 2025"
#     create_event_result = client.send.create_event(
#         args=(event_description, oracle.address),
#         params=algokit_utils.CommonAppCallParams(extra_fee=AlgoAmount(micro_algo=1000)),
#     )
#     event_id = create_event_result.abi_return
#     assert event_id is not None, "Failed to create event"
#     
#     # --- INSTANTANEOUS DONATION ---
#     donation_amount = 1_000_000  # 1 Algo
#     payment_txn = algorand_client.create_transaction.payment(
#         PaymentParams(
#             sender=donor.address,
#             receiver=client.app_address,
#             amount=AlgoAmount(micro_algo=donation_amount),
#         )
#     )
#     payment_with_signer = TransactionWithSigner(payment_txn, donor.signer)
#     
#     # Get recipient balance before donation
#     recipient_info_before = algorand_client.account.get_information(recipient.address)
#     balance_before = recipient_info_before.amount
#     
#     # Set the app client to use the donor as the sender
#     donor_client = client.clone(
#         default_sender=donor.address, default_signer=donor.signer
#     )
#     
#     # Make instantaneous donation
#     donation_result = donor_client.send.instantaneous_payout(
#         args=(recipient.address, payment_with_signer),
#         params=algokit_utils.CommonAppCallParams(extra_fee=AlgoAmount(micro_algo=2000)),
#     )
#     assert donation_result.abi_return is True
#     
#     # Verify recipient received the donation
#     recipient_info_after = algorand_client.account.get_information(recipient.address)
#     balance_after = recipient_info_after.amount
#     
#     assert balance_after - balance_before == donation_amount, "Recipient should receive the donation amount"


def test_placeholder() -> None:
    """Placeholder test to ensure the test file is valid."""
    assert True, "This is a placeholder test"
