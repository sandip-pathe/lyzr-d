"""
Workflow Templates - Pre-built workflows with real working nodes
"""
from typing import List, Dict, Any
import uuid

def generate_node_id() -> str:
    """Generate a unique node ID"""
    return str(uuid.uuid4())

def get_workflow_templates() -> List[Dict[str, Any]]:
    """Get all pre-built workflow templates"""
    return [
        get_sentiment_analysis_template(),
        get_data_enrichment_template(),
        get_content_moderation_template(),
        get_multi_agent_research_template(),
        get_approval_workflow_template(),
    ]

def get_sentiment_analysis_template() -> Dict[str, Any]:
    """Sentiment Analysis Pipeline with OpenAI"""
    trigger_id = generate_node_id()
    api_call_id = generate_node_id()
    agent_id = generate_node_id()
    conditional_id = generate_node_id()
    end_positive_id = generate_node_id()
    end_negative_id = generate_node_id()
    
    return {
        "id": "template-sentiment-analysis",
        "name": "🎭 Sentiment Analysis Pipeline",
        "description": "Analyze customer feedback sentiment using AI and route to appropriate teams",
        "category": "ai-analysis",
        "definition": {
            "nodes": [
                {
                    "id": trigger_id,
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "Customer Feedback",
                        "config": {
                            "trigger_type": "manual",
                            "input_schema": {
                                "feedback_text": "string",
                                "customer_id": "string"
                            }
                        }
                    }
                },
                {
                    "id": agent_id,
                    "type": "agent",
                    "position": {"x": 100, "y": 250},
                    "data": {
                        "label": "Sentiment Analyzer",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": """You are a sentiment analysis expert. Analyze the customer feedback and respond with ONLY a JSON object:
{
  "sentiment": "positive" or "negative" or "neutral",
  "confidence": 0.0 to 1.0,
  "key_emotions": ["emotion1", "emotion2"],
  "summary": "brief summary of the feedback"
}""",
                            "user_prompt": "Analyze this customer feedback: {{trigger.feedback_text}}",
                            "temperature": 0.3
                        }
                    }
                },
                {
                    "id": conditional_id,
                    "type": "conditional",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "Route by Sentiment",
                        "config": {
                            "condition": "output.get('sentiment') == 'positive'"
                        }
                    }
                },
                {
                    "id": end_positive_id,
                    "type": "end",
                    "position": {"x": 300, "y": 550},
                    "data": {
                        "label": "✅ Positive Feedback",
                        "config": {
                            "output_message": "Feedback routed to customer success team"
                        }
                    }
                },
                {
                    "id": end_negative_id,
                    "type": "end",
                    "position": {"x": -100, "y": 550},
                    "data": {
                        "label": "⚠️ Negative Feedback",
                        "config": {
                            "output_message": "Urgent: Feedback routed to support escalation"
                        }
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": trigger_id, "target": agent_id, "type": "default"},
                {"id": "e2", "source": agent_id, "target": conditional_id, "type": "default"},
                {"id": "e3", "source": conditional_id, "target": end_positive_id, "type": "success", "label": "Positive"},
                {"id": "e4", "source": conditional_id, "target": end_negative_id, "type": "failure", "label": "Negative"}
            ]
        }
    }

def get_data_enrichment_template() -> Dict[str, Any]:
    """Data Enrichment with Free APIs"""
    trigger_id = generate_node_id()
    api_weather_id = generate_node_id()
    api_company_id = generate_node_id()
    merge_id = generate_node_id()
    agent_id = generate_node_id()
    end_id = generate_node_id()
    
    return {
        "id": "template-data-enrichment",
        "name": "📊 Data Enrichment Pipeline",
        "description": "Enrich lead data with weather, company info, and AI-generated insights",
        "category": "data-processing",
        "definition": {
            "nodes": [
                {
                    "id": trigger_id,
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "Lead Input",
                        "config": {
                            "trigger_type": "manual",
                            "input_schema": {
                                "email": "string",
                                "company_domain": "string",
                                "city": "string"
                            }
                        }
                    }
                },
                {
                    "id": api_weather_id,
                    "type": "api_call",
                    "position": {"x": -100, "y": 250},
                    "data": {
                        "label": "Get Weather",
                        "config": {
                            "method": "GET",
                            "url": "https://wttr.in/{{trigger.city}}?format=j1",
                            "headers": {"User-Agent": "curl"}
                        }
                    }
                },
                {
                    "id": api_company_id,
                    "type": "api_call",
                    "position": {"x": 300, "y": 250},
                    "data": {
                        "label": "Company Info",
                        "config": {
                            "method": "GET",
                            "url": "https://companies.tycoon.io/api/company/{{trigger.company_domain}}",
                            "headers": {}
                        }
                    }
                },
                {
                    "id": merge_id,
                    "type": "merge",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "Combine Data",
                        "config": {
                            "strategy": "all"
                        }
                    }
                },
                {
                    "id": agent_id,
                    "type": "agent",
                    "position": {"x": 100, "y": 550},
                    "data": {
                        "label": "Generate Insights",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": """You are a sales intelligence analyst. Based on the weather and company data provided, generate a personalized outreach message. Respond with JSON:
{
  "insights": ["insight1", "insight2"],
  "talking_points": ["point1", "point2"],
  "recommended_approach": "brief strategy"
}""",
                            "user_prompt": "Weather: {{api_weather.current_condition[0].temp_C}}°C, Company: {{api_company.name}}",
                            "temperature": 0.7
                        }
                    }
                },
                {
                    "id": end_id,
                    "type": "end",
                    "position": {"x": 100, "y": 700},
                    "data": {
                        "label": "Enriched Lead",
                        "config": {
                            "output_message": "Lead enrichment complete"
                        }
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": trigger_id, "target": api_weather_id, "type": "default"},
                {"id": "e2", "source": trigger_id, "target": api_company_id, "type": "default"},
                {"id": "e3", "source": api_weather_id, "target": merge_id, "type": "default"},
                {"id": "e4", "source": api_company_id, "target": merge_id, "type": "default"},
                {"id": "e5", "source": merge_id, "target": agent_id, "type": "default"},
                {"id": "e6", "source": agent_id, "target": end_id, "type": "default"}
            ]
        }
    }

def get_content_moderation_template() -> Dict[str, Any]:
    """Content Moderation with AI"""
    trigger_id = generate_node_id()
    agent_check_id = generate_node_id()
    conditional_id = generate_node_id()
    approval_id = generate_node_id()
    agent_explain_id = generate_node_id()
    end_approved_id = generate_node_id()
    end_rejected_id = generate_node_id()
    
    return {
        "id": "template-content-moderation",
        "name": "🛡️ AI Content Moderation",
        "description": "Automated content moderation with human approval for edge cases",
        "category": "moderation",
        "definition": {
            "nodes": [
                {
                    "id": trigger_id,
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "User Content",
                        "config": {
                            "trigger_type": "manual",
                            "input_schema": {
                                "content": "string",
                                "user_id": "string",
                                "content_type": "string"
                            }
                        }
                    }
                },
                {
                    "id": agent_check_id,
                    "type": "agent",
                    "position": {"x": 100, "y": 250},
                    "data": {
                        "label": "AI Moderator",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": """You are a content moderation AI. Analyze content for violations. Respond with ONLY JSON:
{
  "is_safe": true or false,
  "confidence": 0.0 to 1.0,
  "violations": ["type1", "type2"] or [],
  "severity": "low" or "medium" or "high",
  "requires_review": true or false
}""",
                            "user_prompt": "Moderate this content: {{trigger.content}}",
                            "temperature": 0.1
                        }
                    }
                },
                {
                    "id": conditional_id,
                    "type": "conditional",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "Needs Review?",
                        "config": {
                            "condition": "output.get('confidence', 0) < 0.8 or output.get('requires_review', False)"
                        }
                    }
                },
                {
                    "id": approval_id,
                    "type": "approval",
                    "position": {"x": 300, "y": 550},
                    "data": {
                        "label": "Manual Review",
                        "config": {
                            "title": "Content Review Required",
                            "description": "AI confidence low - human review needed",
                            "approvers": ["moderator@company.com"],
                            "timeout_seconds": 3600
                        }
                    }
                },
                {
                    "id": agent_explain_id,
                    "type": "agent",
                    "position": {"x": -100, "y": 550},
                    "data": {
                        "label": "Generate Report",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": "Generate a brief moderation report explaining the decision.",
                            "user_prompt": "Content flagged: {{agent_check.violations}}, Severity: {{agent_check.severity}}",
                            "temperature": 0.5
                        }
                    }
                },
                {
                    "id": end_approved_id,
                    "type": "end",
                    "position": {"x": -100, "y": 700},
                    "data": {
                        "label": "✅ Content Approved",
                        "config": {}
                    }
                },
                {
                    "id": end_rejected_id,
                    "type": "end",
                    "position": {"x": 300, "y": 700},
                    "data": {
                        "label": "❌ Content Rejected",
                        "config": {}
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": trigger_id, "target": agent_check_id, "type": "default"},
                {"id": "e2", "source": agent_check_id, "target": conditional_id, "type": "default"},
                {"id": "e3", "source": conditional_id, "target": approval_id, "type": "success", "label": "Review"},
                {"id": "e4", "source": conditional_id, "target": agent_explain_id, "type": "failure", "label": "Auto"},
                {"id": "e5", "source": agent_explain_id, "target": end_approved_id, "type": "default"},
                {"id": "e6", "source": approval_id, "target": end_rejected_id, "type": "default"}
            ]
        }
    }

def get_multi_agent_research_template() -> Dict[str, Any]:
    """Multi-Agent Research System"""
    trigger_id = generate_node_id()
    agent_researcher_id = generate_node_id()
    agent_analyst_id = generate_node_id()
    agent_writer_id = generate_node_id()
    eval_id = generate_node_id()
    end_id = generate_node_id()
    
    return {
        "id": "template-multi-agent-research",
        "name": "🔬 Multi-Agent Research System",
        "description": "Collaborative AI agents: Researcher, Analyst, and Writer working together",
        "category": "ai-collaboration",
        "definition": {
            "nodes": [
                {
                    "id": trigger_id,
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "Research Topic",
                        "config": {
                            "trigger_type": "manual",
                            "input_schema": {
                                "topic": "string",
                                "depth": "string"
                            }
                        }
                    }
                },
                {
                    "id": agent_researcher_id,
                    "type": "agent",
                    "position": {"x": 100, "y": 250},
                    "data": {
                        "label": "🔍 Researcher Agent",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": """You are a research specialist. Gather key facts, statistics, and insights about the topic. Respond with JSON:
{
  "key_facts": ["fact1", "fact2", "fact3"],
  "statistics": ["stat1", "stat2"],
  "sources": ["source1", "source2"]
}""",
                            "user_prompt": "Research this topic: {{trigger.topic}}",
                            "temperature": 0.7
                        }
                    }
                },
                {
                    "id": agent_analyst_id,
                    "type": "agent",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "📊 Analyst Agent",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": """You are a data analyst. Analyze the research findings and provide insights. Respond with JSON:
{
  "trends": ["trend1", "trend2"],
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"]
}""",
                            "user_prompt": "Analyze: {{agent_researcher.key_facts}}",
                            "temperature": 0.6
                        }
                    }
                },
                {
                    "id": agent_writer_id,
                    "type": "agent",
                    "position": {"x": 100, "y": 550},
                    "data": {
                        "label": "✍️ Writer Agent",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": """You are a professional writer. Create a comprehensive report from the research and analysis. Respond with JSON:
{
  "title": "engaging title",
  "executive_summary": "2-3 sentences",
  "main_content": "detailed report",
  "conclusion": "key takeaways"
}""",
                            "user_prompt": "Write report on: {{trigger.topic}}\nResearch: {{agent_researcher}}\nAnalysis: {{agent_analyst}}",
                            "temperature": 0.8
                        }
                    }
                },
                {
                    "id": eval_id,
                    "type": "eval",
                    "position": {"x": 100, "y": 700},
                    "data": {
                        "label": "Quality Check",
                        "config": {
                            "eval_type": "llm_judge",
                            "criteria": "Report should be comprehensive, well-structured, and actionable",
                            "threshold": 0.7
                        }
                    }
                },
                {
                    "id": end_id,
                    "type": "end",
                    "position": {"x": 100, "y": 850},
                    "data": {
                        "label": "Research Complete",
                        "config": {}
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": trigger_id, "target": agent_researcher_id, "type": "default"},
                {"id": "e2", "source": agent_researcher_id, "target": agent_analyst_id, "type": "default"},
                {"id": "e3", "source": agent_analyst_id, "target": agent_writer_id, "type": "default"},
                {"id": "e4", "source": agent_writer_id, "target": eval_id, "type": "default"},
                {"id": "e5", "source": eval_id, "target": end_id, "type": "default"}
            ]
        }
    }

def get_approval_workflow_template() -> Dict[str, Any]:
    """Approval Workflow with Compensation"""
    trigger_id = generate_node_id()
    agent_validate_id = generate_node_id()
    approval_id = generate_node_id()
    agent_process_id = generate_node_id()
    event_id = generate_node_id()
    end_id = generate_node_id()
    
    return {
        "id": "template-approval-workflow",
        "name": "✅ Approval & Compensation Flow",
        "description": "Complete approval workflow with validation, human approval, processing, and rollback",
        "category": "workflow-patterns",
        "definition": {
            "nodes": [
                {
                    "id": trigger_id,
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "Expense Request",
                        "config": {
                            "trigger_type": "manual",
                            "input_schema": {
                                "amount": "number",
                                "category": "string",
                                "description": "string",
                                "requester": "string"
                            }
                        }
                    }
                },
                {
                    "id": agent_validate_id,
                    "type": "agent",
                    "position": {"x": 100, "y": 250},
                    "data": {
                        "label": "Validate Request",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": """Validate expense request against company policy. Respond with JSON:
{
  "is_valid": true or false,
  "policy_compliant": true or false,
  "requires_documentation": true or false,
  "risk_level": "low" or "medium" or "high",
  "recommendation": "approve" or "reject" or "review"
}""",
                            "user_prompt": "Validate: ${{trigger.amount}} for {{trigger.category}} - {{trigger.description}}",
                            "temperature": 0.2
                        }
                    }
                },
                {
                    "id": approval_id,
                    "type": "approval",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "Manager Approval",
                        "config": {
                            "title": "Expense Approval Required",
                            "description": "Review and approve expense request",
                            "approvers": ["manager@company.com", "finance@company.com"],
                            "timeout_seconds": 7200,
                            "channels": ["email", "slack"]
                        }
                    }
                },
                {
                    "id": agent_process_id,
                    "type": "agent",
                    "position": {"x": 100, "y": 550},
                    "data": {
                        "label": "Process Payment",
                        "config": {
                            "agent_type": "openai",
                            "model": "gpt-4o-mini",
                            "system_prompt": "Generate payment processing summary",
                            "user_prompt": "Process approved expense: ${{trigger.amount}} for {{trigger.requester}}",
                            "temperature": 0.3
                        }
                    }
                },
                {
                    "id": event_id,
                    "type": "event",
                    "position": {"x": 100, "y": 700},
                    "data": {
                        "label": "Notify Completion",
                        "config": {
                            "event_type": "expense.processed",
                            "payload_template": {
                                "amount": "{{trigger.amount}}",
                                "requester": "{{trigger.requester}}",
                                "status": "completed"
                            }
                        }
                    }
                },
                {
                    "id": end_id,
                    "type": "end",
                    "position": {"x": 100, "y": 850},
                    "data": {
                        "label": "Expense Processed",
                        "config": {}
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": trigger_id, "target": agent_validate_id, "type": "default"},
                {"id": "e2", "source": agent_validate_id, "target": approval_id, "type": "default"},
                {"id": "e3", "source": approval_id, "target": agent_process_id, "type": "default"},
                {"id": "e4", "source": agent_process_id, "target": event_id, "type": "default"},
                {"id": "e5", "source": event_id, "target": end_id, "type": "default"}
            ]
        }
    }
