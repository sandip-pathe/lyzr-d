# Migration Guide: Node Schema Refactoring

This guide helps you migrate existing workflows to the new simplified node schema.

## What Changed

### Removed Concepts

1. **`input_mapping` and `output_mapping`** - Removed from all nodes
   - Data now flows automatically from previous node to next node
   - No need to configure how data is passed

2. **Removed Node Types**:
   - `fork` - Use multiple outgoing edges instead
   - `meta` - Observability is now system-level
   - `hitl` - Replaced by `approval` node

3. **BaseNodeConfig** - No longer inherited
   - Each node type has its own specific config
   - No shared base properties

### New Required Properties

All nodes now require a `name` property that identifies them. This replaces the implicit identification by node ID.

### Property Changes by Node Type

#### Trigger Node
**Before**:
```json
{
  "type": "manual",
  "schedule": "0 9 * * *",
  "input_variables": {...}
}
```

**After**:
```json
{
  "name": "Daily Trigger",
  "type": "manual",
  "input_text": "optional simple text",
  "input_json": {...}
}
```

**Changes**:
- Added required `name` field
- Removed `schedule` and `webhook_url` (not used)
- Renamed `input_variables` to `input_json`
- Added `input_text` for simple text input

---

#### Agent Node
**Before**:
```json
{
  "provider": "openai",
  "agent_id": "gpt-4",
  "temperature": 0.7,
  "input_mapping": {
    "prompt": "{{previous_output.text}}"
  }
}
```

**After**:
```json
{
  "name": "Extract Data",
  "system_instructions": "Extract key information from the text",
  "temperature": 0.7,
  "expected_output_format": "JSON with fields: name, date, amount",
  "provider": "openai",
  "agent_id": "gpt-4"
}
```

**Changes**:
- Added required `name` field
- Added required `system_instructions` (replaces implicit prompt)
- Added `expected_output_format` for output validation
- Removed `input_mapping` (data flows automatically)
- `provider` and `agent_id` are now optional with defaults

---

#### API Call Node
**Before**:
```json
{
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": {...},
  "body_template": {...},
  "input_mapping": {...}
}
```

**After**:
```json
{
  "name": "Fetch User",
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": {...},
  "body": {...}
}
```

**Changes**:
- Added required `name` field
- Renamed `body_template` to `body`
- Removed `input_mapping` (previous output merged into body automatically)

---

#### Conditional Node
**Before**:
```json
{
  "condition_expression": "output.status == 'success'",
  "input_mapping": {...}
}
```

**After**:
```json
{
  "name": "Check Status",
  "condition_expression": "output.get('status') == 'success'"
}
```

**Changes**:
- Added required `name` field
- Removed `input_mapping`
- Expression evaluates `previous_output` automatically

---

#### Approval Node
**Before**:
```json
{
  "title": "Approval Required",
  "description": "Please approve",
  "approvers": ["user@example.com"],
  "channels": ["slack", "email"]
}
```

**After**:
```json
{
  "name": "Legal Review",
  "description": "Please review and approve"
}
```

**Changes**:
- Renamed `title` to `name`
- Removed `approvers` and `channels` (handled by system)
- Simplified to just name and description

---

#### Eval Node
**Before**:
```json
{
  "eval_type": "schema",
  "config": {...},
  "on_failure": "block",
  "input_mapping": {...}
}
```

**After**:
```json
{
  "name": "Validate Output",
  "eval_type": "schema",
  "config": {...},
  "on_failure": "block"
}
```

**Changes**:
- Added required `name` field
- Removed `input_mapping`

---

#### Merge Node
**Before**:
```json
{
  "merge_strategy": "combine"
}
```

**After**:
```json
{
  "name": "Combine Results",
  "merge_strategy": "combine"
}
```

**Changes**:
- Added required `name` field

---

#### Event Node
**Before**:
```json
{
  "operation": "publish",
  "channel": "results",
  "input_mapping": {...}
}
```

**After**:
```json
{
  "name": "Publish Result",
  "operation": "publish",
  "channel": "results"
}
```

**Changes**:
- Added required `name` field
- Removed `input_mapping`

---

