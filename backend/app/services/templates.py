""""""

Workflow Templates - Pre-built workflows with real working nodes and free APIsWorkflow Templates - Pre-built workflows with real working nodes

""""""

from typing import List, Dict, Anyfrom typing import List, Dict, Any

import uuidimport uuid



def generate_node_id() -> str:def generate_node_id() -> str:

    """Generate a unique node ID"""    """Generate a unique node ID"""

    return str(uuid.uuid4())    return str(uuid.uuid4())



def normalize_node_for_frontend(node: Dict[str, Any]) -> Dict[str, Any]:def normalize_node_for_frontend(node: Dict[str, Any]) -> Dict[str, Any]:

    """Normalize node structure to match frontend React Flow expectations"""    """Normalize node structure to match frontend expectations"""

    node_type = node["type"]    node_type = node["type"]

        

    # Ensure data has required fields for frontend    # Ensure data has required fields

    if "data" not in node:    if "data" not in node:

        node["data"] = {}        node["data"] = {}

        

    node["data"]["type"] = node_type    node["data"]["type"] = node_type

    node["data"]["status"] = "idle"    node["data"]["status"] = "idle"

        

    # Normalize config based on node type    # Normalize config based on node type

    if "config" not in node["data"]:    if "config" not in node["data"]:

        node["data"]["config"] = {}        node["data"]["config"] = {}

        

    config = node["data"]["config"]    config = node["data"]["config"]

        

    # Add name if not present    # Add name if not present

    if "name" not in config:    if "name" not in config:

        config["name"] = node["data"].get("label", f"New {node_type.title()}")        config["name"] = node["data"].get("label", f"New {node_type.title()}")

        

    # Type-specific normalization    # Type-specific normalization

    if node_type == "trigger":    if node_type == "trigger":

        if "type" not in config:        if "type" not in config:

            config["type"] = "manual"            config["type"] = "manual"

        if "input_text" not in config:        if "input_text" not in config:

            config["input_text"] = ""            config["input_text"] = ""

        

    elif node_type == "agent":    elif node_type == "agent":

        # Map system_prompt to system_instructions if needed        # Map old fields to new

        if "system_prompt" in config:        if "system_prompt" in config:

            config["system_instructions"] = config.pop("system_prompt")            config["system_instructions"] = config.pop("system_prompt")

        if "system_instructions" not in config:        if "system_instructions" not in config:

            config["system_instructions"] = ""            config["system_instructions"] = ""

        if "temperature" not in config:        if "temperature" not in config:

            config["temperature"] = 0.7            config["temperature"] = 0.7

        if "expected_output_format" not in config:        if "expected_output_format" not in config:

            config["expected_output_format"] = "text"            config["expected_output_format"] = "text"

        

    elif node_type == "api_call":    elif node_type == "end":

        if "method" not in config:        if "capture_output" not in config:

            config["method"] = "GET"            config["capture_output"] = True

        if "url" not in config:        if "show_output" not in config:

            config["url"] = ""            config["show_output"] = True

        

    elif node_type == "approval":    return node

        if "message" not in config:

            config["message"] = ""def get_workflow_templates() -> List[Dict[str, Any]]:

        if "approver_email" not in config:    """Get all pre-built workflow templates"""

            config["approver_email"] = ""    templates = [

            get_sentiment_analysis_template(),

    elif node_type == "end":        get_data_enrichment_template(),

        if "capture_output" not in config:        get_content_moderation_template(),

            config["capture_output"] = True        get_multi_agent_research_template(),

        if "show_output" not in config:        get_approval_workflow_template(),

            config["show_output"] = True    ]

        

    return node    # Normalize all nodes in all templates

    for template in templates:

