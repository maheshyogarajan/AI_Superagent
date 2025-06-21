"""Main application entry point for AI Super Agent."""

import os
import sys
import logging
import asyncio
import threading
from flask import Flask
from werkzeug.serving import run_simple

# Add the parent directory to sys.path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_super_agent.config import settings
from ai_super_agent.api import api_bp
from ai_super_agent.agents.coordinator import CoordinatorAgent
from ai_super_agent.agents.research import ResearchAgent

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.flask_debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def create_flask_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.secret_key = settings.session_secret
    
    # Register API blueprint
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Root endpoint
    @app.route('/')
    def root():
        return {
            "message": "AI Super Agent is running",
            "status": "active",
            "endpoints": [
                "/api/task (POST)",
                "/api/status (GET)",
                "/api/health (GET)"
            ]
        }
    
    return app


def run_flask_server():
    """Run Flask server in a separate thread."""
    app = create_flask_app()
    
    logger.info("Starting Flask server on http://0.0.0.0:5000")
    
    # Use werkzeug's run_simple for better control
    run_simple(
        hostname='0.0.0.0',
        port=5000,
        application=app,
        use_debugger=settings.flask_debug,
        use_reloader=False,  # Disable reloader to avoid conflicts with asyncio
        threaded=True
    )


async def run_agents():
    """Run all agents in the asyncio event loop."""
    logger.info("Starting AI agents...")
    
    # Create agent instances
    coordinator = CoordinatorAgent()
    research_agent = ResearchAgent()
    
    # Start all agents concurrently
    try:
        await asyncio.gather(
            coordinator.listen(),
            research_agent.listen(),
            return_exceptions=True
        )
    except KeyboardInterrupt:
        logger.info("Shutting down agents...")
        await coordinator.stop()
        await research_agent.stop()
    except Exception as e:
        logger.error(f"Error in agent execution: {e}")
        raise


def main():
    """Main application entry point."""
    logger.info("Starting AI Super Agent system...")
    
    try:
        # Start Flask server in a daemon thread
        flask_thread = threading.Thread(target=run_flask_server, daemon=True)
        flask_thread.start()
        
        # Give Flask a moment to start
        import time
        time.sleep(1)
        
        logger.info("Flask server started, launching agent event loop...")
        
        # Run agents in the main thread's asyncio loop
        asyncio.run(run_agents())
        
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
    finally:
        logger.info("AI Super Agent system stopped")


if __name__ == "__main__":
    main()
