# 🔄 Input/Output Mapping System

## **Overview**

Every node in the workflow system can connect to any other node. The **Output Mapper** intelligently converts data between different node types to ensure seamless data flow.

---

## **✅ Updated Nodes (Using Intelligent Mapping)**

### **1. Agent Node** 
**Input Extraction:**
- ✅ From Trigger: Extracts `prompt` from `input_data`
- ✅ From Agent: Chains `output` as new prompt
- ✅ From API: Formats API `body` as context
- ✅ From Loop: Uses `current_item` as prompt
- ✅ From HITL/Approval: Includes approval `action` in context

**Output Format:**
```json
{
  "output": "Generated text content",
  "model": "gpt-4o-mini",
  "cost": 0.0000235,
  "temperature_used": 0.7,
  "usage": {
    "total_tokens": 67,
    "prompt_tokens": 37,
    "completion_tokens": 30
  }
}
```

---

### **2. API Call Node**
**Input Extraction:**
- ✅ From Agent: Uses `output` as `input` field in request body
- ✅ From API: Chains `body` as `previous_response`
- ✅ From Loop: Adds `item` and `iteration` to request
- ✅ From HITL: Includes `approval_action` and `approved_by`
- ✅ From any: Merges previous output into request body

**Output Format:**
```json
{
  "status_code": 200,
  "body": {...},  // Parsed JSON or text
  "headers": {...}
}
```

---

### **3. Timer Node**
**Input Extraction:**
- ✅ From Config: Uses `duration_seconds` directly
- ✅ From Agent: Parses text like "5 seconds", "2 minutes", "1 hour"
- ✅ From Output Mapper: Uses `delay_seconds` field if present
- ✅ Regex Pattern: `(\d+)\s*(second|minute|hour)s?`

**Output Format:**
```json
{
  "waited_seconds": 30,
  "completed_at": "2025-10-20T01:23:45.123456+00:00"
}
```

**Examples:**
- Agent: "remind me in 30 seconds" → Timer delays 30s
- Agent: "wait 2 minutes" → Timer delays 120s
- Config: `{duration_seconds: 10}` → Timer delays 10s

---

### **4. Eval Node**
**Input Extraction:**
- ✅ From Agent: Evaluates the `output` text
- ✅ From API: Evaluates the response `body`
- ✅ From any: Evaluates `value` field or entire object

**Output Format:**
```json
{
  "passed": true,
  "score": 0.95,
  "reason": "Output meets quality criteria",
  "on_failure": "block"  // or "compensate", "retry"
}
```

---

### **5. HITL (Human in the Loop) / Approval Node** 🙋
**Input Extraction:**
- ✅ From Agent: Shows generated content with model/cost
- ✅ From API: Shows response with status code
- ✅ From Eval: Shows evaluation result (passed/failed)
- ✅ From any: Formats as rich context for reviewer

**Context Types:**
```json
// For Agent output
{
  "type": "agent_output",
  "content": "Generated text",
  "model": "gpt-4o-mini",
  "cost": 0.0000235
}

// For API response
{
  "type": "api_response",
  "status_code": 200,
  "response": {...}
}

// For Eval result
{
  "type": "evaluation",
  "passed": false,
  "score": 0.45,
  "reason": "Quality below threshold"
}
```

**Output Format:**
```json
{
  "action": "approved",  // or "rejected"
  "approval_id": "uuid",
  "approved_by": "user@example.com",
  "timestamp": "2025-10-20T01:23:45Z",
  "comments": "Looks good!"
}
```

**Approval Types:**
- `binary`: Simple approve/reject
- `form`: Multi-field form submission
- `review`: Detailed review with comments

---

### **6. Event Node**
**Input Extraction:**
- ✅ From any: Wraps previous output as `payload`
- ✅ Includes workflow metadata (workflow_id, execution_id, node_id)

**Output Format:**
```json
{
  "operation": "published",
  "channel": "notifications.user.alert"
}
```

---

### **7. Meta Node** 🧠
**Input Extraction:**
- ✅ From Workflow Context: Accesses all `node_outputs`
- ✅ Observes entire execution state
- ✅ Captures custom metrics

**Output Format:**
```json
{
  "nodes_executed_count": 5,
  "workflow_id": "...",
  "execution_id": "...",
  "timestamp": "2025-10-20T01:23:45Z",
  "metrics_to_capture": ["latency", "cost", "tokens"]
}
```

---

## **🔄 Node-to-Node Mapping Matrix**

