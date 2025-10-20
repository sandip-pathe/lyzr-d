# Bug Fix: Trigger → Agent Data Flow

## Problem
Agent nodes were not receiving data from trigger nodes, resulting in generic responses like "It seems like your message is incomplete" instead of using the prompt from the trigger.

## Root Cause
The `_get_node_input()` method in `workflows.py` was looking up the last entry in `execution_history` to find the previous node's output. However, the current node's history entry was being appended to `execution_history` BEFORE the node executed (line 167), which caused:

1. Trigger executes → adds trigger to history → stores mapped output
2. Agent starts → **adds agent to history with "running" status** → calls `_get_node_input()`
3. `_get_node_input()` looks at `execution_history[-1]` → **finds agent1, not trigger1!**
4. No mapped output for agent1 exists yet → returns `None`
5. Agent receives `None` as `previous_output`

## Solution
Modified `_get_node_input()` to skip the current node when looking up previous node data:

```python
# OLD CODE:
last_executed = self.execution_history[-1]
last_node_id = last_executed.get("node_id")

# NEW CODE:
last_executed = None
for i in range(len(self.execution_history) - 1, -1, -1):
    entry = self.execution_history[i]
    # Skip the current node if it's already in history
    if entry.get("node_id") == node_id:
        continue
    # Found a previous node
    last_executed = entry
    break
```

## Additional Fixes
1. **TriggerOutput.text_content**: Updated to look for multiple field names (`prompt`, `input_text`, `text`, etc.) instead of just `input_text`
2. **dateutil dependency**: Temporarily removed from `output_mapper.py` since Docker images didn't have it installed (used `datetime.fromisoformat()` instead)

## Files Modified
- `backend/app/temporal/workflows.py` - Fixed `_get_node_input()` method
- `backend/app/schemas/node_outputs.py` - Enhanced `TriggerOutput.text_content` property
- `backend/app/services/output_mapper.py` - Removed dateutil dependency

## Test Results
✅ **WORKING!** Agent now correctly receives and uses prompts from trigger nodes.

Example outputs:
- **Input**: "Write a haiku about coding"
  - **Output**: "Lines of logic flow, / Fingers dance on keys like dreams, / Worlds born from the code."

- **Input**: "Write a haiku about the ocean"
  - **Output**: "Waves kiss the soft shore, / Whispers of the deep blue call, / Endless dreams in foam."

## Next Steps
1. Test Agent → Agent chaining
2. Test other node type mappings (Agent → Timer, API → Agent, etc.)
3. Clean up debug print statements
4. Re-enable ExecutionContext when datetime serialization is fixed
