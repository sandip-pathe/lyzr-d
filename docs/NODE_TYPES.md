# Node Types and Properties

This document describes all available node types in the Lyzr workflow system and their required/optional properties.

## Overview

The workflow system supports 10 node types, each with specific properties that define their behavior:

1. **Trigger** - Entry point of the workflow
2. **Agent** - Executes LLM/AI reasoning
3. **API Call** - Integrates external APIs
4. **Conditional** - Branches workflow based on logic
5. **End** - Marks workflow completion
6. **Approval** - On-screen checkpoint for user decision
7. **Eval** - Validates output correctness
8. **Merge** - Combines outputs from multiple branches
9. **Event** - Publishes or subscribes to events
10. **Timer** - Pauses workflow for a fixed period

---

## Node Type Details

### 1. Trigger Node

**Purpose**: Entry point of the workflow. Provides initial data for downstream nodes.

**Status**: ✅ Fully Functional

**Required Properties**:
- `name` (string) - Identifies the trigger node

**Optional Properties**:
- `type` (string) - How workflow starts (`manual` or `event`). Default: `"manual"`
- `input_text` (string) - Simple user input text
- `input_json` (object) - Structured data for LLMs or API calls

**Example**:
```json
{
  "type": "trigger",
  "data": {
    "label": "Start Workflow",
    "config": {
      "name": "Start Workflow",
      "type": "manual",
      "input_json": {
        "documentUrl": "https://example.com/contract.pdf"
      }
    }
  }
}
```

**Why These Configs Matter**:
- `name` identifies the node
- `type` defines how workflow starts (manual/event)
- `input_text` allows simple user input
- `input_json` supports structured data for LLMs or API calls

---

### 2. Agent Node

**Purpose**: Executes LLM/AI reasoning step. Generates outputs used by other nodes.

**Status**: ✅ Fully Functional

**Required Properties**:
- `name` (string) - Identifies the agent step
- `system_instructions` (string) - Defines model behavior

**Optional Properties**:
- `temperature` (number, 0.0-1.0) - Controls creativity. Default: `0.7`
- `expected_output_format` (string) - Ensures predictable downstream parsing
- `provider` (string) - AI provider (e.g., "openai", "lyzr"). Default: `"openai"`
- `agent_id` (string) - Specific agent/model ID (e.g., "gpt-4o-mini"). Default: `"gpt-4o-mini"`

**Example**:
```json
{
  "type": "agent",
  "data": {
    "label": "Extract Clauses",
    "config": {
      "name": "Extract Clauses",
      "system_instructions": "Extract all contractual clauses and categorize them by type.",
      "temperature": 0.3,
      "expected_output_format": "JSON array with fields: clause_type, clause_text, risk_level",
      "provider": "openai",
      "agent_id": "gpt-4"
    }
  }
}
```

**Why These Configs Matter**:
- `name` identifies the step
- `temperature` controls creativity vs. determinism
- `system_instructions` define model behavior
- `expected_output_format` ensures predictable downstream parsing

---

### 3. API Call Node

**Purpose**: Integrates external APIs or internal services, fetches/enriches data.

**Status**: ✅ Fully Functional

**Required Properties**:
- `name` (string) - Identifies the API call step
- `url` (string) - Points to endpoint

**Optional Properties**:
- `method` (string) - HTTP method. Default: `"POST"`
- `headers` (object) - Support auth/content-type. Default: `{}`
- `body` (object) - Passes payload data (optional for GET)

**Example**:
```json
{
  "type": "api_call",
  "data": {
    "label": "Fetch User Data",
    "config": {
      "name": "Fetch User Data",
      "url": "https://api.example.com/users",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer token123",
        "Content-Type": "application/json"
      },
      "body": {
        "userId": "{{previous_output.user_id}}"
      }
    }
  }
}
```

**Why These Configs Matter**:
- `url` points to endpoint
- `method` ensures correct HTTP verb
- `headers` support auth/content-type
- `body` passes payload data

---

### 4. Conditional Node

**Purpose**: Branches workflow based on logic (if/else).

**Status**: ✅ Fully Functional

**Required Properties**:
- `name` (string) - Identifies the conditional step
- `condition_expression` (string) - Evaluates runtime state to determine flow path

**Example**:
```json
{
  "type": "conditional",
  "data": {
    "label": "Check Approval Status",
    "config": {
      "name": "Check Approval Status",
      "condition_expression": "output.get('status') == 'approved'"
    }
  }
}
```

**Handles**:
- `true` - Connects to node executed if condition is true
- `false` - Connects to node executed if condition is false

**Available Context in Expression**:
- `output` - Result of the immediately preceding node
- `nodes` - Outputs of all completed nodes by ID
- `input` - Initial workflow input

**Why These Configs Matter**:
- `condition_expression` evaluates runtime state to determine flow path
- Core for decision-making in workflows

---

### 5. End Node

**Purpose**: Marks workflow completion and optionally captures/displays result.

**Status**: ✅ Fully Functional

**Required Properties**:
- `name` (string) - Identifies the end node

**Optional Properties**:
- `capture_output` (boolean) - Allows saving result. Default: `false`
- `show_output` (boolean) - Allows UI display to user. Default: `true`

**Example**:
```json
{
  "type": "end",
  "data": {
    "label": "Complete",
    "config": {
      "name": "Complete",
      "capture_output": true,
      "show_output": true
    }
  }
}
```

**Why These Configs Matter**:
- `capture_output` allows saving result
- `show_output` allows UI display to user

---

### 6. Approval Node

**Purpose**: On-screen checkpoint for user decision. Pauses workflow until approved/rejected.

**Status**: ⚙️ Partially Functional (UI integration pending)

**Required Properties**:
- `name` (string) - Identifies the approval step
- `description` (string) - Gives context to the user

