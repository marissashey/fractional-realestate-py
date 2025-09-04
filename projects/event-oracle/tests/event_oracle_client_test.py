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
# from smart_contracts.artifacts.event_oracle.event_oracle_client import (
#     EventOracleClient,
#     EventOracleFactory,
# )


@pytest.fixture()
def deployer(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.from_environment("DEPLOYER")
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(20)
    )
    return account


@pytest.fixture()
def proposer(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(25)
    )
    return account


@pytest.fixture()
def disputer(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(50)
    )
    return account


@pytest.fixture()
def voter1(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(15)
    )
    return account


@pytest.fixture()
def voter2(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address, min_spending_balance=AlgoAmount.from_algo(15)
    )
    return account


# Uncomment and modify this test after building the contract
# @pytest.fixture()
# def event_oracle_client(
#     algorand_client: AlgorandClient, deployer: SigningAccount
# ) -> EventOracleClient:
#     factory = algorand_client.client.get_typed_app_factory(
#         EventOracleFactory, default_sender=deployer.address
#     )
# 
#     client, _ = factory.deploy(
#         on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
#         on_update=algokit_utils.OnUpdate.AppendApp,
#     )
#     # Fund the app account for reward payouts
#     algorand_client.send.payment(
#         PaymentParams(
#             sender=deployer.address,
#             receiver=client.app_address,
#             amount=AlgoAmount.from_algo(100),  # Fund with 100 ALGO for testing
#         )
#     )
#     return client


# Basic test template - uncomment after building contract
# def test_create_event_and_propose_outcome(
#     algorand_client: AlgorandClient,
#     deployer: SigningAccount,
#     proposer: SigningAccount,
#     event_oracle_client: EventOracleClient,
# ) -> None:
#     """Test creating an event and proposing an outcome."""
#     client = event_oracle_client
#     
#     # --- CREATE EVENT ---
#     event_description = "Will Bitcoin reach $100,000 by December 31, 2024?"
#     
#     # Set the app client to use the deployer as the sender
#     deployer_client = client.clone(
#         default_sender=deployer.address, default_signer=deployer.signer
#     )
#     
#     create_event_result = deployer_client.send.create_event(
#         args=(event_description,),
#         params=algokit_utils.CommonAppCallParams(extra_fee=AlgoAmount(micro_algo=2000)),
#     )
#     event_id = create_event_result.abi_return
#     assert event_id is not None, "Failed to create event"
#     
#     # --- PROPOSE OUTCOME ---
#     proposal_stake = 10_000_000  # 10 ALGO
#     proposed_outcome = True  # Proposing "yes"
#     
#     payment_txn = algorand_client.create_transaction.payment(
#         PaymentParams(
#             sender=proposer.address,
#             receiver=client.app_address,
#             amount=AlgoAmount(micro_algo=proposal_stake),
#         )
#     )
#     payment_with_signer = TransactionWithSigner(payment_txn, proposer.signer)
#     
#     # Set the app client to use the proposer as the sender
#     proposer_client = client.clone(
#         default_sender=proposer.address, default_signer=proposer.signer
#     )
#     
#     # Make proposal
#     propose_result = proposer_client.send.propose_outcome(
#         args=(event_id, proposed_outcome, payment_with_signer),
#         params=algokit_utils.CommonAppCallParams(extra_fee=AlgoAmount(micro_algo=2000)),
#     )
#     assert propose_result.abi_return is True
#     
#     # --- VERIFY EVENT STATE ---
#     event_info = client.send.get_event_info(
#         args=(event_id,),
#     )
#     assert event_info.abi_return is not None
#     event_data = event_info.abi_return
#     assert event_data.initial_proposal == proposed_outcome
#     assert event_data.proposer_address == proposer.address
#     assert event_data.proposal_stake == proposal_stake
#     assert not event_data.resolved


def test_placeholder() -> None:
    """Placeholder test to ensure the test file is valid."""
    assert True, "This is a placeholder test"
