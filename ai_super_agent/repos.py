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