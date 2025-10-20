# 🧪 Testing Input/Output Mapping

## **Current Test Results**

### ✅ **Test 1: Basic Trigger → Agent → End**
**Status**: PASSING ✅

**Workflow**: 
```
Trigger (input) → Agent (generates content) → End
```

**Execution**:
```bash
curl -X POST http://localhost:8000/api/workflows/a3cd5deb.../execute \
  -d '{"input": {"prompt": "Write a haiku"}}'
```

**Result**:
- ✅ Workflow completes successfully
- ✅ Agent receives input and generates output
- ✅ Output includes: `output`, `model`, `cost`, `usage`

**Data Flow**:
```
1. Trigger outputs: {"prompt": "..."}
2. Agent receives: {"prompt": "..."}  
3. Agent outputs: {"output": "haiku text", "model": "gpt-4o-mini", "cost": 0.0000235}
```

---

## **Tests We Can Run Now**

### **Test 2: Agent Chaining (Agent → Agent)**

**Goal**: Verify agent output becomes next agent's prompt

**Workflow Structure**:
```json
{
  "nodes": [
    {"id": "trigger", "type": "trigger"},
    {"id": "agent1", "type": "agent", "config": {
      "system_instructions": "Generate a topic for a story"
    }},
    {"id": "agent2", "type": "agent", "config": {
      "system_instructions": "Write a short story about the given topic"
    }},
    {"id": "end", "type": "end"}
  ],
  "edges": [
    {"source": "trigger", "target": "agent1"},
    {"source": "agent1", "target": "agent2"},
    {"source": "agent2", "target": "end"}
  ]
}
```

**Expected Behavior**:
1. Agent1 outputs: `{"output": "A robot learning to paint"}`
2. Agent2 receives as prompt: `"A robot learning to paint"`
3. Agent2 generates story about that topic

**Test Command**:
```bash
# Execute with existing workflow by modifying it
# OR check execution history for agent→agent flow
```

---

### **Test 3: Agent → Timer (Duration Extraction)**

**Goal**: Timer extracts duration from agent's text

**Current Implementation**:
```python
# In workflows.py timer node:
if "output" in previous_output_data:
    text = previous_output_data["output"]
    match = re.search(r'(\d+)\s*(second|minute|hour)s?', text.lower())
    if match:
        duration = convert_to_seconds(match)
```

**Test Workflow**:
```
Trigger → Agent (generates "wait 5 seconds") → Timer → End
```

**Expected**:
- Agent outputs: `{"output": "5 seconds"}`
- Timer extracts: `duration = 5`
- Timer waits 5 seconds
- Output: `{"waited_seconds": 5}`

**Status**: ⏳ Need to create workflow with Timer node

---

### **Test 4: Input Mapping Verification**

**What to Check**:

#### **Agent Node Input Handling**:
```python
# From activities.py:
if "prompt" in previous_output:
    # Direct prompt
elif "output" in previous_output:
    # Agent chaining
elif "body" in previous_output:
    # API response
elif "current_item" in previous_output:
    # Loop iteration
```

**Test Cases**:
- ✅ From Trigger: `{"prompt": "..."}` → Works
- ⏳ From Agent: `{"output": "..."}` → Need to verify
- ⏳ From API: `{"body": {...}}` → Need API node workflow
- ⏳ From Loop: `{"current_item": "..."}` → Need Loop implementation

---

## **Quick Verification Tests**

### **Test: Check Execution History**

Let's verify what data is flowing between nodes in completed executions:

```bash
# Get recent execution
execution_id="5dcec8ab-0d07-44b4-b6e9-fa0230750db8"

# Check node outputs
curl http://localhost:8000/api/executions/$execution_id | \
  python -c "
import sys, json
data = json.load(sys.stdin)
history = data['current_state']['execution_history']
for entry in history:
    print(f\"Node: {entry['node_id']} ({entry['type']})\")
    print(f\"  Result keys: {list(entry.get('result', {}).keys())}\")
    print()
"
```

**Example Output**:
```
Node: trigger-xxx (trigger)
  Result keys: []

Node: agent-xxx (agent)
  Result keys: ['output', 'model', 'cost', 'temperature_used', 'usage']
```

---

## **Manual Testing Steps**

### **Step 1: Verify Agent Input Mapping**

Add debug logging to see what input agent receives:

```python
# In activities.py execute_agent_node:
activity.logger.info(f"📥 Agent '{name}' received input_data: {input_data}")
```

### **Step 2: Test with Frontend**

1. Open workflow canvas
2. Create: Trigger → Agent → Agent → End
3. Configure Agent1: "Generate a topic"
4. Configure Agent2: "Write about the topic"
5. Execute and check if Agent2 uses Agent1's output

### **Step 3: Check Workflow State**

```bash
# Get workflow query
curl http://localhost:8000/api/workflows/a3cd5deb.../query/state
```

---

## **What We Know Works** ✅

1. **Basic Sequential Flow**: Trigger → Agent → End
2. **Agent Execution**: Receives input, calls OpenAI, returns structured output
3. **Output Mapping Schema**: All nodes have BaseNodeOutput schemas
4. **Workflow Completion**: Events publish correctly, no errors

---

## **What We Need to Verify** ⏳

1. **Agent Chaining**: Does Agent2 receive Agent1's output as prompt?
2. **Timer Duration Extraction**: Can Timer parse "5 seconds" from agent text?
3. **API Request Building**: Does API node properly format request from agent output?
4. **HITL Context**: Does approval node show rich context based on previous node type?
5. **Eval Target Extraction**: Does Eval properly extract content to evaluate?

---

## **Next Steps**

### **Option A: Add Debug Logging**
Add temporary logging to see what each node receives:

```python
# In each activity:
activity.logger.info(f"📥 INPUT: {json.dumps(previous_output, indent=2)[:200]}")
```

### **Option B: Create Test Workflows Programmatically**
Write Python script to create and execute test workflows:

```python
import requests

# Create Agent→Agent workflow
response = requests.post('http://localhost:8000/api/workflows', json={...})
workflow_id = response.json()['id']

# Execute it
requests.post(f'http://localhost:8000/api/workflows/{workflow_id}/execute', ...)

# Check results
```

### **Option C: Use Existing Workflow with Different Configs**
Modify the existing 3-node workflow to have different agent instructions and see how they interact.

---

## **Recommended: Add Debug Endpoint**

Create a debug endpoint to inspect node I/O:

```python
# In backend/app/api/workflows.py
@router.get("/executions/{execution_id}/debug")
async def debug_execution(execution_id: str):
    """Show detailed I/O for each node"""
    execution = await get_execution(execution_id)
    
    debug_info = []
    for node in execution.history:
        debug_info.append({
            "node_id": node.node_id,
            "node_type": node.type,
            "input_received": node.input,  # Need to track this
            "output_produced": node.result,
            "mapped_output": node.mapped_output  # From OutputMapper
        })
    
    return {"execution_id": execution_id, "debug": debug_info}
```

---

## **Current Status**: 
- ✅ Code is deployed
- ✅ Basic workflow works
- ⏳ Need to verify inter-node data flow
- ⏳ Need to create test workflows for each node pair

**Ready to add debug logging and test?** 🔍
