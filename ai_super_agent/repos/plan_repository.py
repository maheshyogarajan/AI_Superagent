"""Plan repository for storing and retrieving execution plans."""
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, asdict


@dataclass
class PlanStep:
    """Individual step in execution plan."""
    step_id: str
    agent_id: str
    instruction: str
    dependencies: List[str]
    estimated_duration: Optional[int] = None
    parameters: Optional[Dict[str, Any]] = None


@dataclass
class ExecutionPlan:
    """Complete execution plan for a task."""
    plan_id: str
    task_id: str
    original_instruction: str
    steps: List[PlanStep]
    total_estimated_duration: Optional[int] = None
    created_at: str = None
    status: str = "draft"  # draft, approved, executing, completed
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow().isoformat()


class PlanRepository:
    """Repository for managing execution plans."""
    
    def __init__(self, storage_dir: str = "data/plans"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
    
    def save_plan(self, plan: ExecutionPlan) -> bool:
        """Save execution plan to storage."""
        try:
            file_path = os.path.join(self.storage_dir, f"{plan.plan_id}.json")
            with open(file_path, 'w') as f:
                json.dump(asdict(plan), f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving plan: {e}")
            return False
    
    def load_plan(self, plan_id: str) -> Optional[ExecutionPlan]:
        """Load execution plan from storage."""
        try:
            file_path = os.path.join(self.storage_dir, f"{plan_id}.json")
            if not os.path.exists(file_path):
                return None
            
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Convert steps back to PlanStep objects
            steps = [PlanStep(**step) for step in data['steps']]
            data['steps'] = steps
            
            return ExecutionPlan(**data)
        except Exception as e:
            print(f"Error loading plan: {e}")
            return None
    
    def list_plans(self, status: Optional[str] = None) -> List[ExecutionPlan]:
        """List all plans, optionally filtered by status."""
        plans = []
        try:
            for filename in os.listdir(self.storage_dir):
                if filename.endswith('.json'):
                    plan_id = filename[:-5]  # Remove .json extension
                    plan = self.load_plan(plan_id)
                    if plan and (status is None or plan.status == status):
                        plans.append(plan)
        except Exception as e:
            print(f"Error listing plans: {e}")
        
        return sorted(plans, key=lambda p: p.created_at, reverse=True)
    
    def update_plan_status(self, plan_id: str, status: str) -> bool:
        """Update plan status."""
        plan = self.load_plan(plan_id)
        if plan:
            plan.status = status
            return self.save_plan(plan)
        return False
    
    def delete_plan(self, plan_id: str) -> bool:
        """Delete execution plan."""
        try:
            file_path = os.path.join(self.storage_dir, f"{plan_id}.json")
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting plan: {e}")
            return False