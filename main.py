"""Main entry point for AI Super Agent."""

import asyncio
import threading
import logging
from ai_super_agent.app import create_flask_app
from ai_super_agent.agents.coordinator import CoordinatorAgent
from ai_super_agent.agents.research import ResearchAgent

logger = logging.getLogger(__name__)

def run_agents_thread():
    """Run agents in a separate thread with its own event loop."""
    async def run_agents():
        coordinator = CoordinatorAgent()
        research = ResearchAgent()
        
        logger.info("Starting agent system...")
        
        # Start both agents concurrently
        await asyncio.gather(
            coordinator.listen(),
            research.listen()
        )
    
    # Create new event loop for this thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(run_agents())
    except Exception as e:
        logger.error(f"Agent system error: {e}")
    finally:
        loop.close()

# Create Flask app
app = create_flask_app()

# Start agents in background thread when module is imported
if not hasattr(app, '_agents_started'):
    app._agents_started = True
    agents_thread = threading.Thread(target=run_agents_thread, daemon=True)
    agents_thread.start()
    logger.info("Agent system started in background thread")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)