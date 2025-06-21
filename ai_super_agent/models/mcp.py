"""MCP (Message Communication Protocol) envelope model."""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class MCPEnvelope(BaseModel):
    """
    MCP Envelope model for inter-agent communication.
    Based on the Model Context Protocol specification.
    """
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    method: str = Field(description="The method or action to be performed")
    params: Dict[str, Any] = Field(default_factory=dict, description="Parameters for the method")
    sender: Optional[str] = Field(default=None, description="ID of the sending agent")
    recipient: str = Field(description="ID of the receiving agent")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    priority: int = Field(default=0, description="Message priority (higher = more urgent)")
    correlation_id: Optional[str] = Field(default=None, description="For tracking request/response pairs")
    
    # Task-specific fields
    instruction: Optional[str] = Field(default=None, description="Human-readable instruction")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context data")
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Redis storage."""
        return self.model_dump(mode='json')
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MCPEnvelope':
        """Create from dictionary loaded from Redis."""
        return cls.model_validate(data)
