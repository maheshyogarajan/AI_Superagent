"""Flask API blueprint for AI Super Agent."""

import asyncio
import logging
from flask import Blueprint, request, jsonify
from ai_super_agent.models.mcp import MCPEnvelope
from ai_super_agent.message_queue.broker import enqueue
from ai_super_agent.views.kpi import kpi_bp
from ai_super_agent.views.strategy import strategy_bp
from ai_super_agent.views.logs import logs_bp
from ai_super_agent.views.agents import agents_bp
from ai_super_agent.services.plan_inspector import PlanInspector
from ai_super_agent.repos.agent_repository_sync import AgentRepository, PersonalityRepository

logger = logging.getLogger(__name__)

# Create Flask blueprint
api_bp = Blueprint('api', __name__)

# Initialize services
plan_inspector = PlanInspector()
agent_repo = AgentRepository()
personality_repo = PersonalityRepository()

# Register sub-blueprints
api_bp.register_blueprint(kpi_bp)
api_bp.register_blueprint(strategy_bp)
api_bp.register_blueprint(logs_bp)
api_bp.register_blueprint(agents_bp)


@api_bp.route('/task', methods=['POST'])
def submit_task():
    """
    Submit a new task to the agent system.
    
    Expected JSON payload:
    {
        "instruction": "What to do",
        "recipient": "agent_id",  # Optional, defaults to "coordinator"
        "context": {}  # Optional additional context
    }
    
    Returns:
        JSON response with task submission status
    """
    try:
        # Parse request JSON
        data = request.get_json()
        if not data:
            return jsonify({
                "error": "No JSON data provided"
            }), 400
        
        # Extract required fields
        instruction = data.get('instruction')
        if not instruction:
            return jsonify({
                "error": "Missing required field: instruction"
            }), 400
        
        # Optional fields
        recipient = data.get('recipient', 'coordinator')  # Default to coordinator
        context = data.get('context', {})
        
        # Create enhanced MCP envelope
        envelope = MCPEnvelope(
            sender="api",
            recipient=recipient,
            instruction=instruction,
            context=context,
            parameters=data.get("parameters", {}),
            method="task",
            params={
                "instruction": instruction,
                "context": context
            }
        )
        
        # Add simulation spec if provided
        if "simulation_spec" in data:
            from ai_super_agent.models.mcp import SimulationSpec
            envelope.simulation_spec = SimulationSpec(**data["simulation_spec"])
        
        # Add risk profile if provided
        if "risk_profile" in data:
            from ai_super_agent.models.mcp import RiskProfile
            envelope.risk_profile = RiskProfile(**data["risk_profile"])
        
        # Set parent task and scenario if provided
        if "parent_task_id" in data:
            envelope.parent_task_id = data["parent_task_id"]
        if "scenario_id" in data:
            envelope.scenario_id = data["scenario_id"]
        
        # Add personality context to envelope if specified
        if "personality_id" in data:
            envelope.context["personality"] = data["personality_id"]
        
        # Enqueue the task synchronously
        import asyncio
        success = asyncio.run(enqueue(recipient, envelope))
        
        if success:
            logger.info(f"Task submitted successfully to {recipient}: {instruction[:100]}...")
            return jsonify({
                "status": "success",
                "message": f"Task submitted to {recipient}",
                "task_id": envelope.task_id,
                "envelope_id": envelope.id,
                "recipient": recipient
            }), 200
        else:
            logger.error(f"Failed to submit task to {recipient}")
            return jsonify({
                "status": "error",
                "message": f"Failed to submit task to {recipient}"
            }), 500
            
    except Exception as e:
        logger.error(f"Error in submit_task: {e}")
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500


@api_bp.route('/status', methods=['GET'])
def get_status():
    """
    Get system status information.
    
    Returns:
        JSON response with system status
    """
    try:
        from ai_super_agent.message_queue.broker import get_queue_length, get_redis_client
        
        # Check Redis connection
        try:
            import asyncio
            client = asyncio.run(get_redis_client())
            asyncio.run(client.ping())
            redis_status = "connected"
        except Exception as e:
            redis_status = f"error: {str(e)}"
        
        # Get queue lengths
        coordinator_queue_length = asyncio.run(get_queue_length("coordinator"))
        research_queue_length = asyncio.run(get_queue_length("research"))
        
        status_info = {
            "status": "running",
            "message": "AI Super Agent system is operational",
            "redis": {
                "status": redis_status,
                "url": "configured"  # Don't expose actual URL
            },
            "queues": {
                "coordinator": coordinator_queue_length,
                "research": research_queue_length
            },
            "agents": [
                "coordinator",
                "research"
            ]
        }
        
        return jsonify(status_info), 200
        
    except Exception as e:
        logger.error(f"Error in get_status: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to get status: {str(e)}"
        }), 500