def get_workflow_templates() -> List[Dict[str, Any]]:        if "definition" in template and "nodes" in template["definition"]:

    """Get all pre-built workflow templates"""            template["definition"]["nodes"] = [

    templates = [                normalize_node_for_frontend(node)

        get_sentiment_analysis_template(),                for node in template["definition"]["nodes"]

        get_data_enrichment_template(),            ]

        get_content_moderation_template(),    

        get_multi_agent_research_template(),    return templates

        get_approval_workflow_template(),

    ]def get_sentiment_analysis_template() -> Dict[str, Any]:

        """Sentiment Analysis Pipeline with OpenAI"""

    # Normalize all nodes in all templates for frontend compatibility    trigger_id = generate_node_id()

    for template in templates:    api_call_id = generate_node_id()

        if "definition" in template and "nodes" in template["definition"]:    agent_id = generate_node_id()

            template["definition"]["nodes"] = [    conditional_id = generate_node_id()

                normalize_node_for_frontend(node)    end_positive_id = generate_node_id()

                for node in template["definition"]["nodes"]    end_negative_id = generate_node_id()

            ]    

        return {

    return templates        "id": "template-sentiment-analysis",

        "name": "🎭 Sentiment Analysis Pipeline",

def get_sentiment_analysis_template() -> Dict[str, Any]:        "description": "Analyze customer feedback sentiment using AI and route to appropriate teams",

    """📊 Sentiment Analysis Pipeline - Analyzes text sentiment with OpenAI"""        "category": "ai-analysis",

    trigger_id = generate_node_id()        "definition": {

    agent_id = generate_node_id()            "nodes": [

    conditional_id = generate_node_id()                {

    positive_end_id = generate_node_id()                    "id": trigger_id,

    negative_end_id = generate_node_id()                    "type": "trigger",

                        "position": {"x": 100, "y": 100},

    return {                    "data": {

        "name": "📊 Sentiment Analysis Pipeline",                        "label": "Customer Feedback",

        "description": "Analyze customer feedback sentiment using OpenAI's GPT-4 and route based on results",                        "type": "trigger",

        "is_template": True,                        "status": "idle",

        "definition": {                        "config": {

            "nodes": [                            "name": "Customer Feedback",

                {                            "type": "manual",

                    "id": trigger_id,                            "input_text": ""

                    "type": "trigger",                        }

                    "position": {"x": 100, "y": 200},                    }

                    "data": {                },

                        "label": "Customer Feedback",                {

                        "config": {                    "id": agent_id,

                            "name": "Customer Feedback Input",                    "type": "agent",

                            "type": "manual",                    "position": {"x": 100, "y": 250},

                            "input_text": "The product quality is excellent but delivery was slow."                    "data": {

                        }                        "label": "Sentiment Analyzer",

                    }                        "type": "agent",

                },                        "status": "idle",

                {                        "config": {

                    "id": agent_id,                            "name": "Sentiment Analyzer",

                    "type": "agent",                            "system_instructions": """You are a sentiment analysis expert. Analyze the customer feedback and respond with ONLY a JSON object:

                    "position": {"x": 350, "y": 200},{

                    "data": {  "sentiment": "positive" or "negative" or "neutral",

                        "label": "Sentiment Analyzer",  "confidence": 0.0 to 1.0,

                        "config": {  "key_emotions": ["emotion1", "emotion2"],

                            "name": "Sentiment Analyzer",  "summary": "brief summary of the feedback"

                            "system_instructions": "You are a sentiment analysis expert. Analyze the given text and return ONLY one word: 'positive', 'negative', or 'neutral'. Nothing else.",}""",

                            "temperature": 0.3,                            "temperature": 0.3,

                            "expected_output_format": "text",                            "expected_output_format": "json"

                            "llm_config": {                        }

                                "provider": "openai",                    }

                                "model": "gpt-4o-mini",                },

                                "api_key_source": "env",                {

                                "api_key_env_var": "OPENAI_API_KEY"                    "id": conditional_id,

                            }                    "type": "conditional",

                        }                    "position": {"x": 100, "y": 400},

                    }                    "data": {

                },                        "label": "Route by Sentiment",

                {                        "type": "conditional",

                    "id": conditional_id,                        "status": "idle",

                    "type": "conditional",                        "config": {

                    "position": {"x": 600, "y": 200},                            "name": "Route by Sentiment",

                    "data": {                            "condition": "output.get('sentiment') == 'positive'"

                        "label": "Route by Sentiment",                        }

                        "config": {                    }

                            "name": "Route by Sentiment",                },

                            "conditions": [                {

                                {                    "id": end_positive_id,

                                    "id": "positive_path",                    "type": "end",

                                    "variable": f"{agent_id}.output",                    "position": {"x": 300, "y": 550},

                                    "operator": "contains",                    "data": {

                                    "value": "positive",                        "label": "✅ Positive Feedback",

                                    "target_node_id": positive_end_id                        "config": {

                                },                            "output_message": "Feedback routed to customer success team"

                                {                        }

                                    "id": "negative_path",                    }

                                    "variable": f"{agent_id}.output",                },

                                    "operator": "contains",                {

                                    "value": "negative",                    "id": end_negative_id,

                                    "target_node_id": negative_end_id                    "type": "end",

                                }                    "position": {"x": -100, "y": 550},

                            ],                    "data": {

                            "default_target_node_id": positive_end_id                        "label": "⚠️ Negative Feedback",

                        }                        "config": {

                    }                            "output_message": "Urgent: Feedback routed to support escalation"

                },                        }

                {                    }

                    "id": positive_end_id,                }

                    "type": "end",            ],

                    "position": {"x": 900, "y": 100},            "edges": [

                    "data": {                {"id": "e1", "source": trigger_id, "target": agent_id, "type": "default"},

                        "label": "✅ Positive Feedback",                {"id": "e2", "source": agent_id, "target": conditional_id, "type": "default"},

                        "config": {                {"id": "e3", "source": conditional_id, "target": end_positive_id, "type": "success", "label": "Positive"},

                            "name": "Positive Feedback",                {"id": "e4", "source": conditional_id, "target": end_negative_id, "type": "failure", "label": "Negative"}

                            "capture_output": True,            ]

                            "show_output": True        }

                        }    }

                    }

                },def get_data_enrichment_template() -> Dict[str, Any]:

                {    """Data Enrichment with Free APIs"""

                    "id": negative_end_id,    trigger_id = generate_node_id()

                    "type": "end",    api_weather_id = generate_node_id()

                    "position": {"x": 900, "y": 300},    api_company_id = generate_node_id()

                    "data": {    merge_id = generate_node_id()

                        "label": "⚠️ Negative Feedback",    agent_id = generate_node_id()

                        "config": {    end_id = generate_node_id()

                            "name": "Negative Feedback",    

                            "capture_output": True,    return {

                            "show_output": True        "id": "template-data-enrichment",

                        }        "name": "📊 Data Enrichment Pipeline",

                    }        "description": "Enrich lead data with weather, company info, and AI-generated insights",

                }        "category": "data-processing",

            ],        "definition": {

            "edges": [            "nodes": [

                {                {

                    "id": f"{trigger_id}-{agent_id}",                    "id": trigger_id,

                    "source": trigger_id,                    "type": "trigger",

                    "target": agent_id,                    "position": {"x": 100, "y": 100},

                    "type": "default"                    "data": {

                },                        "label": "Lead Input",

                {                        "config": {

                    "id": f"{agent_id}-{conditional_id}",                            "trigger_type": "manual",

                    "source": agent_id,                            "input_schema": {

                    "target": conditional_id,                                "email": "string",

                    "type": "default"                                "company_domain": "string",

                },                                "city": "string"

                {                            }

                    "id": f"{conditional_id}-{positive_end_id}",                        }

                    "source": conditional_id,                    }

                    "target": positive_end_id,                },

                    "type": "conditional",                {

                    "sourceHandle": "positive_path"                    "id": api_weather_id,

                },                    "type": "api_call",

                {                    "position": {"x": -100, "y": 250},

                    "id": f"{conditional_id}-{negative_end_id}",                    "data": {

                    "source": conditional_id,                        "label": "Get Weather",

                    "target": negative_end_id,                        "config": {

                    "type": "conditional",                            "method": "GET",

                    "sourceHandle": "negative_path"                            "url": "https://wttr.in/{{trigger.city}}?format=j1",

                }                            "headers": {"User-Agent": "curl"}

            ]                        }

        }                    }

    }                },

                {

def get_data_enrichment_template() -> Dict[str, Any]:                    "id": api_company_id,

    """🌐 Data Enrichment Pipeline - Enrich company data with weather and AI insights"""                    "type": "api_call",

    trigger_id = generate_node_id()                    "position": {"x": 300, "y": 250},

    weather_api_id = generate_node_id()                    "data": {

    company_api_id = generate_node_id()                        "label": "Company Info",

    agent_id = generate_node_id()                        "config": {

    end_id = generate_node_id()                            "method": "GET",

                                "url": "https://companies.tycoon.io/api/company/{{trigger.company_domain}}",

    return {                            "headers": {}

        "name": "🌐 Data Enrichment Pipeline",                        }

        "description": "Enrich location data with weather info and AI-generated insights using free APIs",                    }

        "is_template": True,                },

        "definition": {                {

            "nodes": [                    "id": merge_id,

                {                    "type": "merge",

                    "id": trigger_id,                    "position": {"x": 100, "y": 400},

                    "type": "trigger",                    "data": {

                    "position": {"x": 100, "y": 250},                        "label": "Combine Data",

                    "data": {                        "config": {

                        "label": "Location Input",                            "strategy": "all"

                        "config": {                        }

                            "name": "Location Input",                    }

                            "type": "manual",                },

                            "input_text": "London"                {

                        }                    "id": agent_id,

                    }                    "type": "agent",

                },                    "position": {"x": 100, "y": 550},

                {                    "data": {

                    "id": weather_api_id,                        "label": "Generate Insights",

                    "type": "api_call",                        "config": {

                    "position": {"x": 350, "y": 150},                            "agent_type": "openai",

                    "data": {                            "model": "gpt-4o-mini",

                        "label": "Get Weather",                            "system_prompt": """You are a sales intelligence analyst. Based on the weather and company data provided, generate a personalized outreach message. Respond with JSON:

                        "config": {{

                            "name": "Weather API",  "insights": ["insight1", "insight2"],

                            "method": "GET",  "talking_points": ["point1", "point2"],

                            "url": "https://wttr.in/{trigger.output}?format=j1",  "recommended_approach": "brief strategy"

                            "headers": {},}""",

                            "body": ""                            "user_prompt": "Weather: {{api_weather.current_condition[0].temp_C}}°C, Company: {{api_company.name}}",

                        }                            "temperature": 0.7

                    }                        }

                },                    }

                {                },

                    "id": company_api_id,                {

                    "type": "api_call",                    "id": end_id,

                    "position": {"x": 350, "y": 350},                    "type": "end",

                    "data": {                    "position": {"x": 100, "y": 700},

                        "label": "Get Random Company",                    "data": {

                        "config": {                        "label": "Enriched Lead",

                            "name": "Random Company API",                        "config": {

                            "method": "GET",                            "output_message": "Lead enrichment complete"

                            "url": "https://random-data-api.com/api/v2/companies",                        }

                            "headers": {},                    }

                            "body": ""                }

                        }            ],

                    }            "edges": [

                },                {"id": "e1", "source": trigger_id, "target": api_weather_id, "type": "default"},

                {                {"id": "e2", "source": trigger_id, "target": api_company_id, "type": "default"},

                    "id": agent_id,                {"id": "e3", "source": api_weather_id, "target": merge_id, "type": "default"},

                    "type": "agent",                {"id": "e4", "source": api_company_id, "target": merge_id, "type": "default"},

                    "position": {"x": 600, "y": 250},                {"id": "e5", "source": merge_id, "target": agent_id, "type": "default"},

                    "data": {                {"id": "e6", "source": agent_id, "target": end_id, "type": "default"}

                        "label": "Insight Generator",            ]

                        "config": {        }

                            "name": "AI Insight Generator",    }

                            "system_instructions": "You are a business analyst. Given weather data and company info, generate a brief business insight about how weather might affect this type of business. Keep it under 100 words.",

                            "temperature": 0.7,def get_content_moderation_template() -> Dict[str, Any]:

                            "expected_output_format": "text",    """Content Moderation with AI"""

                            "llm_config": {    trigger_id = generate_node_id()

                                "provider": "openai",    agent_check_id = generate_node_id()

                                "model": "gpt-4o-mini",    conditional_id = generate_node_id()

                                "api_key_source": "env",    approval_id = generate_node_id()

                                "api_key_env_var": "OPENAI_API_KEY"    agent_explain_id = generate_node_id()

                            }    end_approved_id = generate_node_id()

                        }    end_rejected_id = generate_node_id()

                    }    

                },    return {

                {        "id": "template-content-moderation",

                    "id": end_id,        "name": "🛡️ AI Content Moderation",

                    "type": "end",        "description": "Automated content moderation with human approval for edge cases",

                    "position": {"x": 850, "y": 250},        "category": "moderation",

                    "data": {        "definition": {

                        "label": "📋 Enriched Data",            "nodes": [

                        "config": {                {

                            "name": "Enriched Data Output",                    "id": trigger_id,

                            "capture_output": True,                    "type": "trigger",

                            "show_output": True                    "position": {"x": 100, "y": 100},

                        }                    "data": {

                    }                        "label": "User Content",

                }                        "config": {

            ],                            "trigger_type": "manual",

            "edges": [                            "input_schema": {

                {"id": f"{trigger_id}-{weather_api_id}", "source": trigger_id, "target": weather_api_id, "type": "default"},                                "content": "string",

                {"id": f"{trigger_id}-{company_api_id}", "source": trigger_id, "target": company_api_id, "type": "default"},                                "user_id": "string",

                {"id": f"{weather_api_id}-{agent_id}", "source": weather_api_id, "target": agent_id, "type": "default"},                                "content_type": "string"

                {"id": f"{company_api_id}-{agent_id}", "source": company_api_id, "target": agent_id, "type": "default"},                            }

                {"id": f"{agent_id}-{end_id}", "source": agent_id, "target": end_id, "type": "default"}                        }

            ]                    }

        }                },

    }                {

                    "id": agent_check_id,

def get_content_moderation_template() -> Dict[str, Any]:                    "type": "agent",

    """🛡️ AI Content Moderation - AI pre-screen with human approval fallback"""                    "position": {"x": 100, "y": 250},

    trigger_id = generate_node_id()                    "data": {

    ai_moderator_id = generate_node_id()                        "label": "AI Moderator",

    conditional_id = generate_node_id()                        "config": {

    approval_id = generate_node_id()                            "agent_type": "openai",

    approved_end_id = generate_node_id()                            "model": "gpt-4o-mini",

    rejected_end_id = generate_node_id()                            "system_prompt": """You are a content moderation AI. Analyze content for violations. Respond with ONLY JSON:

    {

    return {  "is_safe": true or false,

        "name": "🛡️ AI Content Moderation",  "confidence": 0.0 to 1.0,

        "description": "Automated content screening with AI, escalates questionable content for human review",  "violations": ["type1", "type2"] or [],

        "is_template": True,  "severity": "low" or "medium" or "high",

        "definition": {  "requires_review": true or false

            "nodes": [}""",

                {                            "user_prompt": "Moderate this content: {{trigger.content}}",

                    "id": trigger_id,                            "temperature": 0.1

                    "type": "trigger",                        }

                    "position": {"x": 100, "y": 300},                    }

                    "data": {                },

                        "label": "User Content",                {

                        "config": {                    "id": conditional_id,

                            "name": "User Submitted Content",                    "type": "conditional",

                            "type": "manual",                    "position": {"x": 100, "y": 400},

                            "input_text": "Check out this amazing new product! Visit our website at example.com"                    "data": {

                        }                        "label": "Needs Review?",

                    }                        "config": {

                },                            "condition": "output.get('confidence', 0) < 0.8 or output.get('requires_review', False)"

                {                        }

                    "id": ai_moderator_id,                    }

                    "type": "agent",                },

                    "position": {"x": 300, "y": 300},                {

                    "data": {                    "id": approval_id,

                        "label": "AI Moderator",                    "type": "approval",

                        "config": {                    "position": {"x": 300, "y": 550},

                            "name": "AI Content Moderator",                    "data": {

                            "system_instructions": "You are a content moderator. Analyze the content for spam, harmful content, or policy violations. Respond with ONLY 'SAFE', 'QUESTIONABLE', or 'REJECT'. Nothing else.",                        "label": "Manual Review",

                            "temperature": 0.2,                        "config": {

                            "expected_output_format": "text",                            "title": "Content Review Required",

                            "llm_config": {                            "description": "AI confidence low - human review needed",

                                "provider": "openai",                            "approvers": ["moderator@company.com"],

                                "model": "gpt-4o-mini",                            "timeout_seconds": 3600

                                "api_key_source": "env",                        }

                                "api_key_env_var": "OPENAI_API_KEY"                    }

                            }                },

                        }                {

                    }                    "id": agent_explain_id,

                },                    "type": "agent",

                {                    "position": {"x": -100, "y": 550},

                    "id": conditional_id,                    "data": {

                    "type": "conditional",                        "label": "Generate Report",

                    "position": {"x": 500, "y": 300},                        "config": {

                    "data": {                            "agent_type": "openai",

                        "label": "Check Result",                            "model": "gpt-4o-mini",

                        "config": {                            "system_prompt": "Generate a brief moderation report explaining the decision.",

                            "name": "Moderation Router",                            "user_prompt": "Content flagged: {{agent_check.violations}}, Severity: {{agent_check.severity}}",

                            "conditions": [                            "temperature": 0.5

                                {                        }

                                    "id": "safe_path",                    }

                                    "variable": f"{ai_moderator_id}.output",                },

                                    "operator": "contains",                {

                                    "value": "SAFE",                    "id": end_approved_id,

                                    "target_node_id": approved_end_id                    "type": "end",

                                },                    "position": {"x": -100, "y": 700},

                                {                    "data": {

                                    "id": "questionable_path",                        "label": "✅ Content Approved",

                                    "variable": f"{ai_moderator_id}.output",                        "config": {}

                                    "operator": "contains",                    }

                                    "value": "QUESTIONABLE",                },

                                    "target_node_id": approval_id                {

                                },                    "id": end_rejected_id,

                                {                    "type": "end",

                                    "id": "reject_path",                    "position": {"x": 300, "y": 700},

                                    "variable": f"{ai_moderator_id}.output",                    "data": {

                                    "operator": "contains",                        "label": "❌ Content Rejected",

                                    "value": "REJECT",                        "config": {}

                                    "target_node_id": rejected_end_id                    }

                                }                }

                            ],            ],

                            "default_target_node_id": approval_id            "edges": [

                        }                {"id": "e1", "source": trigger_id, "target": agent_check_id, "type": "default"},

                    }                {"id": "e2", "source": agent_check_id, "target": conditional_id, "type": "default"},

                },                {"id": "e3", "source": conditional_id, "target": approval_id, "type": "success", "label": "Review"},

                {                {"id": "e4", "source": conditional_id, "target": agent_explain_id, "type": "failure", "label": "Auto"},

                    "id": approval_id,                {"id": "e5", "source": agent_explain_id, "target": end_approved_id, "type": "default"},

                    "type": "approval",                {"id": "e6", "source": approval_id, "target": end_rejected_id, "type": "default"}

                    "position": {"x": 700, "y": 300},            ]

                    "data": {        }

                        "label": "Human Review",    }

                        "config": {

                            "name": "Manual Review Required",def get_multi_agent_research_template() -> Dict[str, Any]:

                            "message": "This content needs human review. Please approve or reject.",    """Multi-Agent Research System"""

                            "approver_email": "workflow.orchestrator@lyzr.ai"    trigger_id = generate_node_id()

                        }    agent_researcher_id = generate_node_id()

                    }    agent_analyst_id = generate_node_id()

                },    agent_writer_id = generate_node_id()

                {    eval_id = generate_node_id()

                    "id": approved_end_id,    end_id = generate_node_id()

                    "type": "end",    

                    "position": {"x": 900, "y": 150},    return {

                    "data": {        "id": "template-multi-agent-research",

                        "label": "✅ Approved",        "name": "🔬 Multi-Agent Research System",

                        "config": {        "description": "Collaborative AI agents: Researcher, Analyst, and Writer working together",

                            "name": "Content Approved",        "category": "ai-collaboration",

                            "capture_output": True,        "definition": {

                            "show_output": True            "nodes": [

                        }                {

                    }                    "id": trigger_id,

                },                    "type": "trigger",

                {                    "position": {"x": 100, "y": 100},

                    "id": rejected_end_id,                    "data": {

                    "type": "end",                        "label": "Research Topic",

                    "position": {"x": 900, "y": 450},                        "config": {

                    "data": {                            "trigger_type": "manual",

                        "label": "❌ Rejected",                            "input_schema": {

                        "config": {                                "topic": "string",

                            "name": "Content Rejected",                                "depth": "string"

                            "capture_output": True,                            }

                            "show_output": True                        }

                        }                    }

                    }                },

                }                {

            ],                    "id": agent_researcher_id,

            "edges": [                    "type": "agent",

                {"id": f"{trigger_id}-{ai_moderator_id}", "source": trigger_id, "target": ai_moderator_id, "type": "default"},                    "position": {"x": 100, "y": 250},

                {"id": f"{ai_moderator_id}-{conditional_id}", "source": ai_moderator_id, "target": conditional_id, "type": "default"},                    "data": {

                {"id": f"{conditional_id}-{approved_end_id}", "source": conditional_id, "target": approved_end_id, "type": "conditional", "sourceHandle": "safe_path"},                        "label": "🔍 Researcher Agent",

                {"id": f"{conditional_id}-{approval_id}", "source": conditional_id, "target": approval_id, "type": "conditional", "sourceHandle": "questionable_path"},                        "config": {

                {"id": f"{conditional_id}-{rejected_end_id}", "source": conditional_id, "target": rejected_end_id, "type": "conditional", "sourceHandle": "reject_path"},                            "agent_type": "openai",

                {"id": f"{approval_id}-{approved_end_id}", "source": approval_id, "target": approved_end_id, "type": "default"}                            "model": "gpt-4o-mini",

            ]                            "system_prompt": """You are a research specialist. Gather key facts, statistics, and insights about the topic. Respond with JSON:

        }{

    }  "key_facts": ["fact1", "fact2", "fact3"],

  "statistics": ["stat1", "stat2"],

def get_multi_agent_research_template() -> Dict[str, Any]:  "sources": ["source1", "source2"]

    """🔬 Multi-Agent Research - Three AI agents collaborate on research"""}""",

    trigger_id = generate_node_id()                            "user_prompt": "Research this topic: {{trigger.topic}}",

    researcher_id = generate_node_id()                            "temperature": 0.7

    analyst_id = generate_node_id()                        }

    writer_id = generate_node_id()                    }

    end_id = generate_node_id()                },

                    {

    return {                    "id": agent_analyst_id,

        "name": "🔬 Multi-Agent Research Team",                    "type": "agent",

        "description": "Three AI agents collaborate: Researcher gathers data, Analyst finds insights, Writer creates summary",                    "position": {"x": 100, "y": 400},

        "is_template": True,                    "data": {

        "definition": {                        "label": "📊 Analyst Agent",

            "nodes": [                        "config": {

                {                            "agent_type": "openai",

                    "id": trigger_id,                            "model": "gpt-4o-mini",

                    "type": "trigger",                            "system_prompt": """You are a data analyst. Analyze the research findings and provide insights. Respond with JSON:

                    "position": {"x": 100, "y": 250},{

                    "data": {  "trends": ["trend1", "trend2"],

                        "label": "Research Topic",  "insights": ["insight1", "insight2"],

                        "config": {  "recommendations": ["rec1", "rec2"]

                            "name": "Research Topic Input",}""",

                            "type": "manual",                            "user_prompt": "Analyze: {{agent_researcher.key_facts}}",

                            "input_text": "Impact of AI on software development"                            "temperature": 0.6

                        }                        }

                    }                    }

                },                },

                {                {

                    "id": researcher_id,                    "id": agent_writer_id,

                    "type": "agent",                    "type": "agent",

                    "position": {"x": 300, "y": 250},                    "position": {"x": 100, "y": 550},

                    "data": {                    "data": {

                        "label": "Researcher Agent",                        "label": "✍️ Writer Agent",

                        "config": {                        "config": {

                            "name": "Research Agent",                            "agent_type": "openai",

                            "system_instructions": "You are a research specialist. Given a topic, provide 3-4 key facts or recent developments about it. Be concise and factual.",                            "model": "gpt-4o-mini",

                            "temperature": 0.5,                            "system_prompt": """You are a professional writer. Create a comprehensive report from the research and analysis. Respond with JSON:

                            "expected_output_format": "text",{

                            "llm_config": {  "title": "engaging title",

                                "provider": "openai",  "executive_summary": "2-3 sentences",

                                "model": "gpt-4o-mini",  "main_content": "detailed report",

                                "api_key_source": "env",  "conclusion": "key takeaways"

                                "api_key_env_var": "OPENAI_API_KEY"}""",

                            }                            "user_prompt": "Write report on: {{trigger.topic}}\nResearch: {{agent_researcher}}\nAnalysis: {{agent_analyst}}",

                        }                            "temperature": 0.8

                    }                        }

                },                    }

                {                },

                    "id": analyst_id,                {

                    "type": "agent",                    "id": eval_id,

                    "position": {"x": 500, "y": 250},                    "type": "eval",

                    "data": {                    "position": {"x": 100, "y": 700},

                        "label": "Analyst Agent",                    "data": {

                        "config": {                        "label": "Quality Check",

                            "name": "Analysis Agent",                        "config": {

                            "system_instructions": "You are a strategic analyst. Given research findings, identify 2-3 key insights, trends, or implications. Be analytical and forward-thinking.",                            "eval_type": "llm_judge",

                            "temperature": 0.6,                            "criteria": "Report should be comprehensive, well-structured, and actionable",

                            "expected_output_format": "text",                            "threshold": 0.7

                            "llm_config": {                        }

                                "provider": "openai",                    }

                                "model": "gpt-4o-mini",                },

                                "api_key_source": "env",                {

                                "api_key_env_var": "OPENAI_API_KEY"                    "id": end_id,

                            }                    "type": "end",

                        }                    "position": {"x": 100, "y": 850},

                    }                    "data": {

                },                        "label": "Research Complete",

                {                        "config": {}

                    "id": writer_id,                    }

                    "type": "agent",                }

                    "position": {"x": 700, "y": 250},            ],

                    "data": {            "edges": [

                        "label": "Writer Agent",                {"id": "e1", "source": trigger_id, "target": agent_researcher_id, "type": "default"},

                        "config": {                {"id": "e2", "source": agent_researcher_id, "target": agent_analyst_id, "type": "default"},

                            "name": "Writer Agent",                {"id": "e3", "source": agent_analyst_id, "target": agent_writer_id, "type": "default"},

                            "system_instructions": "You are a professional writer. Given research and analysis, create a clear, engaging executive summary (150 words max). Include key findings and insights.",                {"id": "e4", "source": agent_writer_id, "target": eval_id, "type": "default"},

                            "temperature": 0.7,                {"id": "e5", "source": eval_id, "target": end_id, "type": "default"}

                            "expected_output_format": "text",            ]

                            "llm_config": {        }

                                "provider": "openai",    }

                                "model": "gpt-4o-mini",

                                "api_key_source": "env",def get_approval_workflow_template() -> Dict[str, Any]:

                                "api_key_env_var": "OPENAI_API_KEY"    """Approval Workflow with Compensation"""

                            }    trigger_id = generate_node_id()

                        }    agent_validate_id = generate_node_id()

                    }    approval_id = generate_node_id()

                },    agent_process_id = generate_node_id()

                {    event_id = generate_node_id()

                    "id": end_id,    end_id = generate_node_id()

                    "type": "end",    

                    "position": {"x": 900, "y": 250},    return {

                    "data": {        "id": "template-approval-workflow",

                        "label": "📄 Research Report",        "name": "✅ Approval & Compensation Flow",

                        "config": {        "description": "Complete approval workflow with validation, human approval, processing, and rollback",

                            "name": "Final Report",        "category": "workflow-patterns",

                            "capture_output": True,        "definition": {

                            "show_output": True            "nodes": [

                        }                {

                    }                    "id": trigger_id,

                }                    "type": "trigger",

            ],                    "position": {"x": 100, "y": 100},

            "edges": [                    "data": {

                {"id": f"{trigger_id}-{researcher_id}", "source": trigger_id, "target": researcher_id, "type": "default"},                        "label": "Expense Request",

                {"id": f"{researcher_id}-{analyst_id}", "source": researcher_id, "target": analyst_id, "type": "default"},                        "config": {

                {"id": f"{analyst_id}-{writer_id}", "source": analyst_id, "target": writer_id, "type": "default"},                            "trigger_type": "manual",

                {"id": f"{writer_id}-{end_id}", "source": writer_id, "target": end_id, "type": "default"}                            "input_schema": {

            ]                                "amount": "number",

        }                                "category": "string",

    }                                "description": "string",

                                "requester": "string"

def get_approval_workflow_template() -> Dict[str, Any]:                            }

    """💼 Expense Approval - Validation, approval, and automated processing"""                        }

    trigger_id = generate_node_id()                    }

    validator_id = generate_node_id()                },

    conditional_id = generate_node_id()                {

    approval_id = generate_node_id()                    "id": agent_validate_id,

    process_id = generate_node_id()                    "type": "agent",

    approved_end_id = generate_node_id()                    "position": {"x": 100, "y": 250},

    rejected_end_id = generate_node_id()                    "data": {

                            "label": "Validate Request",

    return {                        "config": {

        "name": "💼 Expense Approval Workflow",                            "agent_type": "openai",

        "description": "Automated expense validation, approval routing, and processing with compensation",                            "model": "gpt-4o-mini",

        "is_template": True,                            "system_prompt": """Validate expense request against company policy. Respond with JSON:

        "definition": {{

            "nodes": [  "is_valid": true or false,

                {  "policy_compliant": true or false,

                    "id": trigger_id,  "requires_documentation": true or false,

                    "type": "trigger",  "risk_level": "low" or "medium" or "high",

                    "position": {"x": 100, "y": 300},  "recommendation": "approve" or "reject" or "review"

                    "data": {}""",

                        "label": "Expense Request",                            "user_prompt": "Validate: ${{trigger.amount}} for {{trigger.category}} - {{trigger.description}}",

                        "config": {                            "temperature": 0.2

                            "name": "Expense Submission",                        }

                            "type": "manual",                    }

                            "input_text": "{\"amount\": 250, \"category\": \"Travel\", \"description\": \"Client meeting in Boston\"}"                },

                        }                {

                    }                    "id": approval_id,

                },                    "type": "approval",

                {                    "position": {"x": 100, "y": 400},

                    "id": validator_id,                    "data": {

                    "type": "agent",                        "label": "Manager Approval",

                    "position": {"x": 300, "y": 300},                        "config": {

                    "data": {                            "title": "Expense Approval Required",

                        "label": "Expense Validator",                            "description": "Review and approve expense request",

                        "config": {                            "approvers": ["manager@company.com", "finance@company.com"],

                            "name": "AI Validator",                            "timeout_seconds": 7200,

                            "system_instructions": "You are an expense validator. Check if the expense is reasonable and properly documented. Respond with 'VALID' or 'INVALID' and a brief reason.",                            "channels": ["email", "slack"]

                            "temperature": 0.3,                        }

                            "expected_output_format": "text",                    }

                            "llm_config": {                },

                                "provider": "openai",                {

                                "model": "gpt-4o-mini",                    "id": agent_process_id,

                                "api_key_source": "env",                    "type": "agent",

                                "api_key_env_var": "OPENAI_API_KEY"                    "position": {"x": 100, "y": 550},

                            }                    "data": {

                        }                        "label": "Process Payment",

                    }                        "config": {

                },                            "agent_type": "openai",

                {                            "model": "gpt-4o-mini",

                    "id": conditional_id,                            "system_prompt": "Generate payment processing summary",

                    "type": "conditional",                            "user_prompt": "Process approved expense: ${{trigger.amount}} for {{trigger.requester}}",

                    "position": {"x": 500, "y": 300},                            "temperature": 0.3

                    "data": {                        }

                        "label": "Check Validation",                    }

                        "config": {                },

                            "name": "Validation Router",                {

                            "conditions": [                    "id": event_id,

                                {                    "type": "event",

                                    "id": "valid_path",                    "position": {"x": 100, "y": 700},

                                    "variable": f"{validator_id}.output",                    "data": {

                                    "operator": "contains",                        "label": "Notify Completion",

                                    "value": "VALID",                        "config": {

                                    "target_node_id": approval_id                            "event_type": "expense.processed",

                                },                            "payload_template": {

                                {                                "amount": "{{trigger.amount}}",

                                    "id": "invalid_path",                                "requester": "{{trigger.requester}}",

                                    "variable": f"{validator_id}.output",                                "status": "completed"

                                    "operator": "contains",                            }

                                    "value": "INVALID",                        }

                                    "target_node_id": rejected_end_id                    }

                                }                },

                            ],                {

                            "default_target_node_id": approval_id                    "id": end_id,

                        }                    "type": "end",

                    }                    "position": {"x": 100, "y": 850},

                },                    "data": {

                {                        "label": "Expense Processed",

                    "id": approval_id,                        "config": {}

                    "type": "approval",                    }

                    "position": {"x": 700, "y": 200},                }

                    "data": {            ],

                        "label": "Manager Approval",            "edges": [

                        "config": {                {"id": "e1", "source": trigger_id, "target": agent_validate_id, "type": "default"},

                            "name": "Manager Review",                {"id": "e2", "source": agent_validate_id, "target": approval_id, "type": "default"},

                            "message": "Please review and approve this expense request.",                {"id": "e3", "source": approval_id, "target": agent_process_id, "type": "default"},

                            "approver_email": "workflow.orchestrator@lyzr.ai"                {"id": "e4", "source": agent_process_id, "target": event_id, "type": "default"},

                        }                {"id": "e5", "source": event_id, "target": end_id, "type": "default"}

                    }            ]

                },        }

                {    }

                    "id": process_id,
                    "type": "agent",
                    "position": {"x": 900, "y": 200},
                    "data": {
                        "label": "Process Payment",
                        "config": {
                            "name": "Payment Processor",
                            "system_instructions": "Generate a payment confirmation message with transaction ID and expected processing time.",
                            "temperature": 0.5,
                            "expected_output_format": "text",
                            "llm_config": {
                                "provider": "openai",
                                "model": "gpt-4o-mini",
                                "api_key_source": "env",
                                "api_key_env_var": "OPENAI_API_KEY"
                            }
                        }
                    }
                },
                {
                    "id": approved_end_id,
                    "type": "end",
                    "position": {"x": 1100, "y": 200},
                    "data": {
                        "label": "✅ Processed",
                        "config": {
                            "name": "Expense Approved & Processed",
                            "capture_output": True,
                            "show_output": True
                        }
                    }
                },
                {
                    "id": rejected_end_id,
                    "type": "end",
                    "position": {"x": 700, "y": 450},
                    "data": {
                        "label": "❌ Rejected",
                        "config": {
                            "name": "Expense Rejected",
                            "capture_output": True,
                            "show_output": True
                        }
                    }
                }
            ],
            "edges": [
                {"id": f"{trigger_id}-{validator_id}", "source": trigger_id, "target": validator_id, "type": "default"},
                {"id": f"{validator_id}-{conditional_id}", "source": validator_id, "target": conditional_id, "type": "default"},
                {"id": f"{conditional_id}-{approval_id}", "source": conditional_id, "target": approval_id, "type": "conditional", "sourceHandle": "valid_path"},
                {"id": f"{conditional_id}-{rejected_end_id}", "source": conditional_id, "target": rejected_end_id, "type": "conditional", "sourceHandle": "invalid_path"},
                {"id": f"{approval_id}-{process_id}", "source": approval_id, "target": process_id, "type": "default"},
                {"id": f"{process_id}-{approved_end_id}", "source": process_id, "target": approved_end_id, "type": "default"}
            ]
        }
    }
