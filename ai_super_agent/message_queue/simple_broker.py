"""Simplified Redis broker implementation."""

import json
import logging
from typing import Optional
import redis.asyncio as redis
from ai_super_agent.config import settings
from ai_super_agent.models.mcp import MCPEnvelope

logger = logging.getLogger(__name__)

# Redis client instance
_client: Optional[redis.Redis] = None

async def get_client() -> redis.Redis:
    """Get Redis client, create if needed."""
    global _client
    if _client is None:
        if not settings.redis_url:
            raise ValueError("Redis URL not configured")
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client

async def enqueue(agent_id: str, envelope: MCPEnvelope) -> bool:
    """Enqueue message for agent."""
    try:
        client = await get_client()
        queue_key = f"agent:{agent_id}:queue"
        message_json = json.dumps(envelope.to_dict())
        result = await client.rpush(queue_key, message_json)
        logger.debug(f"Enqueued message {envelope.id} for agent {agent_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to enqueue for {agent_id}: {e}")
        return False

async def dequeue(agent_id: str, timeout: int = 1) -> Optional[MCPEnvelope]:
    """Dequeue message for agent."""
    try:
        client = await get_client()
        queue_key = f"agent:{agent_id}:queue"
        result = await client.blpop([queue_key], timeout=timeout)
        
        if result is None:
            return None
            
        _, message_json = result
        message_data = json.loads(message_json)
        return MCPEnvelope.from_dict(message_data)
        
    except Exception as e:
        logger.error(f"Failed to dequeue for {agent_id}: {e}")
        return None

async def get_queue_length(agent_id: str) -> int:
    """Get queue length for agent."""
    try:
        client = await get_client()
        queue_key = f"agent:{agent_id}:queue"
        return await client.llen(queue_key)
    except Exception as e:
        logger.error(f"Failed to get queue length for {agent_id}: {e}")
        return 0

async def clear_queue(agent_id: str) -> bool:
    """Clear queue for agent."""
    try:
        client = await get_client()
        queue_key = f"agent:{agent_id}:queue"
        await client.delete(queue_key)
        return True
    except Exception as e:
        logger.error(f"Failed to clear queue for {agent_id}: {e}")
        return False