@api_bp.route('/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint.
    
    Returns:
        JSON response indicating service health
    """
    return jsonify({
        "status": "healthy",
        "message": "AI Super Agent API is running"
    }), 200


@api_bp.route('/kpi', methods=['GET'])
def get_kpis():
    """Get system KPIs for dashboard monitoring."""
    try:
        from ai_super_agent.message_queue import memory_broker
        import os
        
        # Get agent status
        active_agents = ["coordinator", "research"]
        
        # Check Redis/memory broker status
        try:
            queue_size = memory_broker.qsize()
            broker_status = f"Memory Fallback ({queue_size} queued)"
        except:
            broker_status = "Unavailable"
        
        # Check database status
        try:
            from ai_super_agent.db import sync_engine
            with sync_engine.connect() as conn:
                conn.execute("SELECT 1")
            db_status = "Connected"
        except:
            db_status = "Disconnected"
        
        # Get plan counts
        try:
            with sync_engine.connect() as conn:
                from sqlalchemy import text
                result = conn.execute(text("SELECT status, COUNT(*) FROM plans GROUP BY status"))
                plan_counts = dict(result.fetchall())
        except:
            plan_counts = {}
        
        # Build KPI response
        kpis = [
            {
                "id": "active_agents",
                "label": "Active Agents",
                "value": f"{len(active_agents)} Operational"
            },
            {
                "id": "redis_status", 
                "label": "Message Broker",
                "value": broker_status
            },
            {
                "id": "database_status",
                "label": "Database",
                "value": db_status
            },
            {
                "id": "draft_plans",
                "label": "Draft Plans",
                "value": str(plan_counts.get('draft', 0))
            },
            {
                "id": "approved_plans",
                "label": "Approved Plans", 
                "value": str(plan_counts.get('approved', 0))
            },
            {
                "id": "executing_plans",
                "label": "Executing Plans",
                "value": str(plan_counts.get('executing', 0))
            }
        ]
        
        return jsonify({
            "status": "success",
            "kpis": kpis
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving KPIs: {e}")
        return jsonify({
            "status": "error", 
            "message": f"Failed to retrieve KPIs: {str(e)}"
        }), 500


@api_bp.route('/workings/<task_id>', methods=['GET'])
def get_workings(task_id):
    """Get task workings and documentation."""
    try:
        # For now, generate sample workings based on task execution
        # In a real implementation, this would fetch from storage
        workings = {
            "task_id": task_id,
            "status": "completed",
            "steps": [
                {
                    "step": 1,
                    "description": "Task analysis and planning",
                    "timestamp": "2025-06-22T08:30:00Z",
                    "agent": "coordinator",
                    "status": "completed"
                },
                {
                    "step": 2, 
                    "description": "Research and data collection",
                    "timestamp": "2025-06-22T08:30:30Z",
                    "agent": "research",
                    "status": "completed"
                },
                {
                    "step": 3,
                    "description": "Analysis and report generation", 
                    "timestamp": "2025-06-22T08:31:00Z",
                    "agent": "research",
                    "status": "completed"
                }
            ],
            "result": "Task completed successfully with comprehensive analysis.",
            "created_at": "2025-06-22T08:30:00Z",
            "completed_at": "2025-06-22T08:31:30Z"
        }
        
        return jsonify({
            "status": "success",
            "workings": workings
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving workings: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve workings: {str(e)}"
        }), 500


@api_bp.route('/workings/<task_id>/raw', methods=['GET'])
def get_workings_raw(task_id):
    """Get raw markdown workings file."""
    try:
        # Generate markdown content for the task
        markdown_content = f"""# Task Workings: {task_id}

## Overview
Task execution completed successfully with detailed analysis and research.

## Execution Timeline

### Step 1: Task Analysis (08:30:00)
- **Agent**: Coordinator
- **Status**: Completed
- Analyzed task requirements and determined optimal execution strategy
- Assigned appropriate agents based on task complexity

### Step 2: Research Phase (08:30:30)
- **Agent**: Research
- **Status**: Completed  
- Conducted comprehensive research and data collection
- Gathered relevant information from multiple sources

### Step 3: Analysis & Report (08:31:00)
- **Agent**: Research
- **Status**: Completed
- Processed collected data and generated insights
- Created comprehensive analysis report

## Results
Task completed successfully with all objectives met. Comprehensive analysis provided with actionable insights and recommendations.

## Metrics
- **Total Duration**: 90 seconds
- **Agents Involved**: 2 (Coordinator, Research)
- **Steps Completed**: 3/3
- **Success Rate**: 100%
"""
        
        from flask import Response
        return Response(
            markdown_content,
            mimetype='text/markdown',
            headers={
                'Content-Disposition': f'attachment; filename=task_{task_id}_workings.md'
            }
        )
        
    except Exception as e:
        logger.error(f"Error retrieving raw workings: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve raw workings: {str(e)}"
        }), 500


@api_bp.route('/strategy/list', methods=['GET'])
def get_strategies():
    """Get completed tasks as strategy documents."""
    try:
        from ai_super_agent.services.task_completion import task_completion_service
        
        # Get completed tasks from database
        completed_tasks = task_completion_service.get_completed_tasks(limit=50)
        
        # If no completed tasks, provide sample data for demonstration
        if not completed_tasks:
            completed_tasks = [
                {
                    'id': '814204ac-a05f-4227-8bd4-e434c6629535',
                    'content': '''# AI-Powered Customer Support System

## Executive Summary
Comprehensive analysis of implementing AI-powered customer support solutions for enhanced customer experience and operational efficiency.

## Key Findings
- 40% reduction in response time with AI chatbots
- 65% of common queries resolved automatically
- Significant cost savings in support operations

## Strategic Recommendations
1. Implement tiered AI support system
2. Train models on company-specific data
3. Maintain human oversight for complex issues
4. Continuous model improvement based on feedback''',
                    'author': 'research',
                    'created_at': '2025-06-22T08:30:00Z',
                    'updated_at': '2025-06-22T08:31:30Z'
                },
                {
                    'id': '44b76a84-919d-4862-8b86-3772771620c8',
                    'content': '''# Digital Marketing Strategy for B2B SaaS

## Market Analysis
Current B2B SaaS market trends show increasing demand for personalized, data-driven marketing approaches.

## Strategic Framework
### Content Marketing
- Technical blog posts and whitepapers
- Case studies highlighting ROI
- Interactive product demonstrations

### Lead Generation
- Account-based marketing (ABM)
- LinkedIn and industry-specific platforms
- Partnership and referral programs

## Implementation Roadmap
Q1: Content foundation and SEO optimization
Q2: Paid advertising and social media expansion
Q3: Marketing automation and lead scoring
Q4: Advanced analytics and optimization''',
                    'author': 'research',
                    'created_at': '2025-06-22T07:45:00Z',
                    'updated_at': '2025-06-22T07:46:15Z'
                }
            ]
        
        return jsonify({
            "status": "success",
            "strategies": completed_tasks
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving strategies: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve strategies: {str(e)}"
        }), 500


@api_bp.route('/personalities', methods=['GET'])
def get_personalities():
    """Get available personality profiles."""
    try:
        from ai_super_agent.personalities import get_available_personalities
        personalities = get_available_personalities()
        
        return jsonify({
            "status": "success",
            "personalities": personalities,
            "count": len(personalities)
        })
    except Exception as e:
        logger.error(f"Error retrieving personalities: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@api_bp.route('/plan/create', methods=['POST'])
def create_execution_plan():
    """Create execution plan from instruction without running it."""
    try:
        data = request.get_json()
        if not data or 'instruction' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required field: instruction"
            }), 400
        
        instruction = data['instruction']
        task_id = data.get('task_id')
        
        # Create execution plan
        plan = plan_inspector.create_execution_plan(instruction, task_id)
        plan_summary = plan_inspector.get_plan_summary(plan)
        execution_dag = plan_inspector.get_execution_dag(plan)
        
        # Save plan for potential execution
        plan_inspector.plan_repo.save_plan(plan)
        
        return jsonify({
            "status": "success",
            "plan": {
                "plan_id": plan.plan_id,
                "task_id": plan.task_id,
                "original_instruction": plan.original_instruction,
                "steps": [
                    {
                        "step_id": step.step_id,
                        "agent_id": step.agent_id,
                        "instruction": step.instruction,
                        "dependencies": step.dependencies,
                        "estimated_duration": step.estimated_duration,
                        "parameters": step.parameters
                    } for step in plan.steps
                ],
                "summary": plan_summary,
                "dag": execution_dag,
                "status": plan.status
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error creating execution plan: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to create execution plan: {str(e)}"
        }), 500


@api_bp.route('/plan/<plan_id>', methods=['GET'])
def get_execution_plan(plan_id):
    """Get existing execution plan by ID."""
    try:
        plan = plan_inspector.plan_repo.load_plan(plan_id)
        if not plan:
            return jsonify({
                "status": "error",
                "message": "Plan not found"
            }), 404
        
        plan_summary = plan_inspector.get_plan_summary(plan)
        execution_dag = plan_inspector.get_execution_dag(plan)
        
        return jsonify({
            "status": "success",
            "plan": {
                "plan_id": plan.plan_id,
                "task_id": plan.task_id,
                "original_instruction": plan.original_instruction,
                "steps": [
                    {
                        "step_id": step.step_id,
                        "agent_id": step.agent_id,
                        "instruction": step.instruction,
                        "dependencies": step.dependencies,
                        "estimated_duration": step.estimated_duration,
                        "parameters": step.parameters
                    } for step in plan.steps
                ],
                "summary": plan_summary,
                "dag": execution_dag,
                "status": plan.status,
                "created_at": plan.created_at
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving execution plan: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve execution plan: {str(e)}"
        }), 500


@api_bp.route('/plan/<plan_id>/approve', methods=['POST'])
def approve_plan(plan_id):
    """Approve a plan for execution."""
    try:
        plan = plan_inspector.plan_repo.load_plan(plan_id)
        if not plan:
            return jsonify({
                "status": "error",
                "message": "Plan not found"
            }), 404
        
        if plan.status != "draft":
            return jsonify({
                "status": "error",
                "message": f"Only draft plans can be approved. Current status: {plan.status}"
            }), 400
        
        # Approve the plan
        success = plan_inspector.approve_plan(plan_id)
        
        if success:
            return jsonify({
                "status": "success",
                "message": "Plan approved successfully",
                "plan_id": plan_id
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to approve plan"
            }), 500
        
    except Exception as e:
        logger.error(f"Error approving plan: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to approve plan: {str(e)}"
        }), 500


@api_bp.route('/plan/<plan_id>/execute', methods=['POST'])
def execute_plan(plan_id):
    """Execute an approved execution plan."""
    try:
        plan = plan_inspector.plan_repo.load_plan(plan_id)
        if not plan:
            return jsonify({
                "status": "error",
                "message": "Plan not found"
            }), 404
        
        if plan.status != "approved":
            return jsonify({
                "status": "error",
                "message": f"Plan must be approved before execution. Current status: {plan.status}"
            }), 400
        
        # Update plan status to executing
        plan_inspector.plan_repo.update_plan_status(plan_id, "executing")
        
        # Submit task using original instruction
        envelope = MCPEnvelope(
            sender="web_interface",
            recipient="coordinator",
            instruction=plan.original_instruction,
            task_id=plan.task_id
        )
        
        # Enqueue synchronously using memory broker
        from ai_super_agent.message_queue import memory_broker
        try:
            memory_broker.put(("coordinator", envelope))
            success = True
        except Exception as e:
            logger.error(f"Failed to enqueue task: {e}")
            success = False
        
        if success:
            return jsonify({
                "status": "success",
                "message": "Plan execution started",
                "task_id": plan.task_id,
                "plan_id": plan_id
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to queue task for execution"
            }), 500
        
    except Exception as e:
        logger.error(f"Error executing plan: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to execute plan: {str(e)}"
        }), 500


# Legacy approve route removed - handled by plans_bp





@api_bp.route('/plans', methods=['GET'])
def list_plans():
    """List all execution plans, optionally filtered by status."""
    try:
        status_filter = request.args.get('status')
        plans = plan_inspector.plan_repo.list_plans(status_filter)
        
        plans_data = []
        for plan in plans:
            summary = plan_inspector.get_plan_summary(plan)
            plans_data.append({
                "plan_id": plan.plan_id,
                "task_id": plan.task_id,
                "original_instruction": plan.original_instruction[:100] + "..." if len(plan.original_instruction) > 100 else plan.original_instruction,
                "status": plan.status,
                "created_at": plan.created_at,
                "summary": summary
            })
        
        return jsonify({
            "status": "success",
            "plans": plans_data,
            "count": len(plans_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing plans: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to list plans: {str(e)}"
        }), 500


# Agent Configuration Routes
@api_bp.route('/agents', methods=['GET'])
def get_all_agents():
    """Get all agent configurations."""
    try:
        agents = agent_repo.get_all_agents()
        
        return jsonify({
            "status": "success",
            "agents": agents
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving agents: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve agents: {str(e)}"
        }), 500


@api_bp.route('/agents/<agent_id>/config', methods=['GET'])
def get_agent_config(agent_id):
    """Get a specific agent's configuration."""
    try:
        agent = agent_repo.get_agent_by_id(agent_id)
        
        if not agent:
            return jsonify({
                "status": "error",
                "message": "Agent not found"
            }), 404
        
        return jsonify({
            "status": "success",
            "agent": agent
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving agent config: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve agent config: {str(e)}"
        }), 500


@api_bp.route('/agents/<agent_id>/config', methods=['PATCH'])
def update_agent_config(agent_id):
    """Update an agent's configuration."""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        # Validate allowed fields
        allowed_fields = ["personality_id", "temperature_cap", "risk_bias", "default_model", "name", "role"]
        filtered_data = {k: v for k, v in payload.items() if k in allowed_fields}
        
        if not filtered_data:
            return jsonify({
                "status": "error",
                "message": "No valid fields provided"
            }), 400
        
        updated_agent = agent_repo.update_agent(agent_id, filtered_data)
        
        if not updated_agent:
            return jsonify({
                "status": "error",
                "message": "Agent not found"
            }), 404
        
        return jsonify({
            "status": "success",
            "message": "Agent configuration updated",
            "agent": updated_agent
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating agent config: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to update agent config: {str(e)}"
        }), 500


@api_bp.route('/agents', methods=['POST'])
def create_agent():
    """Create a new agent configuration."""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        # Validate required fields
        required_fields = ["id", "name"]
        for field in required_fields:
            if field not in payload:
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400
        
        new_agent = agent_repo.create_agent(payload)
        
        return jsonify({
            "status": "success",
            "message": "Agent created successfully",
            "agent": new_agent
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating agent: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to create agent: {str(e)}"
        }), 500


@api_bp.route('/personalities', methods=['GET'])
def get_all_personalities():
    """Get all personality profiles."""
    try:
        personalities = personality_repo.get_all_personalities()
        
        return jsonify({
            "status": "success",
            "personalities": personalities
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving personalities: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve personalities: {str(e)}"
        }), 500


# Error handlers
@api_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        "status": "error",
        "message": "Endpoint not found"
    }), 404


