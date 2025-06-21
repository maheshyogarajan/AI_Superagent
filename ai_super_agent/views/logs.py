"""Logs endpoints for MCP envelope history tracking."""
import json
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from typing import List, Dict, Any

logs_bp = Blueprint('logs', __name__)

# In-memory log storage for demonstration
# In production, this would be stored in Redis or a database
_envelope_logs: List[Dict[str, Any]] = []

def add_envelope_log(envelope_data: Dict[str, Any]) -> None:
    """Add an envelope to the log history."""
    global _envelope_logs
    
    # Add timestamp if not present
    if 'timestamp' not in envelope_data:
        envelope_data['timestamp'] = datetime.utcnow().isoformat()
    
    # Add to logs
    _envelope_logs.append(envelope_data)
    
    # Keep only last 500 entries
    if len(_envelope_logs) > 500:
        _envelope_logs = _envelope_logs[-500:]

# Generate sample log data for demonstration
def _generate_sample_logs():
    """Generate sample MCP envelope logs for demonstration."""
    global _envelope_logs
    
    if _envelope_logs:
        return  # Already have logs
    
    sample_envelopes = [
        {
            "sender": "user_interface",
            "recipient": "coordinator", 
            "timestamp": (datetime.utcnow() - timedelta(minutes=45)).isoformat(),
            "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "instruction": "Analyze market trends for renewable energy investments in Q1 2025",
            "parameters": {"temperature": 0.7, "max_tokens": 2000},
            "context": {"market_segment": "renewable_energy", "timeframe": "Q1_2025"},
            "result": {"status": "completed", "data_output_ref": "analysis_renewable_q1.json"},
            "quality_score": {"self": 0.85, "coordinator": 0.82},
            "signature": "sha256:abc123def456..."
        },
        {
            "sender": "coordinator",
            "recipient": "research",
            "timestamp": (datetime.utcnow() - timedelta(minutes=30)).isoformat(),
            "task_id": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
            "instruction": "Research competitive landscape for AI productivity tools targeting enterprise",
            "parameters": {"temperature": 0.8, "max_tokens": 3000},
            "context": {"segment": "enterprise", "focus": "productivity_tools"},
            "result": {"status": "processing"},
            "signature": "sha256:def456ghi789..."
        },
        {
            "sender": "user_interface", 
            "recipient": "coordinator",
            "timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
            "task_id": "c3d4e5f6-g7h8-9012-cdef-345678901234",
            "instruction": "Create marketing strategy for B2B SaaS product launch with behavioral psychology insights",
            "parameters": {"temperature": 0.9, "max_tokens": 4000},
            "context": {"personality": "Rory_Sutherland", "industry": "B2B_SaaS"},
            "result": {"status": "completed", "data_output_ref": "marketing_strategy_b2b.json"},
            "quality_score": {"self": 0.91, "coordinator": 0.88},
            "signature": "sha256:ghi789jkl012..."
        },
        {
            "sender": "research",
            "recipient": "coordinator",
            "timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
            "task_id": "d4e5f6g7-h8i9-0123-defg-456789012345",
            "instruction": "Investment analysis for Tesla stock using Warren Buffett methodology",
            "parameters": {"temperature": 0.3, "max_tokens": 2500},
            "context": {"personality": "Warren_Buffett", "stock": "TSLA", "analysis_type": "value_investing"},
            "result": {"status": "error", "message": "Insufficient market data"},
            "signature": "sha256:jkl012mno345..."
        },
        {
            "sender": "user_interface",
            "recipient": "coordinator", 
            "timestamp": datetime.utcnow().isoformat(),
            "task_id": "e5f6g7h8-i9j0-1234-efgh-567890123456",
            "instruction": "Design thinking workshop facilitation for mobile app innovation",
            "parameters": {"temperature": 0.8, "max_tokens": 3500},
            "context": {"personality": "Steve_Jobs", "domain": "mobile_innovation"},
            "result": {"status": "pending"},
            "signature": "sha256:mno345pqr678..."
        }
    ]
    
    _envelope_logs.extend(sample_envelopes)

