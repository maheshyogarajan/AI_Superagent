"""Agents management endpoints for personality assignment."""
from datetime import datetime
from flask import Blueprint, request, jsonify
from typing import List, Dict, Any

agents_bp = Blueprint('agents', __name__)

# In-memory agent registry
_agents_registry = [
    {
        "id": "coordinator",
        "name": "Coordinator Agent",
        "personality_id": "Default",
        "status": "active",
        "last_updated": datetime.utcnow().isoformat(),
        "description": "Central task routing and management agent"
    },
    {
        "id": "research", 
        "name": "Research Agent",
        "personality_id": "Default",
        "status": "active",
        "last_updated": datetime.utcnow().isoformat(),
        "description": "Specialized research and analysis agent"
    }
]

@agents_bp.route('/agents', methods=['GET'])
def get_agents():
    """
    Get list of all agents with their current personality assignments.
    
    Returns:
        JSON response with agent details including personality assignments
    """
    try:
        return jsonify(_agents_registry)
    except Exception as e:
        return jsonify({
            "error": "Failed to retrieve agents",
            "message": str(e)
        }), 500

@agents_bp.route('/agents/<agent_id>', methods=['GET'])
def get_agent(agent_id: str):
    """
    Get details for a specific agent.
    
    Args:
        agent_id: The agent identifier
        
    Returns:
        JSON response with agent details
    """
    try:
        agent = next((a for a in _agents_registry if a["id"] == agent_id), None)
        if not agent:
            return jsonify({
                "error": "Agent not found",
                "agent_id": agent_id
            }), 404
            
        return jsonify(agent)
    except Exception as e:
        return jsonify({
            "error": "Failed to retrieve agent",
            "message": str(e)
        }), 500

@agents_bp.route('/agents/<agent_id>/personality', methods=['PATCH'])
def update_agent_personality(agent_id: str):
    """
    Update the personality assignment for a specific agent.
    
    Args:
        agent_id: The agent identifier
        
    Expected JSON payload:
    {
        "personality_id": "Warren_Buffett"
    }
    
    Returns:
        JSON response with updated agent details
    """
    try:
        data = request.get_json()
        if not data or 'personality_id' not in data:
            return jsonify({
                "error": "Missing personality_id in request body"
            }), 400
            
        personality_id = data['personality_id']
        
        # Find the agent
        agent = next((a for a in _agents_registry if a["id"] == agent_id), None)
        if not agent:
            return jsonify({
                "error": "Agent not found",
                "agent_id": agent_id
            }), 404
        
        # Valid personality IDs (should match the ones in personalities.py)
        valid_personalities = [
            "Default", "Warren_Buffett", "Steve_Jobs", "Rory_Sutherland", "Technical"
        ]
        
        if personality_id not in valid_personalities:
            return jsonify({
                "error": "Invalid personality_id",
                "personality_id": personality_id,
                "valid_personalities": valid_personalities
            }), 400
        
        # Update the agent's personality
        old_personality = agent["personality_id"]
        agent["personality_id"] = personality_id
        agent["last_updated"] = datetime.utcnow().isoformat()
        
        return jsonify({
            "success": True,
            "agent_id": agent_id,
            "old_personality": old_personality,
            "new_personality": personality_id,
            "updated_at": agent["last_updated"],
            "agent": agent
        })
        
    except Exception as e:
        return jsonify({
            "error": "Failed to update agent personality",
            "message": str(e)
        }), 500

@agents_bp.route('/agents/<agent_id>/status', methods=['PATCH'])
def update_agent_status(agent_id: str):
    """
    Update the status of a specific agent.
    
    Args:
        agent_id: The agent identifier
        
    Expected JSON payload:
    {
        "status": "active" | "inactive" | "maintenance"
    }
    
    Returns:
        JSON response with updated agent details
    """
    try:
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({
                "error": "Missing status in request body"
            }), 400
            
        status = data['status']
        valid_statuses = ["active", "inactive", "maintenance"]
        
        if status not in valid_statuses:
            return jsonify({
                "error": "Invalid status",
                "status": status,
                "valid_statuses": valid_statuses
            }), 400
        
        # Find the agent
        agent = next((a for a in _agents_registry if a["id"] == agent_id), None)
        if not agent:
            return jsonify({
                "error": "Agent not found",
                "agent_id": agent_id
            }), 404
        
        # Update the agent's status
        old_status = agent["status"]
        agent["status"] = status
        agent["last_updated"] = datetime.utcnow().isoformat()
        
        return jsonify({
            "success": True,
            "agent_id": agent_id,
            "old_status": old_status,
            "new_status": status,
            "updated_at": agent["last_updated"],
            "agent": agent
        })
        
    except Exception as e:
        return jsonify({
            "error": "Failed to update agent status",
            "message": str(e)
        }), 500

@agents_bp.route('/agents/stats', methods=['GET'])
def get_agent_stats():
    """
    Get statistics about agent personality distribution and activity.
    
    Returns:
        JSON response with agent statistics
    """
    try:
        total_agents = len(_agents_registry)
        
        # Count by personality
        personality_counts = {}
        status_counts = {}
        
        for agent in _agents_registry:
            personality = agent.get("personality_id", "Unknown")
            personality_counts[personality] = personality_counts.get(personality, 0) + 1
            
            status = agent.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        stats = {
            "total_agents": total_agents,
            "personality_distribution": personality_counts,
            "status_distribution": status_counts,
            "last_updated": max([agent.get("last_updated", "") for agent in _agents_registry]),
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({
            "error": "Failed to generate agent statistics",
            "message": str(e)
        }), 500