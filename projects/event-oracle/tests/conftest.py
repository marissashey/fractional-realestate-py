import pytest
from algokit_utils import AlgorandClient
from algokit_utils.config import config


@pytest.fixture(autouse=True, scope="session")
def environment_fixture() -> None:
    # Enable AVM debugging
    config.configure(debug=True, trace_all=True)


@pytest.fixture(scope="session")
def algorand_client() -> AlgorandClient:
    return AlgorandClient.from_environment()
