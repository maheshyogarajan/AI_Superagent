"""Plans blueprint for synchronous plan approval and task enqueuing."""
from flask import Blueprint, request, jsonify
from ai_super_agent.repos import PlanRepo, TaskFactory

plans_bp = Blueprint('plans', __name__, url_prefix='/plans')

@plans_bp.route('/<uuid:pid>/approve', methods=['POST'])
def approve_plan(pid):
    """
    Approve a plan and enqueue its tasks for execution.
    
    Args:
        pid: Plan UUID to approve
        
    Returns:
        JSON response with task_ids and 202 status
    """
    outline = PlanRepo.get_outline(pid)         # sync ORM
    task_ids = TaskFactory.enqueue(pid, outline)  # sync enqueue
    PlanRepo.mark_running(pid)                  # status → 'running'
    return jsonify({"task_ids": task_ids}), 202