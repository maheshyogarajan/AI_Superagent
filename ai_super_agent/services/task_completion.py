"""Task completion service for updating task status and results."""

import logging
from typing import Dict, Any, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class TaskCompletionService:
    """Service for completing tasks and updating their status in the database."""
    
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        if self.database_url:
            self.engine = create_engine(self.database_url)
            self.SessionLocal = sessionmaker(bind=self.engine)
        else:
            logger.warning("No DATABASE_URL found, task completion will not persist")
            self.engine = None
            self.SessionLocal = None
    
    def complete_task(self, task_id: str, result: Dict[str, Any], status: str = "completed") -> bool:
        """
        Complete a task by updating its status and storing results.
        
        Args:
            task_id: The task UUID to complete
            result: Task execution results
            status: Final task status (default: "completed")
            
        Returns:
            True if successful, False otherwise
        """
        if not self.engine or not self.SessionLocal:
            logger.warning("No database connection, cannot complete task")
            return False
            
        try:
            with self.SessionLocal() as session:
                # Update task status and result
                update_query = text("""
                    UPDATE tasks 
                    SET status = :status, 
                        result = :result,
                        updated_at = NOW()
                    WHERE id = :task_id
                """)
                
                session.execute(update_query, {
                    'status': status,
                    'result': json.dumps(result),
                    'task_id': task_id
                })
                session.commit()
                
                logger.info(f"Task {task_id} completed with status: {status}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to complete task {task_id}: {e}")
            return False
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get task status and result.
        
        Args:
            task_id: The task UUID
            
        Returns:
            Task status information or None
        """
        if not self.engine or not self.SessionLocal:
            return None
            
        try:
            with self.SessionLocal() as session:
                query = text("""
                    SELECT id, status, result, agent_id, instruction, 
                           created_at, updated_at
                    FROM tasks 
                    WHERE id = :task_id
                """)
                
                result = session.execute(query, {'task_id': task_id}).fetchone()
                
                if result:
                    return {
                        'id': str(result.id),
                        'status': result.status,
                        'result': json.loads(result.result) if result.result else None,
                        'agent_id': result.agent_id,
                        'instruction': result.instruction,
                        'created_at': result.created_at.isoformat() if result.created_at else None,
                        'updated_at': result.updated_at.isoformat() if result.updated_at else None
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get task status {task_id}: {e}")
            
        return None
    
    def get_completed_tasks(self, limit: int = 50) -> list[Dict[str, Any]]:
        """
        Get list of completed tasks for strategy viewer.
        
        Args:
            limit: Maximum number of tasks to return
            
        Returns:
            List of completed task information
        """
        if not self.engine or not self.SessionLocal:
            return []
            
        try:
            with self.SessionLocal() as session:
                query = text("""
                    SELECT t.id, t.instruction, t.result, t.agent_id, 
                           t.created_at, t.updated_at
                    FROM tasks t
                    WHERE t.status = 'completed'
                    ORDER BY t.updated_at DESC
                    LIMIT :limit
                """)
                
                results = session.execute(query, {'limit': limit}).fetchall()
                
                completed_tasks = []
                for result in results:
                    task_result = json.loads(result.result) if result.result else {}
                    
                    completed_tasks.append({
                        'id': str(result.id),
                        'instruction': result.instruction,
                        'content': task_result.get('summary', task_result.get('message', 'Task completed successfully')),
                        'author': result.agent_id,
                        'created_at': result.created_at.isoformat() if result.created_at else None,
                        'updated_at': result.updated_at.isoformat() if result.updated_at else None
                    })
                
                return completed_tasks
                
        except Exception as e:
            logger.error(f"Failed to get completed tasks: {e}")
            return []

# Global instance
task_completion_service = TaskCompletionService()