"""Task factory for creating and enqueuing tasks from plan outlines."""
import uuid
import asyncio
from typing import List, Dict, Any
from ai_super_agent.models.mcp import MCPEnvelope
from ai_super_agent.message_queue.memory_broker import enqueue


class TaskFactory:
    """Factory for creating and enqueuing tasks from plan outlines."""
    
    @staticmethod
    async def enqueue_from_outline(plan_id: str, outline: List[Dict[str, Any]]) -> List[str]:
        """
        Create and enqueue tasks from a plan outline.
        
        Args:
            plan_id: The plan UUID
            outline: List of plan steps/nodes
            
        Returns:
            List of created task IDs
        """
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
                    "dependencies": step.get("dependencies", []),
                    "estimated_duration": step.get("estimated_duration", 30)
                }
            )
            
            # Enqueue the task
            await enqueue(envelope.recipient, envelope)
            
        return task_ids
    
    @staticmethod
    def create_task_envelope(plan_id: str, step: Dict[str, Any]) -> MCPEnvelope:
        """
        Create an MCP envelope for a single task step.
        
        Args:
            plan_id: The plan UUID
            step: Single step dictionary
            
        Returns:
            MCPEnvelope for the task
        """
        task_id = str(uuid.uuid4())
        
        return MCPEnvelope(
            id=task_id,
            plan_id=plan_id,
            sender="task_factory",
            recipient=step.get("agent_id", step.get("agent", "coordinator")),
            method="execute_task",
            instruction=step.get("instruction", ""),
            context={
                "step_id": step.get("step_id"),
                "parameters": step.get("parameters", {}),
                "dependencies": step.get("dependencies", []),
                "estimated_duration": step.get("estimated_duration", 30)
            }
        )