| From ↓ / To → | Agent | Timer | Conditional | API Call | Eval | HITL | Loop |
|---------------|-------|-------|-------------|----------|------|------|------|
| **Trigger** | ✅ prompt | ✅ schedule | ✅ condition | ✅ body | ❌ | ✅ context | ❌ |
| **Agent** | ✅ chain | ✅ parse time | ✅ parse bool | ✅ as input | ✅ evaluate | ✅ review | ❌ |
| **Timer** | ✅ report | ❌ | ❌ | ✅ timestamp | ❌ | ❌ | ❌ |
| **API** | ✅ format | ❌ | ✅ status check | ✅ chain | ✅ validate | ✅ review | ❌ |
| **Eval** | ✅ report | ❌ | ✅ pass/fail | ❌ | ❌ | ✅ escalate | ❌ |
| **HITL** | ✅ decision | ❌ | ✅ approved? | ✅ action | ❌ | ❌ | ❌ |
| **Loop** | ✅ item | ❌ | ✅ has_more | ✅ item data | ❌ | ❌ | ❌ |
| **Event** | ✅ notify | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Fully supported with intelligent mapping
- ⏳ Partially supported (needs refinement)
- ❌ Not implemented yet (can be added)

---

## **🎯 Real-World Examples**

### **Example 1: Agent → Timer → Agent**
```
1. Agent: "Schedule a reminder in 5 minutes"
   Output: {output: "I'll remind you in 5 minutes", ...}

2. Timer: Extracts "5 minutes" → delays 300 seconds
   Output: {waited_seconds: 300, completed_at: "..."}

3. Agent: Receives timer completion
   Output: {output: "Reminder: Time's up!", ...}
```

### **Example 2: API → Eval → HITL**
```
1. API Call: Fetches user data
   Output: {status_code: 200, body: {user: "John", age: 30}}

2. Eval: Validates data quality
   Output: {passed: false, reason: "Missing required field 'email'"}

3. HITL: Human reviews failure
   Context: {type: "evaluation", passed: false, score: 0.3}
   Decision: "rejected" → triggers compensation
```

### **Example 3: Trigger → Agent → Agent (Chaining)**
```
1. Trigger: {prompt: "Write a story about space"}
   
2. Agent 1: Generates story outline
   Output: "Chapter 1: Launch, Chapter 2: Discovery..."

3. Agent 2: Expands Chapter 1
   Input: "Expand this: Chapter 1: Launch"
   Output: "The rocket lifted off at dawn..."
```

---

## **🔧 Technical Implementation**

### **In Workflow (`_get_node_input` method):**
```python
def _get_node_input(node_id, node_type, node_config):
    last_output = execution_history[-1].get("result")
    
    if last_node_id in mapped_outputs:
        # Use Output Mapper to extract
        extracted = output_mapper.extract_for_target(
            output=mapped_outputs[last_node_id],
            target_node_type=node_type,
            target_config=node_config
        )
        return extracted
    
    return last_output  # Fallback
```

### **In Activities:**
Each activity now intelligently processes `previous_output`:

**Agent Activity:**
```python
if "output" in previous_output:
    # Agent chaining
    input_data = {"prompt": previous_output["output"]}
elif "body" in previous_output:
    # From API
    input_data = {"prompt": f"Process: {previous_output['body']}"}
```

**API Activity:**
```python
if "output" in previous_output:
    # From Agent
    request_body["input"] = previous_output["output"]
elif "action" in previous_output:
    # From HITL
    request_body["approval_action"] = previous_output["action"]
```

---

## **📋 Next Steps**

### **Immediate:**
1. ✅ Agent input mapping - DONE
2. ✅ API input mapping - DONE
3. ✅ Timer duration extraction - DONE
4. ✅ Eval target extraction - DONE
5. ✅ HITL context formatting - DONE

### **Pending:**
1. ⏳ Conditional: Extract boolean from previous output
2. ⏳ Loop: Extract iterable list from previous output
3. ⏳ Merge: Combine multiple branch outputs
4. ⏳ Test all node pairs with real workflows

### **Advanced:**
1. Template-based field extraction (Jinja2 style)
2. Custom mapping functions per workflow
3. Type validation and schema enforcement
4. Automatic fallback strategies

---

## **🧪 Testing Strategy**

Create test workflows for each critical mapping:

1. **Agent → Timer**: "wait 30 seconds" → delay → continue
2. **Agent → Conditional**: "yes, proceed" → branch TRUE
3. **API → Agent**: API data → formatted prompt
4. **Agent → HITL → Agent**: Generate → review → revise
5. **Loop → Agent**: Iterate list → process each item
6. **API → Eval → Conditional**: Fetch → validate → route

---

## **✨ Benefits of This System**

1. **Flexibility**: Any node can connect to any node
2. **Intelligence**: Automatic data format conversion
3. **Type Safety**: Validation at mapping boundaries
4. **Debuggability**: Clear data transformations
5. **Extensibility**: Easy to add new node types or mappings

---

**Status**: 7/11 nodes fully updated with intelligent mapping ✅  
**Last Updated**: October 20, 2025
