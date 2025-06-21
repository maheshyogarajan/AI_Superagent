"""SQLAlchemy models for AI Super Agent."""
from uuid import uuid4
from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from ai_super_agent.db import metadata, async_session
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base(metadata=metadata)

class Agent(Base):
    """Agent configuration model."""
    __tablename__ = "agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    role = Column(String)
    personality_id = Column(String, ForeignKey("personalities.profile_id"), default="Default")
    temperature_cap = Column(Float, default=0.8)
    risk_bias = Column(Float, default=0.5)
    default_model = Column(String, default="gpt-4o")
    
    def as_config_dict(self):
        """Convert agent to configuration dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "role": self.role,
            "personality_id": self.personality_id,
            "temperature_cap": self.temperature_cap,
            "risk_bias": self.risk_bias,
            "default_model": self.default_model
        }

class Personality(Base):
    """Personality profile model."""
    __tablename__ = "personalities"
    
    profile_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    creativity = Column(Float, default=0.7)
    analytical = Column(Float, default=0.7)
    max_temperature = Column(Float, default=0.9)
    
    def as_dict(self):
        """Convert personality to dictionary."""
        return {
            "profile_id": self.profile_id,
            "name": self.name,
            "description": self.description,
            "creativity": self.creativity,
            "analytical": self.analytical,
            "max_temperature": self.max_temperature
        }