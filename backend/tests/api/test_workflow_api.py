import pytest
from unittest.mock import patch, MagicMock
from uuid import uuid4

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

@pytest.fixture
def mock_workflow_model():
    """Fixture to create a mock Workflow ORM object."""
    workflow = MagicMock()
    workflow.id = str(uuid4())
    workflow.name = "Test Workflow"
    workflow.description = "A test workflow"
    workflow.definition = {"nodes": [], "edges": []}
    return workflow

async def test_create_workflow_success(test_client, mock_db_session, mock_workflow_model):
    """
    GIVEN a valid workflow creation payload
    WHEN the POST /workflows/ endpoint is called
    THEN it should return a 200 OK status and the ID of the created workflow.
    """
    # Arrange
    with patch("app.api.workflows.get_db", return_value=mock_db_session):
        payload = {
            "name": "My New Workflow",
            "description": "This is a test.",
            "nodes": [{"id": "1", "type": "trigger", "data": {}}],
            "edges": []
        }

        # Act
        response = await test_client.post("/workflows/", json=payload)

        # Assert
        assert response.status_code == 200
        response_data = response.json()
        assert "id" in response_data
        assert response_data["status"] == "created"
        
        # Verify that our database mock was called correctly
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()


async def test_get_workflow_not_found(test_client, mock_db_session):
    """
    GIVEN a non-existent workflow ID
    WHEN the GET /workflows/{workflow_id} endpoint is called
    THEN it should return a 404 Not Found error.
    """
    # Arrange
    # The default mock_db_session is already configured to return None for queries
    with patch("app.api.workflows.get_db", return_value=mock_db_session):
        non_existent_id = str(uuid4())

        # Act
        response = await test_client.get(f"/workflows/{non_existent_id}")

        # Assert
        assert response.status_code == 404
        assert response.json() == {"detail": "Workflow not found"}


async def test_execute_workflow(test_client, mock_db_session, mock_temporal_client, mock_workflow_model):
    """
    GIVEN a valid workflow and execution request
    WHEN the POST /workflows/{workflow_id}/execute endpoint is called
    THEN it should successfully start a Temporal workflow and return a 200 OK status.
    """
    # Arrange
    # Ensure the database mock returns our mock workflow
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_workflow_model

    with patch("app.api.workflows.get_db", return_value=mock_db_session), \
         patch("app.api.workflows.get_temporal_client", return_value=mock_temporal_client):
        
        payload = {"input_data": {"message": "Hello World"}}

        # Act
        response = await test_client.post(f"/workflows/{mock_workflow_model.id}/execute", json=payload)

        # Assert
        assert response.status_code == 200
        response_data = response.json()
        assert "execution_id" in response_data
        assert response_data["status"] == "running"
        
        # Verify that the Temporal client was called to start the workflow
        mock_temporal_client.start_workflow.assert_awaited_once()