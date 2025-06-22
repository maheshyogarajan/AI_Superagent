"""SQLAlchemy models for AI Super Agent."""
from uuid import uuid4
from sqlalchemy import Column, String, Float, ForeignKey, Text, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
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


class Plan(Base):
    """Plan model for execution plans."""
    __tablename__ = 'plans'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    instruction = Column(Text, nullable=False)
    outline = Column(JSON, nullable=False)
    status = Column(Text, default='draft')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Task(Base):
    """Task model for individual execution tasks."""
    __tablename__ = 'tasks'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey('plans.id'))
    step_id = Column(String)
    agent_id = Column(String)
    instruction = Column(Text)
    status = Column(String, default='pending')
    parameters = Column(JSON)
    dependencies = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MCPEnvelope(Base):
    """MCP Envelope model for message tracking."""
    __tablename__ = 'mcp_envelopes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    plan_id = Column(UUID(as_uuid=True))
    sender = Column(String)
    recipient = Column(String)
    instruction = Column(Text)
    context = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())