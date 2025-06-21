"""Configuration management for AI Super Agent."""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    
    # LLM Provider Configuration
    openai_enabled: bool = False
    gemini_enabled: bool = False
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    
    # Flask Configuration
    session_secret: str = "dev-secret-key"
    flask_debug: bool = True
    
    # Agent Configuration
    coordinator_queue_timeout: int = 1
    research_queue_timeout: int = 1
    
    class Config:
        env_file = ".env"
        env_prefix = ""


# Global settings instance
settings = Settings()
