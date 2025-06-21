"""In-memory message broker for agent communication (fallback when Redis unavailable)."""

import json
import logging
import asyncio
from typing import Optional, Any, Dict
from collections import defaultdict, deque
from ai_super_agent.models.mcp import MCPEnvelope

logger = logging.getLogger(__name__)

# Global in-memory queues
_queues = defaultdict(deque)
_queue_lock = asyncio.Lock()


async def enqueue(agent_id: str, envelope: MCPEnvelope) -> bool:
    """
    Enqueue a message for a specific agent using in-memory queue.
    
    Args:
        agent_id: The target agent's ID
        envelope: The MCP envelope to send
    
    Returns:
        True if successful, False otherwise
    """
    try:
        async with _queue_lock:
            queue_key = f"agent:{agent_id}:queue"
            _queues[queue_key].append(envelope)
            
        logger.debug(f"Enqueued message {envelope.id} for agent {agent_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to enqueue message for agent {agent_id}: {e}")
        return False


async def dequeue(agent_id: str, timeout: int = 1) -> Optional[MCPEnvelope]:
    """
    Dequeue a message for a specific agent using in-memory queue.
    
    Args:
        agent_id: The agent's ID
        timeout: Timeout in seconds for blocking operation
    
    Returns:
        MCPEnvelope if message available, None if timeout or error
    """
    try:
        queue_key = f"agent:{agent_id}:queue"
        
        # Poll for messages with timeout
        start_time = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start_time < timeout:
            async with _queue_lock:
                if _queues[queue_key]:
                    envelope = _queues[queue_key].popleft()
                    logger.debug(f"Dequeued message {envelope.id} for agent {agent_id}")
                    return envelope
            
            # Short sleep to avoid busy waiting
            await asyncio.sleep(0.1)
        
        # Timeout occurred
        return None
        
    except Exception as e:
        logger.error(f"Failed to dequeue message for agent {agent_id}: {e}")
        return None


async def get_queue_length(agent_id: str) -> int:
    """Get the current length of an agent's queue."""
    try:
        async with _queue_lock:
            queue_key = f"agent:{agent_id}:queue"
            return len(_queues[queue_key])
    except Exception as e:
        logger.error(f"Failed to get queue length for agent {agent_id}: {e}")
        return 0


async def clear_queue(agent_id: str) -> bool:
    """Clear all messages from an agent's queue."""
    try:
        async with _queue_lock:
            queue_key = f"agent:{agent_id}:queue"
            _queues[queue_key].clear()
        logger.info(f"Cleared queue for agent {agent_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to clear queue for agent {agent_id}: {e}")
        return False