"""Synchronous repository for agent configuration data."""
from typing import List, Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Create sync engine
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


class AgentRepository:
    """Synchronous repository for managing agent configurations."""
    
    def get_all_agents(self) -> List[Dict[str, Any]]:
        """Get all agents from the database."""
        with Session() as session:
            result = session.execute(text("SELECT * FROM agents"))
            agents = result.fetchall()
            return [dict(agent._mapping) for agent in agents]
    
    def get_agent_by_id(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific agent by ID."""
        with Session() as session:
            result = session.execute(
                text("SELECT * FROM agents WHERE id = :agent_id"),
                {"agent_id": agent_id}
            )
            agent = result.fetchone()
            return dict(agent._mapping) if agent else None
    
    def create_agent(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new agent."""
        with Session() as session:
            result = session.execute(
                text("""
                    INSERT INTO agents (id, name, role, personality_id, temperature_cap, risk_bias, default_model)
                    VALUES (:id, :name, :role, :personality_id, :temperature_cap, :risk_bias, :default_model)
                    RETURNING *
                """),
                agent_data
            )
            session.commit()
            agent = result.fetchone()
            return dict(agent._mapping)
    
    def update_agent(self, agent_id: str, agent_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing agent."""
        with Session() as session:
            # Build dynamic update query
            set_clauses = []
            params = {"id": agent_id}
            
            for key, value in agent_data.items():
                if key in ["name", "role", "personality_id", "temperature_cap", "risk_bias", "default_model"]:
                    set_clauses.append(f"{key} = :{key}")
                    params[key] = value
            
            if not set_clauses:
                return None
            
            query = f"""
                UPDATE agents 
                SET {', '.join(set_clauses)}, updated_at = NOW()
                WHERE id = :id 
                RETURNING *
            """
            
            result = session.execute(text(query), params)
            session.commit()
            agent = result.fetchone()
            return dict(agent._mapping) if agent else None
    
    def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent."""
        with Session() as session:
            result = session.execute(
                text("DELETE FROM agents WHERE id = :agent_id"),
                {"agent_id": agent_id}
            )
            session.commit()
            return result.rowcount > 0


class PersonalityRepository:
    """Synchronous repository for managing personality profiles."""
    
    def get_all_personalities(self) -> List[Dict[str, Any]]:
        """Get all personality profiles."""
        with Session() as session:
            result = session.execute(text("SELECT * FROM personalities"))
            personalities = result.fetchall()
            return [dict(personality._mapping) for personality in personalities]
    
    def get_personality_by_id(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific personality by ID."""
        with Session() as session:
            result = session.execute(
                text("SELECT * FROM personalities WHERE profile_id = :profile_id"),
                {"profile_id": profile_id}
            )
            personality = result.fetchone()
            return dict(personality._mapping) if personality else None
    
    def create_personality(self, personality_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new personality profile."""
        with Session() as session:
            result = session.execute(
                text("""
                    INSERT INTO personalities (profile_id, name, description, creativity, analytical, max_temperature)
                    VALUES (:profile_id, :name, :description, :creativity, :analytical, :max_temperature)
                    RETURNING *
                """),
                personality_data
            )
            session.commit()
            personality = result.fetchone()
            return dict(personality._mapping)
    
    def update_personality(self, profile_id: str, personality_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing personality profile."""
        with Session() as session:
            # Build dynamic update query
            set_clauses = []
            params = {"profile_id": profile_id}
            
            for key, value in personality_data.items():
                if key in ["name", "description", "creativity", "analytical", "max_temperature"]:
                    set_clauses.append(f"{key} = :{key}")
                    params[key] = value
            
            if not set_clauses:
                return None
            
            query = f"""
                UPDATE personalities 
                SET {', '.join(set_clauses)}, updated_at = NOW()
                WHERE profile_id = :profile_id 
                RETURNING *
            """
            
            result = session.execute(text(query), params)
            session.commit()
            personality = result.fetchone()
            return dict(personality._mapping) if personality else None
    
    def delete_personality(self, profile_id: str) -> bool:
        """Delete a personality profile."""
        with Session() as session:
            result = session.execute(
                text("DELETE FROM personalities WHERE profile_id = :profile_id"),
                {"profile_id": profile_id}
            )
            session.commit()
            return result.rowcount > 0