**Example**:
```json
{
  "type": "approval",
  "data": {
    "label": "Legal Review",
    "config": {
      "name": "Legal Review",
      "description": "Please review the contract for legal compliance before proceeding."
    }
  }
}
```

**Handles**:
- `approve` - Connects to node executed if approved
- `reject` - Connects to node executed if rejected

**Why These Configs Matter**:
- `name` identifies step
- `description` gives context to the user
- Can be simulated with Conditional node

**Note**: Currently requires manual signal to Temporal workflow. Full UI integration in progress.

---

### 7. Eval Node

**Purpose**: Validates output correctness or structure.

**Status**: ⚙️ Partially Functional (Service implementation needed)

**Required Properties**:
- `name` (string) - Identifies the eval step
- `eval_type` (string) - Selects strategy (`"schema"`, `"llm_judge"`, `"policy"`)
- `on_failure` (string) - Defines fallback behavior (`"block"`, `"warn"`, `"retry"`, `"compensate"`)

**Optional Properties**:
- `config` (object) - Passes thresholds/rules. Default: `{}`

**Example**:
```json
{
  "type": "eval",
  "data": {
    "label": "Validate Output",
    "config": {
      "name": "Validate Output",
      "eval_type": "schema",
      "config": {
        "required_fields": ["clause_type", "clause_text"],
        "min_items": 1
      },
      "on_failure": "block"
    }
  }
}
```

**Eval Types**:
- `schema` - Validates against JSON schema
- `llm_judge` - Uses LLM to judge quality
- `policy` - Checks against business rules

**Why These Configs Matter**:
- `eval_type` selects strategy
- `config` passes thresholds/rules
- `on_failure` defines fallback behavior

---

### 8. Merge Node

**Purpose**: Combines outputs from multiple parallel branches.

**Status**: ⚙️ Partially Functional (Parallel execution not implemented)

**Required Properties**:
- `name` (string) - Identifies the merge step
- `merge_strategy` (string) - Defines how branch results are reconciled

**Merge Strategies**:
- `"combine"` - Merges all results into an array
- `"first"` - Takes the first completed result
- `"vote"` - Selects most common result

**Example**:
```json
{
  "type": "merge",
  "data": {
    "label": "Combine Results",
    "config": {
      "name": "Combine Results",
      "merge_strategy": "combine"
    }
  }
}
```

**Why These Configs Matter**:
- `merge_strategy` defines how branch results are reconciled

**Note**: Currently executes sequentially. True parallel execution requires Temporal child workflows.

---

### 9. Event Node

**Purpose**: Publishes or subscribes to events for async workflows.

**Status**: ⚙️ Partially Functional (Subscribe not implemented)

**Required Properties**:
- `name` (string) - Identifies the event step
- `operation` (string) - Selects `"publish"` or `"subscribe"`
- `channel` (string) - Acts as topic key

**Example**:
```json
{
  "type": "event",
  "data": {
    "label": "Publish Result",
    "config": {
      "name": "Publish Result",
      "operation": "publish",
      "channel": "contract.processed"
    }
  }
}
```

**Why These Configs Matter**:
- `operation` selects publish/subscribe
- `channel` acts as topic key for event routing

**Note**: Subscribe operation not fully implemented yet.

---

### 10. Timer Node

**Purpose**: Pauses workflow for a fixed period.

**Status**: ✅ Fully Functional

**Required Properties**:
- `name` (string) - Identifies the timer step
- `duration_seconds` (number) - Controls delay timing

**Example**:
```json
{
  "type": "timer",
  "data": {
    "label": "Wait 5 Minutes",
    "config": {
      "name": "Wait 5 Minutes",
      "duration_seconds": 300
    }
  }
}
```

**Why These Configs Matter**:
- `duration_seconds` controls delay timing
- Useful for pacing or external dependencies

---

## Removed Node Types

The following node types have been removed from the system:

- **Fork** - Not needed; use multiple edges from a single node for branching
- **Meta** - Observability moved to system-level metrics
- **HITL** - Replaced by Approval node

---

## Data Flow Between Nodes

Nodes communicate through the workflow state:

1. **Trigger Node**: Provides initial `input_data` from `input_text` or `input_json`
2. **Intermediate Nodes**: Receive `previous_output` (result of the previous node in the chain)
3. **Agent/API Call**: Process input and return structured output
4. **Conditional**: Evaluates `previous_output` to determine next path
5. **Merge**: Combines multiple `node_outputs` by ID
6. **End**: Captures final `previous_output` as workflow result

**Example Flow**:
```
Trigger (provides input) 
  → Agent (processes input) 
  → Eval (validates agent output) 
  → Conditional (checks if passed)
    → [true] API Call (sends result)
    → [false] End (terminates)
```

---

## Backend Implementation

All node configs are defined in:
- **Backend**: `backend/app/schemas/node_types.py`
- **Frontend**: `frontend/types/workflow.ts`

Node execution logic is in:
- **Activities**: `backend/app/temporal/activities.py`
- **Workflow**: `backend/app/temporal/workflows.py`

---

## Adding New Node Types

To add a new node type:

1. Add to `NodeType` enum in `backend/app/schemas/node_types.py`
2. Create config class inheriting from `BaseModel`
3. Add to `NODE_TYPE_SCHEMAS` dictionary
4. Implement activity in `backend/app/temporal/activities.py`
5. Add execution case in `backend/app/temporal/workflows.py`
6. Update frontend types in `frontend/types/workflow.ts`
7. Add to node palette in `frontend/lib/mock-data.ts`

---

## Version

This documentation reflects the node schema as of the latest refactoring (removing config-based input/output mapping in favor of explicit properties).

**Last Updated**: October 20, 2025
