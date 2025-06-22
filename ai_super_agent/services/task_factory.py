"""Task factory for creating and enqueuing tasks from plan outlines."""

import uuid
from typing import List, Dict, Any
from ai_super_agent.message_queue.broker import enqueue
from ai_super_agent.models.mcp import MCPEnvelope
import logging

logger = logging.getLogger(__name__)


class TaskFactory:
    """Factory for creating and enqueuing tasks from plan outlines."""
    
    @staticmethod
    async def enqueue_from_outline(plan_id: str, outline: List[Dict[str, Any]]) -> List[str]:
        """
        Create and enqueue tasks from a plan outline.
        
        Args:
            plan_id: The plan identifier
            outline: List of plan steps
            
        Returns:
            List of task IDs that were created and enqueued
        """
        task_ids = []
        for step in outline:
            # Generate unique task ID
            task_id = str(uuid.uuid4())
            task_ids.append(task_id)
            
            # Create MCP envelope for task
            envelope = MCPEnvelope(
                id=str(uuid.uuid4()),
                instruction=step.get('instruction', ''),
                recipient=step.get('agent_id', 'coordinator'),
                sender="task_factory",
                context={
                    "task_id": task_id,
                    "plan_id": plan_id,
                    "step_id": step.get('step_id'),
                    "parameters": step.get('parameters', {}),
                    "dependencies": step.get('dependencies', [])
                }
            )
            
            # Enqueue the task using the broker function
            try:
                success = await enqueue(envelope.recipient, envelope)
                if success:
                    logger.info(f"Enqueued task {task_id} to agent {envelope.recipient}")
                else:
                    logger.error(f"Failed to enqueue task {task_id}")
                    
            except Exception as e:
                logger.error(f"Error enqueuing task {task_id}: {e}")
        
        return task_ids