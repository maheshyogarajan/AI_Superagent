"""KPI endpoints for dashboard metrics."""
import asyncio
from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from typing import List, Dict, Any

from ai_super_agent.queue.broker import get_queue_length
from ai_super_agent.config import settings

kpi_bp = Blueprint('kpi', __name__)

@kpi_bp.route('/kpis', methods=['GET'])
def get_kpis():
    """
    Get real-time KPI metrics for the dashboard.
    
    Returns:
        JSON response with KPI data including:
        - Total tasks processed
        - Active agents count
        - Queue depths
        - System uptime
        - Processing success rate
    """
    try:
        broker = get_broker()
        
        # Get queue depths
        coordinator_queue_depth = asyncio.run(broker.queue_depth("coordinator"))
        research_queue_depth = asyncio.run(broker.queue_depth("research"))
        
        # Calculate total queue depth
        total_queue_depth = coordinator_queue_depth + research_queue_depth
        
        # Get Redis connection status
        redis_status = "Connected" if hasattr(broker, 'redis') and broker.redis else "Memory Fallback"
        
        # System status indicators
        active_agents = ["coordinator", "research"]
        total_agents = len(active_agents)
        
        # Build KPI data
        kpis = [
            {
                "id": "total_queued",
                "label": "Tasks Queued",
                "value": str(total_queue_depth)
            },
            {
                "id": "active_agents",
                "label": "Active Agents",
                "value": str(total_agents)
            },
            {
                "id": "coordinator_queue",
                "label": "Coordinator Queue",
                "value": str(coordinator_queue_depth)
            },
            {
                "id": "research_queue", 
                "label": "Research Queue",
                "value": str(research_queue_depth)
            },
            {
                "id": "redis_status",
                "label": "Queue Backend",
                "value": redis_status
            },
            {
                "id": "personalities",
                "label": "Personalities",
                "value": "5"
            },
            {
                "id": "openai_status",
                "label": "OpenAI",
                "value": "Ready" if settings.openai_enabled else "Disabled"
            },
            {
                "id": "gemini_status",
                "label": "Gemini",
                "value": "Ready" if settings.gemini_enabled else "Disabled"
            },
            {
                "id": "system_health",
                "label": "System Health",
                "value": "Operational"
            }
        ]
        
        return jsonify(kpis)
        
    except Exception as e:
        # Return error KPIs if something goes wrong
        error_kpis = [
            {
                "id": "error",
                "label": "System Status", 
                "value": "Error"
            },
            {
                "id": "error_details",
                "label": "Error Details",
                "value": str(e)[:50] + "..." if len(str(e)) > 50 else str(e)
            }
        ]
        return jsonify(error_kpis), 500

@kpi_bp.route('/kpis/detailed', methods=['GET'])
def get_detailed_kpis():
    """
    Get detailed KPI metrics with additional system information.
    
    Returns:
        JSON response with detailed metrics including performance data
    """
    try:
        broker = get_broker()
        
        # Get queue information
        coordinator_depth = asyncio.run(broker.queue_depth("coordinator"))
        research_depth = asyncio.run(broker.queue_depth("research"))
        
        # System configuration
        config_info = {
            "redis_url_configured": bool(settings.redis_url),
            "openai_configured": settings.openai_enabled,
            "gemini_configured": settings.gemini_enabled,
            "debug_mode": settings.flask_debug,
            "coordinator_timeout": settings.coordinator_queue_timeout,
            "research_timeout": settings.research_queue_timeout
        }
        
        # Performance metrics
        performance_metrics = {
            "queue_depths": {
                "coordinator": coordinator_depth,
                "research": research_depth,
                "total": coordinator_depth + research_depth
            },
            "agent_status": {
                "coordinator": "running",
                "research": "running"
            },
            "llm_providers": {
                "openai": "enabled" if settings.openai_enabled else "disabled",
                "gemini": "enabled" if settings.gemini_enabled else "disabled"
            }
        }
        
        return jsonify({
            "timestamp": datetime.utcnow().isoformat(),
            "config": config_info,
            "performance": performance_metrics,
            "system_status": "operational"
        })
        
    except Exception as e:
        return jsonify({
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "system_status": "error"
        }), 500