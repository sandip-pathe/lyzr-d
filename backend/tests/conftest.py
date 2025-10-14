import pytest
from httpx import AsyncClient
from unittest.mock import MagicMock, AsyncMock

# Mocking database session for tests
@pytest.fixture
def mock_db_session():
    """Mocks the database session to prevent actual database calls."""
    db_session = MagicMock()
    # Add any specific mock behaviors you need, e.g., for query, add, commit
    db_session.query.return_value.filter.return_value.first.return_value = None
    return db_session

# Mocking the Temporal client
@pytest.fixture
def mock_temporal_client():
    """Mocks the Temporal client to prevent actual workflow executions."""
    client = AsyncMock()
    # Mock the handle for starting a workflow
    handle = AsyncMock()
    client.start_workflow.return_value = handle
    return client

# Creating a test client for the FastAPI app
@pytest.fixture
async def test_client():
    """Creates an async test client for the FastAPI application."""
    from app.main import app
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client