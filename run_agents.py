#!/usr/bin/env python3
"""Standalone script to run the agent system."""

import asyncio
import logging
import sys
import os

# Add the current directory to sys.path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_super_agent.config import settings
from ai_super_agent.agents.coordinator import CoordinatorAgent
from ai_super_agent.agents.research import ResearchAgent

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.flask_debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def run_agents():
    """Run all agents in the asyncio event loop."""
    logger.info("Starting AI agents...")
    
    # Create agent instances
    coordinator = CoordinatorAgent()
    research_agent = ResearchAgent()
    
    # Start all agents concurrently
    try:
        tasks = [
            asyncio.create_task(coordinator.listen()),
            asyncio.create_task(research_agent.listen())
        ]
        
        logger.info("All agents are now listening for messages...")
        
        # Wait for all tasks to complete or one to fail
        await asyncio.gather(*tasks, return_exceptions=True)
        
    except KeyboardInterrupt:
        logger.info("Shutting down agents...")
        await coordinator.stop()
        await research_agent.stop()
    except Exception as e:
        logger.error(f"Error in agent execution: {e}")
        raise


if __name__ == "__main__":
    try:
        asyncio.run(run_agents())
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)