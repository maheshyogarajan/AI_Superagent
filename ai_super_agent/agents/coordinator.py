"""Coordinator agent for managing and routing tasks."""

import logging
from typing import Dict, Any
from ai_super_agent.agents.base import BaseAgent
from ai_super_agent.models.mcp import MCPEnvelope
from ai_super_agent.config import settings

logger = logging.getLogger(__name__)


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
        
        if success:
            logger.info(f"Task routed to {target_agent} agent")
            return {
                "status": "routed",
                "message": f"Task routed to {target_agent} agent",
                "target_agent": target_agent,
                "task_id": task_envelope.id,
                "agent_id": self.agent_id
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
