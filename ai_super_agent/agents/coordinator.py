"""Coordinator agent for managing and routing tasks."""

import logging
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any, List, Optional
from ai_super_agent.agents.base import BaseAgent
from ai_super_agent.models.mcp import MCPEnvelope
from ai_super_agent.config import settings
from ai_super_agent.services.plan_inspector import PlanInspector
from ai_super_agent.repos.plan_repository import PlanRepository, PlanStep
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TaskNode:
    """Enhanced PlanStep with additional methods for task DAG."""
    step_id: str
    agent_id: str
    instruction: str
    dependencies: List[str]
    estimated_duration: Optional[int] = None
    parameters: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "step_id": self.step_id,
            "agent_id": self.agent_id,
            "instruction": self.instruction,
            "dependencies": self.dependencies,
            "estimated_duration": self.estimated_duration,
            "parameters": self.parameters
        }
    
    def to_task_record(self) -> Dict[str, Any]:
        """Convert to task record format."""
        return {
            "task_id": self.step_id,
            "agent_id": self.agent_id,
            "instruction": self.instruction,
            "status": "pending",
            "dependencies": self.dependencies,
            "parameters": self.parameters or {}
        }


def build_task_dag(user_instruction: str) -> List[TaskNode]:
    """
    Build task DAG (Directed Acyclic Graph) from user instruction.
    
    Args:
        user_instruction: The user's task instruction
        
    Returns:
        List of TaskNode objects representing the task execution plan
    """
    # Use existing plan inspector to create execution plan
    plan_inspector = PlanInspector()
    execution_plan = plan_inspector.create_execution_plan(user_instruction)
    
    # Convert ExecutionPlan steps to TaskNode objects
    plan_nodes = []
    for step in execution_plan.steps:
        task_node = TaskNode(
            step_id=step.step_id,
            agent_id=step.agent_id,
            instruction=step.instruction,
            dependencies=step.dependencies,
            estimated_duration=step.estimated_duration,
            parameters=step.parameters
        )
        plan_nodes.append(task_node)
    
    return plan_nodes


class CoordinatorAgent(BaseAgent):
    """
    Coordinator agent responsible for task routing and management.
    Acts as the central hub for coordinating work between specialized agents.
    """
    
    def __init__(self):
        super().__init__(
            agent_id="coordinator",
            queue_timeout=settings.coordinator_queue_timeout
        )
    
    async def create_plan(self, user_instruction: str) -> Dict[str, Any]:
        """
        Create execution plan from user instruction.
        
        Args:
            user_instruction: The user's task instruction
            
        Returns:
            Dictionary containing plan outline and first task record
        """
        plan_nodes = build_task_dag(user_instruction)  # existing helper
        return {
            "plan_outline": [n.to_dict() for n in plan_nodes],
            "first_task": plan_nodes[0].to_task_record() if plan_nodes else None
        }
    
    async def handle(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """
        Handle incoming messages for the coordinator.
        
        Args:
            envelope: The received MCP envelope
            
        Returns:
            Result dictionary with coordination outcome
        """
        method = envelope.method
        params = envelope.params
        instruction = envelope.instruction
        
        logger.info(f"Coordinator handling method: {method}")
        
        if method == "task":
            return await self._handle_task(envelope)
        elif method == "status":
            return await self._handle_status_request(envelope)
        elif method == "response":
            return await self._handle_agent_response(envelope)
        elif method == "error":
            return await self._handle_agent_error(envelope)
        else:
            logger.warning(f"Unknown method: {method}")
            return {
                "status": "error",
                "message": f"Unknown method: {method}",
                "agent_id": self.agent_id
            }
    
    async def _handle_task(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """
        Handle a new task request by routing it to appropriate agents.
        
        Args:
            envelope: Task envelope
            
        Returns:
            Task coordination result
        """
        instruction = envelope.instruction or ""
        context = envelope.context or {}
        
        logger.info(f"Coordinating task: {instruction[:100]}...")
        
        # Create workings file for task documentation
        task_id = envelope.task_id
        workings_dir = "data/workings"
        os.makedirs(workings_dir, exist_ok=True)
        
        workings_file = f"{workings_dir}/{task_id}.md"
        initial_content = f"""# Task Workings - {task_id}

**Started:** {datetime.now().isoformat()}
**Instruction:** {instruction}

## Coordinator Analysis
Task received and being processed by the coordination system.

--- STEP BREAK ---

## Agent Routing
Analyzing instruction to determine optimal agent assignment...
"""
        
        try:
            with open(workings_file, 'w') as f:
                f.write(initial_content)
            logger.info(f"Created workings file: {workings_file}")
        except Exception as e:
            logger.error(f"Failed to create workings file: {e}")
        
        # Simple routing logic - for now, route research tasks to research agent
        if any(keyword in instruction.lower() for keyword in ["research", "find", "search", "analyze"]):
            target_agent = "research"
        else:
            target_agent = "research"  # Default to research for now
        
        # Create task envelope for the target agent
        task_envelope = MCPEnvelope(
            method="execute_task",
            params={
                "instruction": instruction,
                "context": context,
                "original_sender": envelope.sender
            },
            sender=self.agent_id,
            recipient=target_agent,
            instruction=instruction,
            context=context,
            correlation_id=envelope.id  # Use original message ID for tracking
        )
        
        # Send task to target agent
        success = await self.send_message(task_envelope)
        
        # Update workings file with routing decision
        try:
            routing_update = f"""
Target agent selected: **{target_agent}**
Routing reasoning: Task contains keywords that match {target_agent} agent capabilities.

--- STEP BREAK ---

## Task Execution
Task has been dispatched to the {target_agent} agent for processing...
"""
            with open(workings_file, 'a') as f:
                f.write(routing_update)
            logger.info(f"Updated workings file with routing information")
        except Exception as e:
            logger.error(f"Failed to update workings file: {e}")
        
        if success:
            logger.info(f"Task routed to {target_agent} agent")
            return {
                "status": "routed",
                "message": f"Task routed to {target_agent} agent",
                "target_agent": target_agent,
                "task_id": task_envelope.id,
                "agent_id": self.agent_id,
                "workings_file": workings_file
            }
        else:
            logger.error(f"Failed to route task to {target_agent} agent")
            return {
                "status": "error",
                "message": f"Failed to route task to {target_agent} agent",
                "agent_id": self.agent_id
            }
    
    async def _handle_status_request(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """Handle status request."""
        return {
            "status": "active",
            "message": "Coordinator agent is running",
            "agent_id": self.agent_id,
            "queue_timeout": self.queue_timeout
        }
    
    async def _handle_agent_response(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """
        Handle response from another agent.
        
        Args:
            envelope: Response envelope
            
        Returns:
            Response handling result
        """
        result = envelope.params.get("result", {})
        original_message_id = envelope.params.get("original_message_id")
        
        logger.info(f"Received response from {envelope.sender} for message {original_message_id}")
        
        # For now, just log the response
        # In a full implementation, this would route responses back to original requesters
        return {
            "status": "response_received",
            "message": f"Response received from {envelope.sender}",
            "result": result,
            "agent_id": self.agent_id
        }
    
    async def _handle_agent_error(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """
        Handle error from another agent.
        
        Args:
            envelope: Error envelope
            
        Returns:
            Error handling result
        """
        error = envelope.params.get("error", "Unknown error")
        original_message_id = envelope.params.get("original_message_id")
        
        logger.error(f"Received error from {envelope.sender} for message {original_message_id}: {error}")
        
        return {
            "status": "error_received",
            "message": f"Error received from {envelope.sender}",
            "error": error,
            "agent_id": self.agent_id
        }
