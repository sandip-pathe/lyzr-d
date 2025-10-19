# Quick Reference: Node Properties

## All Node Types at a Glance

### 1. Trigger
```json
{
  "name": "Start Workflow",          // REQUIRED
  "type": "manual",                  // "manual" | "event"
  "input_text": "optional text",     // Optional
  "input_json": { }                  // Optional
}
```

### 2. Agent
```json
{
  "name": "Process Data",                    // REQUIRED
  "system_instructions": "Extract info",     // REQUIRED
  "temperature": 0.7,                        // Optional (0.0-1.0)
  "expected_output_format": "JSON",          // Optional
  "provider": "openai",                      // Optional
  "agent_id": "gpt-4o-mini"                  // Optional
}
```

### 3. API Call
```json
{
  "name": "Fetch Data",                      // REQUIRED
  "url": "https://api.example.com",          // REQUIRED
  "method": "POST",                          // Optional (GET|POST|PUT|DELETE|PATCH)
  "headers": { },                            // Optional
  "body": { }                                // Optional
}
```

### 4. Conditional
```json
{
  "name": "Check Status",                              // REQUIRED
  "condition_expression": "output.get('status') == 'approved'"  // REQUIRED
}
```
**Handles**: `true`, `false`

### 5. End
```json
{
  "name": "Complete",                        // REQUIRED
  "capture_output": true,                    // Optional
  "show_output": true                        // Optional
}
```

### 6. Approval
```json
{
  "name": "Review Required",                 // REQUIRED
  "description": "Please approve"            // REQUIRED
}
```
**Handles**: `approve`, `reject`

### 7. Eval
```json
{
  "name": "Validate",                        // REQUIRED
  "eval_type": "schema",                     // REQUIRED (schema|llm_judge|policy)
  "config": { },                             // Optional
  "on_failure": "block"                      // REQUIRED (block|warn|retry|compensate)
}
```

### 8. Merge
```json
{
  "name": "Combine Results",                 // REQUIRED
  "merge_strategy": "combine"                // REQUIRED (combine|first|vote)
}
```

### 9. Event
```json
{
  "name": "Publish Event",                   // REQUIRED
  "operation": "publish",                    // REQUIRED (publish|subscribe)
  "channel": "results"                       // REQUIRED
}
```

### 10. Timer
```json
{
  "name": "Wait",                            // REQUIRED
  "duration_seconds": 300                    // REQUIRED
}
```

---

## Context Variables in Conditional Expressions

```python
# Available in condition_expression:
output          # Previous node's output (dict)
nodes           # All node outputs by ID (dict)
input           # Initial workflow input (dict)

# Example expressions:
"output.get('status') == 'success'"
"nodes['agent-1'].get('score', 0) > 0.8"
"input.get('priority') == 'high'"
"len(output.get('items', [])) > 0"
```

---

## Common Patterns

### Sequential Chain
```
Trigger → Agent → Eval → End
```

### Conditional Branch
```
Trigger → Agent → Conditional
                    ├─ [true] → API Call → End
                    └─ [false] → End
```

### Approval Flow
```
Trigger → Agent → Approval
                    ├─ [approve] → API Call → End
                    └─ [reject] → End
```

### Validation with Retry
```
Trigger → Agent → Eval (on_failure="retry") → End
```

---

## Data Flow

Each node receives `previous_output` from the node before it:

```
Trigger
  ↓ (provides input_json)
Agent
  ↓ (provides { output: "...", model: "...", cost: ... })
Eval
  ↓ (provides { passed: true, score: 0.95, ... })
End
  ↓ (captures final output)
```

---

## Default Values

| Node | Property | Default |
|------|----------|---------|
| Trigger | type | "manual" |
| Agent | temperature | 0.7 |
| Agent | provider | "openai" |
| Agent | agent_id | "gpt-4o-mini" |
| API Call | method | "POST" |
| API Call | headers | {} |
| End | capture_output | false |
| End | show_output | true |
| Eval | config | {} |

---

## Status Icons

✅ **Fully Functional**: Trigger, Agent, API Call, Conditional, End, Timer  
⚙️ **Partial**: Approval (UI pending), Eval (service pending), Merge (parallel pending), Event (subscribe pending)

---

**Quick Tip**: All nodes must have a unique `name` field. Use descriptive names like "Extract Customer Data" instead of generic names like "Agent 1".
