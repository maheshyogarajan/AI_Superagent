"""Redis-based message broker for agent communication with memory fallback."""

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
_use_memory_fallback = False

# Import memory broker for fallback
from ai_super_agent.queue.memory_broker import (
    enqueue as memory_enqueue,
    dequeue as memory_dequeue,
    get_queue_length as memory_get_queue_length,
    clear_queue as memory_clear_queue
)


async def get_redis_client() -> Optional[redis.Redis]:
    """Get or create Redis client instance."""
    global _redis_client, _use_memory_fallback
    
    if _redis_client is None and not _use_memory_fallback:
        try:
            _redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30,
            )
            
            # Test connection
            await _redis_client.ping()
            logger.info(f"Connected to Redis at {settings.redis_url}")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Using memory fallback.")
            _use_memory_fallback = True
            _redis_client = None
    
    return _redis_client


async def enqueue(agent_id: str, envelope: MCPEnvelope) -> bool:
    """
    Enqueue a message for a specific agent using Redis RPUSH or memory fallback.
    
    Args:
        agent_id: The target agent's ID
        envelope: The MCP envelope to send
    
    Returns:
        True if successful, False otherwise
    """
    global _use_memory_fallback
    
    if _use_memory_fallback:
        return await memory_enqueue(agent_id, envelope)
    
    try:
        client = await get_redis_client()
        if client is None:
            return await memory_enqueue(agent_id, envelope)
            
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
        _use_memory_fallback = True
        return await memory_enqueue(agent_id, envelope)


async def dequeue(agent_id: str, timeout: int = 1) -> Optional[MCPEnvelope]:
    """
    Dequeue a message for a specific agent using Redis BLPOP or memory fallback.
    
    Args:
        agent_id: The agent's ID
        timeout: Timeout in seconds for blocking operation
    
    Returns:
        MCPEnvelope if message available, None if timeout or error
    """
    global _use_memory_fallback
    
    if _use_memory_fallback:
        return await memory_dequeue(agent_id, timeout)
    
    try:
        client = await get_redis_client()
        if client is None:
            return await memory_dequeue(agent_id, timeout)
            
        queue_key = f"agent:{agent_id}:queue"
        
        # Block and pop from the left end of the list (FIFO)
        result = await client.blpop([queue_key], timeout=timeout)
        
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
        _use_memory_fallback = True
        return await memory_dequeue(agent_id, timeout)


async def get_queue_length(agent_id: str) -> int:
    """Get the current length of an agent's queue."""
    global _use_memory_fallback
    
    if _use_memory_fallback:
        return await memory_get_queue_length(agent_id)
    
    try:
        client = await get_redis_client()
        if client is None:
            return await memory_get_queue_length(agent_id)
            
        queue_key = f"agent:{agent_id}:queue"
        return await client.llen(queue_key)
    except Exception as e:
        logger.error(f"Failed to get queue length for agent {agent_id}: {e}")
        _use_memory_fallback = True
        return await memory_get_queue_length(agent_id)


async def clear_queue(agent_id: str) -> bool:
    """Clear all messages from an agent's queue."""
    global _use_memory_fallback
    
    if _use_memory_fallback:
        return await memory_clear_queue(agent_id)
    
    try:
        client = await get_redis_client()
        if client is None:
            return await memory_clear_queue(agent_id)
            
        queue_key = f"agent:{agent_id}:queue"
        await client.delete(queue_key)
        logger.info(f"Cleared queue for agent {agent_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to clear queue for agent {agent_id}: {e}")
        _use_memory_fallback = True
        return await memory_clear_queue(agent_id)
