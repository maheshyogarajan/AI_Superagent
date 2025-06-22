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


def setup_plans_api(app):
    """Configure Flask to serve plans API routes"""
    from flask import Blueprint, jsonify, request
    from ai_super_agent.repos.plan_repo import PlanRepo
    
    plans_bp = Blueprint("plans", __name__)

    @plans_bp.route("/plans/<uuid:plan_id>", methods=["GET"])
    def get_plan(plan_id):
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            plan = loop.run_until_complete(PlanRepo.get(str(plan_id)))
            return jsonify(plan or {}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            loop.close()

    @plans_bp.route("/plans/<uuid:plan_id>", methods=["PATCH"])
    def update_plan(plan_id):
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            body = request.get_json()
            if not body or "outline" not in body:
                return jsonify({"error": "Missing outline in request body"}), 400
            loop.run_until_complete(PlanRepo.insert(str(plan_id), body["outline"]))
            return "", 204
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            loop.close()

    app.register_blueprint(plans_bp)


def create_flask_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.secret_key = settings.session_secret
    
    # Register API blueprint
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Setup plans API
    setup_plans_api(app)
    
    # Setup UI serving
    setup_ui_serving(app)
    
    # Setup workings API
    setup_workings_api(app)
    
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


def setup_ui_serving(app):
    """Configure Flask to serve the React UI from ui/dist"""
    from flask import send_from_directory, Blueprint, jsonify
    import os
    import uuid as uuid_lib
    
    ui_bp = Blueprint('ui', __name__, static_folder='../ui/dist')

    @ui_bp.route('/', defaults={'path': ''})
    @ui_bp.route('/<path:path>')
    def serve_ui(path):
        root_dir = os.path.join(os.path.dirname(__file__), '..', 'ui', 'dist')
        
        # If path is empty or doesn't exist, serve index.html for React Router
        if path == '' or path.startswith('workings/') or path in ['task-runner', 'strategy', 'personality', 'logs']:
            return send_from_directory(root_dir, 'index.html')
        
        # Try to serve the requested file
        try:
            return send_from_directory(root_dir, path)
        except:
            # Fallback to index.html for client-side routing
            return send_from_directory(root_dir, 'index.html')

    app.register_blueprint(ui_bp)

def setup_workings_api(app):
    """Configure Flask to serve task workings and documentation"""
    from flask import Blueprint, jsonify, send_file
    import os
    import uuid as uuid_lib
    
    workings_bp = Blueprint('workings', __name__)

    @workings_bp.route('/workings/<uuid:task_id>')
    def get_workings(task_id):
        """Return raw markdown plus an ordered list of each saved step."""
        try:
            # Create data directory if it doesn't exist
            data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'workings')
            os.makedirs(data_dir, exist_ok=True)
            
            path = os.path.join(data_dir, f'{task_id}.md')
            
            if not os.path.exists(path):
                # Return empty workings for new tasks
                return jsonify({
                    'markdown': '',
                    'steps': [],
                    'task_id': str(task_id),
                    'status': 'not_found'
                })
            
            with open(path, 'r', encoding='utf-8') as f:
                md = f.read()
            
            # Split by step breaks
            steps = md.split('\n--- STEP BREAK ---\n')
            
            return jsonify({
                'markdown': steps[-1] if steps else '',
                'steps': steps,
                'task_id': str(task_id),
                'status': 'found',
                'step_count': len(steps)
            })
            
        except Exception as e:
            return jsonify({
                'error': str(e),
                'task_id': str(task_id),
                'status': 'error'
            }), 500

    @workings_bp.route('/workings/<uuid:task_id>/raw')
    def get_workings_raw(task_id):
        """Return raw markdown file for download"""
        try:
            data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'workings')
            path = os.path.join(data_dir, f'{task_id}.md')
            
            if not os.path.exists(path):
                return jsonify({'error': 'File not found'}), 404
                
            return send_file(path, as_attachment=True, download_name=f'task_{task_id}_workings.md')
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @workings_bp.route('/workings')
    def list_workings():
        """List all available task workings"""
        try:
            data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'workings')
            os.makedirs(data_dir, exist_ok=True)
            
            workings = []
            for filename in os.listdir(data_dir):
                if filename.endswith('.md'):
                    task_id = filename[:-3]  # Remove .md extension
                    try:
                        uuid_lib.UUID(task_id)  # Validate UUID format
                        file_path = os.path.join(data_dir, filename)
                        stat = os.stat(file_path)
                        
                        workings.append({
                            'task_id': task_id,
                            'filename': filename,
                            'size': stat.st_size,
                            'modified': stat.st_mtime,
                        })
                    except ValueError:
                        continue  # Skip non-UUID files
            
            return jsonify({
                'workings': workings,
                'count': len(workings)
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    app.register_blueprint(workings_bp)

if __name__ == "__main__":
    main()
