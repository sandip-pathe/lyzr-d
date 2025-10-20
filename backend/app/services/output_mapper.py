"""
Output Mapper Service - Intelligent output transformation between nodes
"""
from typing import Any, Dict, Type, Optional
from datetime import datetime, timedelta
from app.schemas.node_outputs import (
    BaseNodeOutput, TriggerOutput, AgentOutput, TimerOutput,
    ConditionOutput, LoopOutput, MergeOutput, APICallOutput,
    EvalOutput, ApprovalOutput, EndOutput, EventOutput, MetaOutput, NodeOutput
)
import json
import re
# from dateutil import parser as date_parser  # Temporarily disabled - Docker image doesn't have it


class OutputMapper:
    """
    Maps node outputs to standardized schemas and provides
    intelligent field extraction for downstream nodes.
    """
    
    OUTPUT_SCHEMAS: Dict[str, Type[BaseNodeOutput]] = {
        "trigger": TriggerOutput,
        "agent": AgentOutput,
        "timer": TimerOutput,
        "conditional": ConditionOutput,
        "loop": LoopOutput,
        "merge": MergeOutput,
        "api_call": APICallOutput,
        "eval": EvalOutput,
        "approval": ApprovalOutput,
        "end": EndOutput,
        "event": EventOutput,
        "meta": MetaOutput,
    }
    
    @classmethod
    def map_output(
        cls, 
        node_type: str, 
        raw_output: Any, 
        node_id: str,
        node_config: Optional[Dict[str, Any]] = None
    ) -> BaseNodeOutput:
        """Convert raw node output to schema"""
        schema_class = cls.OUTPUT_SCHEMAS.get(node_type, BaseNodeOutput)
        
        try:
            # Ensure raw_output is a dict
            if not isinstance(raw_output, dict):
                raw_output = {"value": raw_output}
            
            # Special handling for trigger nodes
            if node_type == "trigger":
                output_data = {
                    "node_id": node_id,
                    "node_type": "trigger",
                    "timestamp": datetime.now(),
                    "raw_output": raw_output,
                    "input_data": raw_output,  # The trigger's raw output IS the input data
                    "trigger_type": node_config.get("trigger_type", "manual") if node_config else "manual"
                }
            else:
                output_data = {
                    "node_id": node_id,
                    "node_type": node_type,
                    "timestamp": datetime.now(),
                    "raw_output": raw_output,
                    **raw_output  # Unpack the output into schema fields
                }
            
            return schema_class(**output_data)
        except Exception as e:
            print(f"[OutputMapper] Error mapping {node_type} output: {e}")
            # Fallback to base output
            return BaseNodeOutput(
                node_id=node_id,
                node_type=node_type,
                timestamp=datetime.now(),
                raw_output=raw_output,
                error=str(e)
            )
    
    @classmethod
    def extract_for_target(
        cls, 
        output: BaseNodeOutput, 
        target_node_type: str,
        target_config: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Intelligently extract the right value for a target node.
        
        Examples:
        - Agent → Timer: Extract datetime from agent's text output
        - Agent → Condition: Extract boolean/comparison value
        - Loop → Agent: Extract current_item as prompt
        - API → Agent: Extract response body as context
        """
        
        # Mapping rules: source_type → target_type → extraction_function
        MAPPING_RULES = {
            "trigger": {
                "agent": cls._trigger_to_agent,
                "timer": cls._trigger_to_timer,
                "conditional": cls._trigger_to_condition,
                "api_call": cls._trigger_to_api,
            },
            "agent": {
                "agent": cls._agent_to_agent,  # Chain agents
                "timer": cls._agent_to_timer,
                "conditional": cls._agent_to_condition,
                "api_call": cls._agent_to_api,
                "eval": cls._agent_to_eval,
            },
            "timer": {
                "agent": cls._timer_to_agent,
                "api_call": cls._timer_to_api,
            },
            "conditional": {
                "agent": cls._condition_to_agent,
            },
            "loop": {
                "agent": cls._loop_to_agent,
                "api_call": cls._loop_to_api,
                "conditional": cls._loop_to_condition,
            },
            "api_call": {
                "agent": cls._api_to_agent,
                "conditional": cls._api_to_condition,
                "eval": cls._api_to_eval,
            },
            "eval": {
                "conditional": cls._eval_to_condition,
                "agent": cls._eval_to_agent,
            },
            "approval": {
                "conditional": cls._approval_to_condition,
                "agent": cls._approval_to_agent,
            },
            "merge": {
                "agent": cls._merge_to_agent,
                "api_call": cls._merge_to_api,
            },
            "event": {
                "agent": cls._event_to_agent,
            }
        }
        
        source_type = output.node_type
        mapping_func = MAPPING_RULES.get(source_type, {}).get(target_node_type)
        
        if mapping_func:
            try:
                return mapping_func(output, target_config)
            except Exception as e:
                print(f"[OutputMapper] Error in mapping {source_type}→{target_node_type}: {e}")
        
        # Fallback strategies
        return cls._fallback_extraction(output, target_node_type)
    
    # ==================== TRIGGER CONVERSIONS ====================
    
    @staticmethod
    def _trigger_to_agent(output: TriggerOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Trigger → Agent: Pass input as prompt"""
        return {
            "prompt": output.text_content,
            "context": output.input_data
        }
    
    @staticmethod
    def _trigger_to_timer(output: TriggerOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Trigger → Timer: Extract scheduling info"""
        if "scheduled_time" in output.input_data:
            return {"scheduled_time": output.input_data["scheduled_time"]}
        if "delay_seconds" in output.input_data:
            return {"delay_seconds": output.input_data["delay_seconds"]}
        return {"delay_seconds": 0}  # Execute immediately
    
    @staticmethod
    def _trigger_to_condition(output: TriggerOutput, config: Optional[Dict] = None) -> Any:
        """Trigger → Condition: Pass data for evaluation"""
        return output.input_data
    
    @staticmethod
    def _trigger_to_api(output: TriggerOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Trigger → API: Pass as request body"""
        return {"body": output.input_data}
    
    # ==================== AGENT CONVERSIONS ====================
    
    @staticmethod
    def _agent_to_agent(output: AgentOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Agent → Agent: Chain the output"""
        return {
            "prompt": output.output,
            "previous_agent_output": output.output,
            "cost_so_far": output.cost
        }
    
    @staticmethod
    def _agent_to_timer(output: AgentOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Agent → Timer: Parse datetime from agent output"""
        text = output.output
        
        # Try to find ISO format datetime
        iso_match = re.search(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', text)
        if iso_match:
            try:
                dt = datetime.fromisoformat(iso_match.group())
                return {"scheduled_time": dt.isoformat()}
            except:
                pass
        
        # Try to find delay in seconds/minutes/hours
        delay_match = re.search(r'(\d+)\s*(second|minute|hour|day)s?', text, re.IGNORECASE)
        if delay_match:
            amount = int(delay_match.group(1))
            unit = delay_match.group(2).lower()
            multiplier = {"second": 1, "minute": 60, "hour": 3600, "day": 86400}
            delay_seconds = amount * multiplier.get(unit, 1)
            return {"delay_seconds": delay_seconds}
        
        # Default: 0 seconds delay
        return {"delay_seconds": 0}
        
        # Default: 1 hour from now
        future_time = datetime.now() + timedelta(hours=1)
        return {"scheduled_time": future_time.isoformat()}
    
    @staticmethod
    def _agent_to_condition(output: AgentOutput, config: Optional[Dict] = None) -> Any:
        """Agent → Condition: Parse boolean/decision from text"""
        text = output.output.lower()
        
        # Check for explicit yes/no, true/false
        if any(word in text for word in ["yes", "true", "correct", "affirmative", "approve", "accept"]):
            return True
        if any(word in text for word in ["no", "false", "incorrect", "negative", "reject", "deny"]):
            return False
        
        # Check for JSON boolean
        try:
            parsed = json.loads(output.output)
            if isinstance(parsed, bool):
                return parsed
            if isinstance(parsed, dict) and "result" in parsed:
                return bool(parsed["result"])
        except:
            pass
        
        # Default: True if non-empty output
        return bool(output.output.strip())
    
    @staticmethod
    def _agent_to_api(output: AgentOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Agent → API: Use output as request body"""
        try:
            # Try to parse as JSON
            parsed = json.loads(output.output)
            return {"body": parsed}
        except:
            # Use as text
            return {"body": {"content": output.output}}
    
    @staticmethod
    def _agent_to_eval(output: AgentOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Agent → Eval: Pass output for evaluation"""
        return {
            "content": output.output,
            "metadata": {
                "model": output.model,
                "cost": output.cost,
                "tokens": output.token_count
            }
        }
    
    # ==================== TIMER CONVERSIONS ====================
    
    @staticmethod
    def _timer_to_agent(output: TimerOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Timer → Agent: Notify about scheduling"""
        return {
            "prompt": f"Task scheduled for {output.scheduled_time.strftime('%Y-%m-%d %H:%M:%S')}",
            "scheduled_time": output.scheduled_time.isoformat()
        }
    
    @staticmethod
    def _timer_to_api(output: TimerOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Timer → API: Include scheduling info in request"""
        return {
            "body": {
                "scheduled_at": output.scheduled_time.isoformat(),
                "next_run": output.next_run.isoformat() if output.next_run else None
            }
        }
    
    # ==================== CONDITION CONVERSIONS ====================
    
    @staticmethod
    def _condition_to_agent(output: ConditionOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Condition → Agent: Report condition result"""
        return {
            "prompt": f"Condition evaluated to: {output.branch}. Details: {output.evaluation}",
            "condition_result": output.condition_met
        }
    
    # ==================== LOOP CONVERSIONS ====================
    
    @staticmethod
    def _loop_to_agent(output: LoopOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Loop → Agent: Pass current item"""
        return {
            "prompt": str(output.current_item),
            "iteration": output.iteration,
            "context": f"Processing item {output.iteration} of {output.total_items}"
        }
    
    @staticmethod
    def _loop_to_api(output: LoopOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Loop → API: Pass current item as body"""
        return {
            "body": {
                "item": output.current_item,
                "iteration": output.iteration
            }
        }
    
    @staticmethod
    def _loop_to_condition(output: LoopOutput, config: Optional[Dict] = None) -> Any:
        """Loop → Condition: Check if has more items"""
        return output.has_more
    
    # ==================== API CALL CONVERSIONS ====================
    
    @staticmethod
    def _api_to_agent(output: APICallOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """API → Agent: Pass response as context"""
        return {
            "prompt": f"API response (status {output.status_code}): {output.text_content}",
            "api_response": output.body,
            "status_code": output.status_code
        }
    
    @staticmethod
    def _api_to_condition(output: APICallOutput, config: Optional[Dict] = None) -> Any:
        """API → Condition: Check if request was successful"""
        return output.is_success
    
    @staticmethod
    def _api_to_eval(output: APICallOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """API → Eval: Evaluate response quality"""
        return {
            "content": output.body,
            "metadata": {
                "status_code": output.status_code,
                "response_time_ms": output.response_time_ms,
                "url": output.url
            }
        }
    
    # ==================== EVAL CONVERSIONS ====================
    
    @staticmethod
    def _eval_to_condition(output: EvalOutput, config: Optional[Dict] = None) -> Any:
        """Eval → Condition: Check if evaluation passed"""
        return output.passed
    
    @staticmethod
    def _eval_to_agent(output: EvalOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Eval → Agent: Provide feedback"""
        return {
            "prompt": f"Evaluation result: {'Passed' if output.passed else 'Failed'}. Score: {output.score}. Feedback: {output.feedback}",
            "eval_passed": output.passed,
            "eval_score": output.score
        }
    
    # ==================== APPROVAL CONVERSIONS ====================
    
    @staticmethod
    def _approval_to_condition(output: ApprovalOutput, config: Optional[Dict] = None) -> Any:
        """Approval → Condition: Check if approved"""
        return output.approved
    
    @staticmethod
    def _approval_to_agent(output: ApprovalOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Approval → Agent: Report approval status"""
        status = "approved" if output.approved else "rejected"
        by_whom = f" by {output.approver}" if output.approver else ""
        comments = f". Comments: {output.comments}" if output.comments else ""
        
        return {
            "prompt": f"Request was {status}{by_whom}{comments}",
            "approved": output.approved
        }
    
    # ==================== MERGE CONVERSIONS ====================
    
    @staticmethod
    def _merge_to_agent(output: MergeOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Merge → Agent: Pass combined data"""
        return {
            "prompt": f"Merged data from {len(output.sources)} sources: {json.dumps(output.merged_data, indent=2)}",
            "merged_data": output.merged_data
        }
    
    @staticmethod
    def _merge_to_api(output: MergeOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Merge → API: Send merged data"""
        return {"body": output.merged_data}
    
    # ==================== EVENT CONVERSIONS ====================
    
    @staticmethod
    def _event_to_agent(output: EventOutput, config: Optional[Dict] = None) -> Dict[str, Any]:
        """Event → Agent: Pass event data"""
        return {
            "prompt": f"Event '{output.event_name}' published with data: {json.dumps(output.event_data)}",
            "event_data": output.event_data
        }
    
    # ==================== FALLBACK ====================
    
    @staticmethod
    def _fallback_extraction(output: BaseNodeOutput, target_type: str) -> Any:
        """Fallback: try to extract something useful"""
        # Try text_content property if available
        if hasattr(output, 'text_content'):
            text = output.text_content
            if target_type == "agent":
                return {"prompt": text}
            return text
        
        # Return raw output
        return output.raw_output


# Create singleton instance
output_mapper = OutputMapper()
