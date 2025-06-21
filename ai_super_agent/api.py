"""Flask API blueprint for AI Super Agent."""

import logging
from flask import Blueprint, request, jsonify
from ai_super_agent.models.mcp import MCPEnvelope
from ai_super_agent.queue.broker import enqueue
from ai_super_agent.views.kpi import kpi_bp
from ai_super_agent.views.strategy import strategy_bp
from ai_super_agent.views.logs import logs_bp
from ai_super_agent.views.agents import agents_bp
from ai_super_agent.views.workings import workings_bp

logger = logging.getLogger(__name__)

# Create Flask blueprint
api_bp = Blueprint('api', __name__)

# Register sub-blueprints
api_bp.register_blueprint(kpi_bp)
api_bp.register_blueprint(strategy_bp)
api_bp.register_blueprint(logs_bp)
api_bp.register_blueprint(agents_bp)
api_bp.register_blueprint(workings_bp)


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
        from ai_super_agent.queue.broker import get_queue_length, get_redis_client
        
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
