"""Base agent class for AI Super Agent system."""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from ai_super_agent.models.mcp import MCPEnvelope
from ai_super_agent.queue.broker import dequeue, enqueue

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all agents in the system.
    Provides common functionality for message handling and queue operations.
    """
    
    def __init__(self, agent_id: str, queue_timeout: int = 1):
        """
        Initialize the base agent.
        
        Args:
            agent_id: Unique identifier for this agent
            queue_timeout: Timeout in seconds for queue operations
        """
        self.agent_id = agent_id
        self.queue_timeout = queue_timeout
        self.running = False
        self._stop_event = asyncio.Event()
        
        logger.info(f"Initialized {self.__class__.__name__} with ID: {agent_id}")
    
    async def listen(self) -> None:
        """
        Main listening loop for the agent.
        Continuously dequeues messages and handles them.
        """
        self.running = True
        logger.info(f"Agent {self.agent_id} started listening for messages")
        
        try:
            while self.running and not self._stop_event.is_set():
                try:
                    # Wait for either a message or stop event
                    message_task = asyncio.create_task(
                        dequeue(self.agent_id, self.queue_timeout)
                    )
                    stop_task = asyncio.create_task(self._stop_event.wait())
                    
                    done, pending = await asyncio.wait(
                        [message_task, stop_task],
                        return_when=asyncio.FIRST_COMPLETED
                    )
                    
                    # Cancel pending tasks
                    for task in pending:
                        task.cancel()
                        try:
                            await task
                        except asyncio.CancelledError:
                            pass
                    
                    # Check if we should stop
                    if self._stop_event.is_set():
                        break
                    
                    # Process message if available
                    envelope = message_task.result()
                    if envelope:
                        await self._handle_message(envelope)
                    
                except asyncio.CancelledError:
                    logger.info(f"Agent {self.agent_id} listening cancelled")
                    break
                except Exception as e:
                    logger.error(f"Error in agent {self.agent_id} listen loop: {e}")
                    await asyncio.sleep(1)  # Brief pause before retrying
                    
        finally:
            self.running = False
            logger.info(f"Agent {self.agent_id} stopped listening")
    
    async def _handle_message(self, envelope: MCPEnvelope) -> None:
        """
        Internal message handler that wraps the abstract handle method.
        
        Args:
            envelope: The received MCP envelope
        """
        try:
            logger.debug(f"Agent {self.agent_id} handling message {envelope.id}")
            result = await self.handle(envelope)
            
            # If there's a correlation_id, this might be a response
            if envelope.correlation_id and envelope.sender:
                # Send response back to sender
                response_envelope = MCPEnvelope(
                    method="response",
                    params={"result": result, "original_message_id": envelope.id},
                    sender=self.agent_id,
                    recipient=envelope.sender,
                    correlation_id=envelope.correlation_id
                )
                await self.send_message(response_envelope)
                
        except Exception as e:
            logger.error(f"Error handling message {envelope.id} in agent {self.agent_id}: {e}")
            
            # Send error response if possible
            if envelope.correlation_id and envelope.sender:
                error_envelope = MCPEnvelope(
                    method="error",
                    params={"error": str(e), "original_message_id": envelope.id},
                    sender=self.agent_id,
                    recipient=envelope.sender,
                    correlation_id=envelope.correlation_id
                )
                await self.send_message(error_envelope)
    
    @abstractmethod
    async def handle(self, envelope: MCPEnvelope) -> Dict[str, Any]:
        """
        Handle an incoming message envelope.
        Must be implemented by subclasses.
        
        Args:
            envelope: The received MCP envelope
            
        Returns:
            Result dictionary to be sent as response
        """
        pass
    
    async def send_message(self, envelope: MCPEnvelope) -> bool:
        """
        Send a message to another agent.
        
        Args:
            envelope: The MCP envelope to send
            
        Returns:
            True if successful, False otherwise
        """
        envelope.sender = self.agent_id
        return await enqueue(envelope.recipient, envelope)
    
    async def stop(self) -> None:
        """Stop the agent's listening loop."""
        logger.info(f"Stopping agent {self.agent_id}")
        self.running = False
        self._stop_event.set()
    
    def is_running(self) -> bool:
        """Check if the agent is currently running."""
        return self.running
