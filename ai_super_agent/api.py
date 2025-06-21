"""Flask API blueprint for AI Super Agent."""

import logging
from flask import Blueprint, request, jsonify
from ai_super_agent.models.mcp import MCPEnvelope
from ai_super_agent.queue.broker import enqueue

logger = logging.getLogger(__name__)

# Create Flask blueprint
api_bp = Blueprint('api', __name__)


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
        
        # Create MCP envelope
        envelope = MCPEnvelope(
            method="task",
            params={
                "instruction": instruction,
                "context": context
            },
            recipient=recipient,
            instruction=instruction,
            context=context
        )
        
        # Enqueue the task synchronously
        import asyncio
        success = asyncio.run(enqueue(recipient, envelope))
        
        if success:
            logger.info(f"Task submitted successfully to {recipient}: {instruction[:100]}...")
            return jsonify({
                "status": "success",
                "message": f"Task submitted to {recipient}",
                "task_id": envelope.id,
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
async def get_status():
    """
    Get system status information.
    
    Returns:
        JSON response with system status
    """
    try:
        from ai_super_agent.queue.broker import get_queue_length, get_redis_client
        
        # Check Redis connection
        try:
            client = await get_redis_client()
            await client.ping()
            redis_status = "connected"
        except Exception as e:
            redis_status = f"error: {str(e)}"
        
        # Get queue lengths
        coordinator_queue_length = await get_queue_length("coordinator")
        research_queue_length = await get_queue_length("research")
        
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
