"""MCP (Message Communication Protocol) envelope model."""

import uuid
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class ProgressUpdate(BaseModel):
    """Progress update entry."""
    at: datetime = Field(description="Timestamp of update")
    percent_complete: float = Field(description="Completion percentage (0-100)")
    status: str = Field(description="Status description")


class QualityScore(BaseModel):
    """Quality scoring metrics."""
    self: Optional[float] = Field(default=None, description="Self-assessed quality (0-1)")
    coordinator: Optional[float] = Field(default=None, description="Coordinator-assessed quality (0-1)")


class SimulationSpec(BaseModel):
    """Simulation specification for strategic analysis."""
    players: List[str] = Field(default_factory=list, description="List of players/entities")
    strategies: Dict[str, List[str]] = Field(default_factory=dict, description="Available strategies per player")
    payoff_matrix_ref: Optional[str] = Field(default=None, description="Reference to payoff matrix")
    solution_concept: Optional[str] = Field(default=None, description="Solution concept (e.g., nash_mixed)")


class RiskProfile(BaseModel):
    """Risk assessment profile."""
    regulatory: Optional[float] = Field(default=None, description="Regulatory risk (0-1)")
    competitive: Optional[float] = Field(default=None, description="Competitive risk (0-1)")
    tech: Optional[float] = Field(default=None, description="Technology risk (0-1)")


class TaskResult(BaseModel):
    """Task execution result."""
    status: str = Field(description="Result status (success, error, pending)")
    data_output_ref: Optional[str] = Field(default=None, description="Reference to output data")
    message: Optional[str] = Field(default=None, description="Result message")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Inline result data")


class MCPEnvelope(BaseModel):
    """
    Enhanced MCP Envelope model for inter-agent communication.
    Based on the Model Context Protocol specification with extensions.
    """
    # Core identity and routing
    sender: str = Field(description="ID of the sending agent")
    recipient: str = Field(description="ID of the receiving agent or 'Coordinator'")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="ISO-8601 UTC timestamp")
    
    # Task identification
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique task identifier")
    parent_task_id: Optional[str] = Field(default=None, description="Parent task UUID if subtask")
    scenario_id: Optional[str] = Field(default=None, description="Scenario group identifier")
    
    # Task specification
    instruction: str = Field(description="Natural language instruction with references")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="LLM parameters (temperature, max_tokens, etc.)")
    context: Dict[str, Any] = Field(default_factory=dict, description="Task context with links, entities, deadlines")
    
    # Advanced features
    simulation_spec: Optional[SimulationSpec] = Field(default=None, description="Simulation specification")
    risk_profile: Optional[RiskProfile] = Field(default=None, description="Risk assessment profile")
    progress_updates: List[ProgressUpdate] = Field(default_factory=list, description="Progress tracking")
    result: Optional[TaskResult] = Field(default=None, description="Task execution result")
    quality_score: Optional[QualityScore] = Field(default=None, description="Quality assessment")
    
    # Security and integrity
    signature: Optional[str] = Field(default=None, description="Hash of body with agent key")
    
    # Legacy compatibility fields
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Legacy envelope ID")
    method: str = Field(default="execute_task", description="Legacy method field")
    params: Dict[str, Any] = Field(default_factory=dict, description="Legacy params field")
    priority: int = Field(default=0, description="Message priority (higher = more urgent)")
    correlation_id: Optional[str] = Field(default=None, description="For tracking request/response pairs")

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

    def add_progress_update(self, percent_complete: float, status: str) -> None:
        """Add a progress update entry."""
        update = ProgressUpdate(
            at=datetime.utcnow(),
            percent_complete=percent_complete,
            status=status
        )
        self.progress_updates.append(update)

    def set_result(self, status: str, message: Optional[str] = None, 
                   data: Optional[Dict[str, Any]] = None, 
                   data_output_ref: Optional[str] = None) -> None:
        """Set task result."""
        self.result = TaskResult(
            status=status,
            message=message,
            data=data,
            data_output_ref=data_output_ref
        )

    def set_quality_score(self, self_score: Optional[float] = None, 
                         coordinator_score: Optional[float] = None) -> None:
        """Set quality scores."""
        self.quality_score = QualityScore(
            self=self_score,
            coordinator=coordinator_score
        )