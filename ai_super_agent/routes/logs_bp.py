"""Logs blueprint for plan-scoped SSE streaming."""
from flask import Blueprint, Response, request
import os
import time
import json
from sqlalchemy import create_engine, text

logs_bp = Blueprint('logs', __name__, url_prefix='/logs')

@logs_bp.route('/stream')
def stream_logs():
    """
    Stream logs for a specific plan via Server-Sent Events.
    
    Query parameters:
        plan_id: UUID of the plan to stream logs for
        
    Returns:
        SSE stream of log events for the plan
    """
    plan_id = request.args['plan_id']

    def event_stream():
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            yield f"data: {json.dumps({'error': 'Database not configured'})}\n\n"
            return
        
        engine = create_engine(database_url)
        last_timestamp = time.time()
        
        while True:
            try:
                with engine.connect() as conn:
                    # Get recent task updates for this plan
                    result = conn.execute(
                        text("""
                            SELECT t.id, t.step_id, t.agent_id, t.instruction, t.status, 
                                   t.updated_at, e.context, e.created_at as event_time
                            FROM tasks t 
                            LEFT JOIN mcp_envelopes e ON e.plan_id = t.plan_id 
                            WHERE t.plan_id = :plan_id 
                            AND (t.updated_at > :last_timestamp OR e.created_at > :last_timestamp)
                            ORDER BY COALESCE(e.created_at, t.updated_at) DESC 
                            LIMIT 10
                        """),
                        {
                            "plan_id": plan_id,
                            "last_timestamp": time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(last_timestamp))
                        }
                    ).fetchall()
                    
                    for row in result:
                        event_data = {
                            "type": "task_update",
                            "plan_id": plan_id,
                            "task_id": row[0],
                            "step_id": row[1],
                            "agent_id": row[2],
                            "instruction": row[3],
                            "status": row[4],
                            "timestamp": row[5].isoformat() if row[5] else None,
                            "context": row[6] if row[6] else {},
                            "event_time": row[7].isoformat() if row[7] else None
                        }
                        
                        yield f"data: {json.dumps(event_data)}\n\n"
                    
                    last_timestamp = time.time()
                    
            except Exception as e:
                error_data = {
                    "type": "error",
                    "message": str(e),
                    "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
                }
                yield f"data: {json.dumps(error_data)}\n\n"
            
            # Send heartbeat every 30 seconds
            heartbeat = {
                "type": "heartbeat",
                "plan_id": plan_id,
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
            }
            yield f"data: {json.dumps(heartbeat)}\n\n"
            
            time.sleep(5)  # Poll every 5 seconds
            
    return Response(event_stream(), mimetype='text/event-stream')