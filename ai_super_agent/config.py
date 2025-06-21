"""Configuration management for AI Super Agent."""

import os
from typing import Optional
from pydantic import BaseSettings, Field
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Redis Configuration
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # LLM Provider Configuration
    openai_enabled: bool = Field(default=False, env="OPENAI_ENABLED")
    gemini_enabled: bool = Field(default=False, env="GEMINI_ENABLED")
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    
    # Flask Configuration
    session_secret: str = Field(default="dev-secret-key", env="SESSION_SECRET")
    flask_debug: bool = Field(default=True, env="FLASK_DEBUG")
    
    # Agent Configuration
    coordinator_queue_timeout: int = Field(default=1, env="COORDINATOR_QUEUE_TIMEOUT")
    research_queue_timeout: int = Field(default=1, env="RESEARCH_QUEUE_TIMEOUT")
    
    class Config:
        env_file = ".env"


# Global settings instance
settings = Settings()