#### Timer Node
**Before**:
```json
{
  "duration_seconds": 300
}
```

**After**:
```json
{
  "name": "Wait 5 Minutes",
  "duration_seconds": 300
}
```

**Changes**:
- Added required `name` field

---

#### End Node
**Before**:
```json
{}
```

**After**:
```json
{
  "name": "Workflow Complete",
  "capture_output": true,
  "show_output": true
}
```

**Changes**:
- Added required `name` field
- Added optional `capture_output` and `show_output`

---

## Migration Steps

### 1. Update Node Configs

For each node in your workflow:

1. Add a `name` property based on the node's label
2. Remove `input_mapping` and `output_mapping`
3. Update type-specific properties (see above)

### 2. Update Agent Nodes

Agent nodes require the most changes:

```javascript
// Before
{
  "provider": "openai",
  "agent_id": "gpt-4",
  "input_mapping": {
    "prompt": "Analyze this: {{previous_output}}"
  }
}

// After
{
  "name": "Analyze Data",
  "system_instructions": "Analyze the provided data and extract key insights",
  "provider": "openai",
  "agent_id": "gpt-4"
}
```

### 3. Update Conditional Expressions

Conditional expressions now have access to a simplified context:

```javascript
// Before (might have used complex mapping)
"nodes['previous_node_id'].output.status == 'success'"

// After (uses previous_output directly)
"output.get('status') == 'success'"
```

Available variables:
- `output` - Previous node's result
- `nodes` - All node outputs by ID
- `input` - Initial workflow input

### 4. Remove Fork Nodes

Replace fork nodes with direct branching:

```
Before:
  Node A → Fork → Node B
                → Node C
                → Node D

After:
  Node A → Node B
        → Node C
        → Node D
```

Just add multiple edges from Node A.

### 5. Replace HITL with Approval

```javascript
// Before
{
  "type": "hitl",
  "prompt": "Review this"
}

// After
{
  "type": "approval",
  "name": "Review Required",
  "description": "Please review this step"
}
```

---

## Example: Full Workflow Migration

### Before

```json
{
  "nodes": [
    {
      "id": "1",
      "type": "trigger",
      "data": {
        "config": {
          "type": "manual"
        }
      }
    },
    {
      "id": "2",
      "type": "agent",
      "data": {
        "config": {
          "provider": "openai",
          "agent_id": "gpt-4",
          "input_mapping": {
            "prompt": "{{input.text}}"
          }
        }
      }
    },
    {
      "id": "3",
      "type": "conditional",
      "data": {
        "config": {
          "condition_expression": "output.success == true"
        }
      }
    }
  ]
}
```

### After

```json
{
  "nodes": [
    {
      "id": "1",
      "type": "trigger",
      "data": {
        "label": "Start",
        "config": {
          "name": "Start Workflow",
          "type": "manual",
          "input_json": {}
        }
      }
    },
    {
      "id": "2",
      "type": "agent",
      "data": {
        "label": "Process",
        "config": {
          "name": "Process Input",
          "system_instructions": "Process the input text and extract key information",
          "provider": "openai",
          "agent_id": "gpt-4"
        }
      }
    },
    {
      "id": "3",
      "type": "conditional",
      "data": {
        "label": "Check Success",
        "config": {
          "name": "Check Success",
          "condition_expression": "output.get('success') == True"
        }
      }
    }
  ]
}
```

---

## Testing Your Migration

After migration:

1. **Validate Schemas**: Ensure all nodes have required `name` field
2. **Test Data Flow**: Verify data flows correctly between nodes
3. **Check Conditionals**: Test all conditional branches
4. **Verify Agent Prompts**: Ensure `system_instructions` produce expected outputs

---

## Rollback Plan

If you need to rollback:

1. The old code is available in git history
2. Database schema hasn't changed (workflow definitions are JSON)
3. Simply restore previous backend/frontend code

---

## Support

If you encounter issues during migration:

1. Check the `NODE_TYPES.md` documentation
2. Review example workflows in `frontend/lib/mock-data.ts`
3. Examine backend schemas in `backend/app/schemas/node_types.py`

---

**Last Updated**: October 20, 2025
