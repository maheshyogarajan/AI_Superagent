"""Plan repository for database operations."""
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
import os
import uuid
from typing import List, Dict, Any, Optional
# Temporary removal of Plan model import to fix startup issue
# from ai_super_agent.models import Plan


class PlanRepo:
    """Repository for plan persistence operations."""
    
    @staticmethod
    def insert(session: Session, instruction: str, outline: List[Dict[str, Any]]) -> str:
        """
        Insert a new plan with draft status.
        
        Args:
            session: Database session
            instruction: The original instruction
            outline: List of plan nodes with assigned agents
            
        Returns:
            Generated plan_id
        """
        plan_id = str(uuid.uuid4())
        
        # Use direct SQL to avoid Plan model import issues
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL not found")
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO plans (id, instruction, outline, status, created_at, updated_at) VALUES (:id, :instruction, :outline, 'draft', NOW(), NOW())"),
                {"id": plan_id, "instruction": instruction, "outline": outline}
            )
            conn.commit()
        
        return plan_id

    @staticmethod
    def mark_running(session: Session, plan_id: str) -> None:
        """
        Mark plan status as running.
        
        Args:
            session: Database session
            plan_id: The plan UUID to update
        """
        # Use direct SQL to avoid Plan model import issues
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL not found")
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            conn.execute(
                text("UPDATE plans SET status = 'running', updated_at = NOW() WHERE id = :plan_id"),
                {"plan_id": plan_id}
            )
            conn.commit()

    @staticmethod
    def get_outline(plan_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get plan outline by plan_id using direct database connection.
        
        Args:
            plan_id: The plan UUID
            
        Returns:
            List of plan nodes/steps or None if not found
        """
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return None
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT outline FROM plans WHERE id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchone()
            
            return result[0] if result else None

    @staticmethod
    def get_plan(plan_id: str) -> Optional[Dict[str, Any]]:
        """
        Get complete plan by plan_id.
        
        Args:
            plan_id: The plan UUID
            
        Returns:
            Plan dictionary or None if not found
        """
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return None
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id, instruction, outline, status, created_at, updated_at FROM plans WHERE id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchone()
            
            if result:
                return {
                    "id": result[0],
                    "instruction": result[1],
                    "outline": result[2],
                    "status": result[3],
                    "created_at": result[4].isoformat() if result[4] else None,
                    "updated_at": result[5].isoformat() if result[5] else None
                }
            return None

    @staticmethod
    def update_status(plan_id: str, status: str) -> bool:
        """
        Update plan status.
        
        Args:
            plan_id: The plan UUID
            status: New status value
            
        Returns:
            True if successful, False otherwise
        """
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return False
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(
                text("UPDATE plans SET status = :status, updated_at = NOW() WHERE id = :plan_id"),
                {"plan_id": plan_id, "status": status}
            )
            conn.commit()
            return result.rowcount > 0