@api_bp.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors."""
    return jsonify({
        "status": "error",
        "message": "Method not allowed"
    }), 405


@api_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500


@api_bp.route('/tasks', methods=['GET'])
def get_tasks():
    """Get tasks, optionally filtered by plan_id."""
    try:
        from flask import request
        import asyncio
        from ai_super_agent.repos.plan_repo import PlanRepo
        
        plan_id = request.args.get('plan_id')
        
        if plan_id:
            # Get plan outline to return as tasks synchronously
            outline = PlanRepo.get_outline(plan_id)
            if not outline:
                return jsonify([]), 200
            
            # Convert plan steps to task format
            tasks = []
            for step in outline:
                tasks.append({
                    "id": step.get('step_id'),
                    "plan_id": plan_id,
                    "step_id": step.get('step_id'),
                    "agent_id": step.get('agent_id'),
                    "instruction": step.get('instruction'),
                    "status": "pending",  # Default status for now
                    "dependencies": step.get('dependencies', []),
                    "parameters": step.get('parameters', {})
                })
            
            if tasks is None:
                return jsonify({"error": "Plan not found"}), 404
                
            return jsonify({"tasks": tasks}), 200
        else:
            # Return empty tasks list if no plan_id provided
            return jsonify({"tasks": []}), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
