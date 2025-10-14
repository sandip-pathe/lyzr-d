"""Evaluation and compliance service"""
import json
from jsonschema import validate, ValidationError
from typing import Dict, Any, Optional, List
from openai import AsyncOpenAI
from app.core.config import settings

class EvalService:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def evaluate(
        self, 
        eval_type: str, 
        data: Dict[str, Any], 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Run evaluation based on type
        Returns: {"passed": bool, "score": float, "reason": str, "data": Any}
        """
        if eval_type == "schema":
            return await self._eval_schema(data, config)
        elif eval_type == "llm_judge":
            return await self._eval_llm_judge(data, config)
        elif eval_type == "policy":
            return await self._eval_policy(data, config)
        elif eval_type == "custom":
            return await self._eval_custom(data, config)
        else:
            return {"passed": False, "score": 0.0, "reason": f"Unknown eval type: {eval_type}"}
    
    async def _eval_schema(self, data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate against JSON schema"""
        schema_def = config.get("schema_def", {})
        try:
            validate(instance=data, schema=schema_def)
            return {
                "passed": True,
                "score": 1.0,
                "reason": "Schema validation passed",
                "data": data
            }
        except ValidationError as e:
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"Schema validation failed: {e.message}",
                "data": {"error": e.message, "path": list(e.path)}
            }
    
    async def _eval_llm_judge(self, data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Use LLM to judge quality"""
        prompt = config.get("llm_judge_prompt", "")
        threshold = config.get("confidence_threshold", 0.8)
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an evaluator. Respond with a JSON object containing 'score' (0.0-1.0), 'passed' (boolean), and 'reason' (string)."},
                    {"role": "user", "content": f"{prompt}\n\nData to evaluate:\n{json.dumps(data, indent=2)}"}
                ],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            if content is None:
                raise ValueError("LLM returned empty response")
            
            result = json.loads(content)
            score = float(result.get("score", 0))
            passed = score >= threshold
            
            return {
                "passed": passed,
                "score": score,
                "reason": result.get("reason", "LLM evaluation completed"),
                "data": result
            }
        except Exception as e:
            return {
                "passed": False,
                "score": 0.0,
                "reason": f"LLM judge failed: {str(e)}",
                "data": {"error": str(e)}
            }

    
    async def _eval_policy(self, data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Check against policy rules"""
        policy_rules = config.get("policy_rules", [])
        failed_rules = []
        
        for rule in policy_rules:
            rule_type = rule.get("type")
            
            if rule_type == "cost_limit":
                max_cost = rule.get("max_cost", float('inf'))
                current_cost = data.get("cost", 0)
                if current_cost > max_cost:
                    failed_rules.append(f"Cost ${current_cost} exceeds limit ${max_cost}")
            
            elif rule_type == "confidence_threshold":
                min_confidence = rule.get("min_confidence", 0.0)
                confidence = data.get("confidence", 0.0)
                if confidence < min_confidence:
                    failed_rules.append(f"Confidence {confidence} below threshold {min_confidence}")
            
            elif rule_type == "pii_detection":
                # Simple PII detection (enhance with real library)
                content = str(data)
                if any(pattern in content.lower() for pattern in ["ssn", "credit card", "password"]):
                    failed_rules.append("Potential PII detected")
        
        passed = len(failed_rules) == 0
        return {
            "passed": passed,
            "score": 1.0 if passed else 0.0,
            "reason": "All policies passed" if passed else f"Failed: {', '.join(failed_rules)}",
            "data": {"failed_rules": failed_rules}
        }
    
    async def _eval_custom(self, data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Custom evaluation logic (extensible)"""
        # Placeholder for custom eval functions
        return {
            "passed": True,
            "score": 1.0,
            "reason": "Custom eval not implemented",
            "data": data
        }