@logs_bp.route('/logs', methods=['GET'])
def get_logs():
    """
    Get MCP envelope logs with optional filtering and pagination.
    
    Query Parameters:
        limit: Maximum number of logs to return (default: 100, max: 500)
        offset: Number of logs to skip (default: 0)
        sender: Filter by sender agent
        status: Filter by result status
        since: ISO timestamp to filter logs after this time
    
    Returns:
        JSON response with array of MCP envelope logs
    """
    try:
        # Ensure we have sample data
        _generate_sample_logs()
        
        # Parse query parameters
        limit = min(int(request.args.get('limit', 100)), 500)
        offset = int(request.args.get('offset', 0))
        sender_filter = request.args.get('sender')
        status_filter = request.args.get('status')
        since_filter = request.args.get('since')
        
        # Start with all logs, most recent first
        filtered_logs = sorted(_envelope_logs, key=lambda x: x['timestamp'], reverse=True)
        
        # Apply filters
        if sender_filter:
            filtered_logs = [log for log in filtered_logs if log.get('sender') == sender_filter]
        
        if status_filter:
            filtered_logs = [log for log in filtered_logs if log.get('result', {}).get('status') == status_filter]
        
        if since_filter:
            try:
                since_dt = datetime.fromisoformat(since_filter.replace('Z', '+00:00'))
                filtered_logs = [log for log in filtered_logs 
                               if datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')) > since_dt]
            except ValueError:
                pass  # Invalid timestamp format, ignore filter
        
        # Apply pagination
        paginated_logs = filtered_logs[offset:offset + limit]
        
        # Add metadata
        response_data = {
            "logs": paginated_logs,
            "metadata": {
                "total_logs": len(filtered_logs),
                "returned_count": len(paginated_logs),
                "offset": offset,
                "limit": limit,
                "has_more": len(filtered_logs) > offset + limit,
                "filters_applied": {
                    "sender": sender_filter,
                    "status": status_filter,
                    "since": since_filter
                }
            }
        }
        
        return jsonify(response_data)
        
    except ValueError as e:
        return jsonify({
            "error": "Invalid query parameters",
            "message": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "error": "Failed to retrieve logs",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

@logs_bp.route('/logs/stats', methods=['GET'])
def get_log_stats():
    """
    Get statistics about MCP envelope logs.
    
    Returns:
        JSON response with log statistics and metrics
    """
    try:
        _generate_sample_logs()
        
        total_logs = len(_envelope_logs)
        
        # Count by sender
        sender_counts = {}
        status_counts = {}
        hourly_counts = {}
        
        for log in _envelope_logs:
            # Sender stats
            sender = log.get('sender', 'unknown')
            sender_counts[sender] = sender_counts.get(sender, 0) + 1
            
            # Status stats
            status = log.get('result', {}).get('status', 'pending')
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Hourly stats
            try:
                timestamp = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                hour_key = timestamp.strftime('%Y-%m-%d %H:00')
                hourly_counts[hour_key] = hourly_counts.get(hour_key, 0) + 1
            except:
                pass
        
        # Recent activity (last hour)
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_logs = [
            log for log in _envelope_logs 
            if datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')) > one_hour_ago
        ]
        
        stats = {
            "total_logs": total_logs,
            "recent_activity": {
                "last_hour_count": len(recent_logs),
                "last_log_time": max([log['timestamp'] for log in _envelope_logs]) if _envelope_logs else None
            },
            "sender_distribution": sender_counts,
            "status_distribution": status_counts,
            "hourly_activity": dict(sorted(hourly_counts.items())[-24:]),  # Last 24 hours
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({
            "error": "Failed to generate log statistics",
            "message": str(e)
        }), 500

# Function to be called when envelopes are processed
def log_envelope(envelope: Dict[str, Any]) -> None:
    """Log an MCP envelope for tracking purposes."""
    add_envelope_log(envelope)