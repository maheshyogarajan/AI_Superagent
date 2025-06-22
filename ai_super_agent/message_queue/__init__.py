"""Queue management for AI Super Agent."""

from queue import Queue
from .broker import enqueue, dequeue, get_redis_client

# Global memory broker for synchronous message handling
memory_broker = Queue(maxsize=1000)

__all__ = ["enqueue", "dequeue", "get_redis_client", "memory_broker"]
