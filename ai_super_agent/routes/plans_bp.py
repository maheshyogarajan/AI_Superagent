"""Plans blueprint for synchronous plan approval and task enqueuing."""
from flask import Blueprint, request, jsonify

plans_bp = Blueprint('plans_sync', __name__, url_prefix='/plans')

@plans_bp.route('/<uuid:pid>/approve', methods=['POST'])
def approve_plan(pid):
    """
    Approve a plan and enqueue its tasks for execution.
    
    Args:
        pid: Plan UUID to approve
        
    Returns:
        JSON response with task_ids and 202 status
    """
    import os
    import uuid
    import json
    from sqlalchemy import create_engine, text
    
    # Get plan outline
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return jsonify({"error": "Database not configured"}), 500
    
    engine = create_engine(database_url)
    with engine.connect() as conn:
        # Get outline
        result = conn.execute(
            text("SELECT outline FROM plans WHERE id = :plan_id"),
            {"plan_id": str(pid)}
        ).fetchone()
        
        if not result:
            return jsonify({"error": "Plan not found"}), 404
        
        outline = result[0]
        
        # Create task IDs for enqueuing
        task_ids = []
        for step in outline:
            task_id = str(uuid.uuid4())
            task_ids.append(task_id)
            
            # Simple synchronous enqueuing via memory broker
            try:
                from ai_super_agent.message_queue.memory_broker import enqueue
                from ai_super_agent.models.mcp import MCPEnvelope
                import asyncio
                
                envelope = MCPEnvelope(
                    id=task_id,
                    plan_id=str(pid),
                    sender="task_factory",
                    recipient=step.get("agent_id", step.get("agent", "coordinator")),
                    method="execute_task",
                    instruction=step.get("instruction", ""),
                    context={
                        "step_id": step.get("step_id"),
                        "parameters": step.get("parameters", {}),
                        "dependencies": step.get("dependencies", [])
                    }
                )
                
                # Run async enqueue in sync context
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(enqueue(envelope.recipient, envelope))
            except Exception as e:
                print(f"Warning: Could not enqueue task {task_id}: {e}")
        
        # Mark plan as running
        conn.execute(
            text("UPDATE plans SET status = 'running' WHERE id = :plan_id"),
            {"plan_id": str(pid)}
        )
        conn.commit()
    
    return jsonify({"task_ids": task_ids}), 202