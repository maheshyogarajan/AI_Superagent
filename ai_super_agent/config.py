import os

class Settings:
    """Read config from Replit Secrets (env vars)."""
    redis_url = os.getenv("REDIS_URL", "")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    openai_enabled = bool(openai_api_key)
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_enabled = bool(gemini_api_key)
    
    # Flask Configuration
    session_secret = os.getenv("SESSION_SECRET", "dev-secret-key")
    flask_debug = True
    
    # Agent Configuration
    coordinator_queue_timeout = 1
    research_queue_timeout = 1

settings = Settings()