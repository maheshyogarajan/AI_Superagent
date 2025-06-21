"""Redis-based message broker for agent communication."""

import json
import logging
import asyncio
from typing import Optional, Any, Dict
import redis.asyncio as redis
from ai_super_agent.config import settings
from ai_super_agent.models.mcp import MCPEnvelope

logger = logging.getLogger(__name__)

# Global Redis client
_redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """Get or create Redis client instance."""
    global _redis_client
    
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
            socket_keepalive_options={},
            health_check_interval=30,
        )
        
        # Test connection
        try:
            await _redis_client.ping()
            logger.info(f"Connected to Redis at {settings.redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    return _redis_client


async def enqueue(agent_id: str, envelope: MCPEnvelope) -> bool:
    """
    Enqueue a message for a specific agent using Redis RPUSH.
    
    Args:
        agent_id: The target agent's ID
        envelope: The MCP envelope to send
    
    Returns:
        True if successful, False otherwise
    """
    try:
        client = await get_redis_client()
        queue_key = f"agent:{agent_id}:queue"
        
        # Serialize envelope to JSON
        message_data = envelope.to_dict()
        message_json = json.dumps(message_data)
        
        # Push to the right end of the list (FIFO with BLPOP)
        await client.rpush(queue_key, message_json)
        
        logger.debug(f"Enqueued message {envelope.id} for agent {agent_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to enqueue message for agent {agent_id}: {e}")
        return False


async def dequeue(agent_id: str, timeout: int = 1) -> Optional[MCPEnvelope]:
    """
    Dequeue a message for a specific agent using Redis BLPOP.
    
    Args:
        agent_id: The agent's ID
        timeout: Timeout in seconds for blocking operation
    
    Returns:
        MCPEnvelope if message available, None if timeout or error
    """
    try:
        client = await get_redis_client()
        queue_key = f"agent:{agent_id}:queue"
        
        # Block and pop from the left end of the list (FIFO)
        result = await client.blpop(queue_key, timeout=timeout)
        
        if result is None:
            # Timeout occurred
            return None
        
        # result is a tuple: (queue_key, message_json)
        _, message_json = result
        
        # Deserialize JSON to envelope
        message_data = json.loads(message_json)
        envelope = MCPEnvelope.from_dict(message_data)
        
        logger.debug(f"Dequeued message {envelope.id} for agent {agent_id}")
        return envelope
        
    except asyncio.TimeoutError:
        # Normal timeout, not an error
        return None
    except Exception as e:
        logger.error(f"Failed to dequeue message for agent {agent_id}: {e}")
        return None


async def get_queue_length(agent_id: str) -> int:
    """Get the current length of an agent's queue."""
    try:
        client = await get_redis_client()
        queue_key = f"agent:{agent_id}:queue"
        return await client.llen(queue_key)
    except Exception as e:
        logger.error(f"Failed to get queue length for agent {agent_id}: {e}")
        return 0


async def clear_queue(agent_id: str) -> bool:
    """Clear all messages from an agent's queue."""
    try:
        client = await get_redis_client()
        queue_key = f"agent:{agent_id}:queue"
        await client.delete(queue_key)
        logger.info(f"Cleared queue for agent {agent_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to clear queue for agent {agent_id}: {e}")
        return False
