"""Plan repository for storing and retrieving execution plans using SQLAlchemy."""

from sqlalchemy import insert, select, update, delete
from ai_super_agent.db import async_session, plans_table
from typing import List, Dict, Any, Optional


class PlanRepo:
    """Repository for managing execution plans in the database."""
    
    @staticmethod
    async def insert(task_id: str, outline: List[Dict[str, Any]]) -> None:
        """
        Insert a new plan into the database.
        
        Args:
            task_id: Unique identifier for the task/plan
            outline: List of plan steps as dictionaries
        """
        async with async_session() as s:
            await s.execute(insert(plans_table).values(id=task_id, outline=outline))
            await s.commit()

    @staticmethod
    async def get(plan_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a plan by its ID.
        
        Args:
            plan_id: Unique identifier for the plan
            
        Returns:
            Plan record as dictionary or None if not found
        """
        async with async_session() as s:
            result = await s.execute(select(plans_table).where(plans_table.c.id == plan_id))
            row = result.first()
            if row:
                return {
                    "id": row.id,
                    "outline": row.outline,
                    "created_at": row.created_at,
                    "updated_at": row.updated_at
                }
            return None

    @staticmethod
    async def update(plan_id: str, outline: List[Dict[str, Any]]) -> bool:
        """
        Update an existing plan's outline.
        
        Args:
            plan_id: Unique identifier for the plan
            outline: Updated list of plan steps
            
        Returns:
            True if plan was updated, False if not found
        """
        async with async_session() as s:
            result = await s.execute(
                plans_table.update()
                .where(plans_table.c.id == plan_id)
                .values(outline=outline)
            )
            await s.commit()
            return result.rowcount > 0

    @staticmethod
    async def delete(plan_id: str) -> bool:
        """
        Delete a plan by its ID.
        
        Args:
            plan_id: Unique identifier for the plan
            
        Returns:
            True if plan was deleted, False if not found
        """
        async with async_session() as s:
            result = await s.execute(
                plans_table.delete().where(plans_table.c.id == plan_id)
            )
            await s.commit()
            return result.rowcount > 0

    @staticmethod
    async def list_all() -> List[Dict[str, Any]]:
        """
        Retrieve all plans from the database.
        
        Returns:
            List of all plan records as dictionaries
        """
        async with async_session() as s:
            result = await s.execute(select(plans_table))
            rows = result.fetchall()
            return [
                {
                    "id": row.id,
                    "outline": row.outline,
                    "created_at": row.created_at,
                    "updated_at": row.updated_at
                }
                for row in rows
            ]