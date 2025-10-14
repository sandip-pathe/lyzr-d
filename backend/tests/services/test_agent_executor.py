import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.agent_executor import AgentExecutor

pytestmark = pytest.mark.asyncio

def test_resolve_input_mapping():
    """
    GIVEN a state dictionary and an input mapping with template variables
    WHEN the resolve_input method is called
    THEN it should correctly substitute the values from the state.
    """
    # Arrange
    executor = AgentExecutor()
    state = {
        "workflow_id": "wf-123",
        "previous_output": {
            "data": "some important data",
            "user_id": 42
        }
    }
    mapping = {
        "prompt": "Analyze the following: {{previous_output.data}}",
        "user": "{{previous_output.user_id}}",
        "static_value": "hello"
    }

    # Act
    result = executor.resolve_input(mapping, state)

    # Assert
    assert result == {
        "prompt": "Analyze the following: some important data",
        "user": 42,
        "static_value": "hello"
    }

@patch("openai.AsyncOpenAI")
async def test_execute_openai_agent(mock_openai_class):
    """
    GIVEN an agent executor with a mocked OpenAI client
    WHEN the execute method is called for the 'openai' provider
    THEN it should call the OpenAI API with the correct parameters.
    """
    # Arrange
    # Mock the response from the OpenAI API
    mock_response = AsyncMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "This is the AI response."
    mock_response.usage.model_dump.return_value = {"total_tokens": 100}

    # Set up the mock client instance
    mock_openai_instance = AsyncMock()
    mock_openai_instance.chat.completions.create.return_value = mock_response
    mock_openai_class.return_value = mock_openai_instance

    executor = AgentExecutor()
    
    # Mock the self-healing service to avoid database calls
    executor.self_healing = MagicMock()

    # Act
    result = await executor.execute(
        provider="openai",
        agent_id="gpt-4o-mini",
        input_data={"messages": [{"role": "user", "content": "Hello"}]}
    )

    # Assert
    assert result["output"] == "This is the AI response."
    assert result["model"] == "gpt-4o-mini"
    
    # Verify the API was called
    mock_openai_instance.chat.completions.create.assert_awaited_once_with(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hello"}]
    )

    # Verify the self-healing service was called with a success
    executor.self_healing.record_agent_execution.assert_called_once()
    # You can get even more specific with assertions
    args, kwargs = executor.self_healing.record_agent_execution.call_args
    assert kwargs["success"] is True