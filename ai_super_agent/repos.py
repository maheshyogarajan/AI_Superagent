"""Repository classes for AI Super Agent."""
import os
import json
import uuid
from typing import List, Dict, Any
from sqlalchemy import create_engine, text
from .catalog import decompose_instruction, get_best_agent


class PlanRepo:
    """Repository for plan persistence operations."""
    
    @staticmethod
    def insert(instruction: str, nodes: List[Dict[str, Any]]) -> str:
        """
        Insert a new plan with draft status.
        
        Args:
            instruction: The original instruction
            nodes: List of plan nodes with assigned agents
            
        Returns:
            Generated plan_id
        """
        plan_id = str(uuid.uuid4())
        
        # Get database connection
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO plans (id, instruction, outline, status) VALUES (:id, :instruction, :outline::jsonb, :status)"),
                {
                    "id": plan_id,
                    "instruction": instruction,
                    "outline": json.dumps(nodes),
                    "status": "draft"
                }
            )
            conn.commit()
        
        return plan_id
    
    @staticmethod
    def get_outline(plan_id: str) -> List[Dict[str, Any]]:
        """
        Get plan outline by plan_id.
        
        Args:
            plan_id: The plan UUID
            
        Returns:
            List of plan nodes/steps
        """
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT outline FROM plans WHERE id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchone()
            
            if not result:
                raise ValueError(f"Plan {plan_id} not found")
            
            return result[0]  # outline is already JSON parsed
    
    @staticmethod
    def mark_running(plan_id: str) -> None:
        """
        Mark plan status as running.
        
        Args:
            plan_id: The plan UUID to update
        """
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            conn.execute(
                text("UPDATE plans SET status = 'running' WHERE id = :plan_id"),
                {"plan_id": plan_id}
            )
            conn.commit()


class AgentCatalog:
    """Catalog for agent selection and capability matching."""
    
    @staticmethod
    def pick(task_type: str) -> str:
        """
        Pick the best agent for a given task type.
        
        Args:
            task_type: Type of task to be performed
            
        Returns:
            Agent ID of the best matching agent
        """
        agent = get_best_agent(task_type)
        return agent.agent_id


class TaskFactory:
    """Factory for creating and enqueuing tasks synchronously."""
    
    @staticmethod
    def enqueue(plan_id: str, outline: List[Dict[str, Any]]) -> List[str]:
        """
        Enqueue tasks for a plan outline synchronously.
        
        Args:
            plan_id: The plan UUID
            outline: List of plan steps/nodes
            
        Returns:
            List of created task IDs
        """
        from .message_queue.memory_broker import memory_broker
        from .protocol import MCPEnvelope
        
        task_ids = []
        
        for step in outline:
            task_id = str(uuid.uuid4())
            task_ids.append(task_id)
            
            # Create MCP envelope for the task
            envelope = MCPEnvelope(
                id=task_id,
                plan_id=plan_id,
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
            
            # Enqueue synchronously using memory broker
            memory_broker.enqueue(envelope.recipient, envelope)
        
        return task_ids