"""Main entry point for AI Super Agent."""

from ai_super_agent.app import create_flask_app

app = create_flask_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)