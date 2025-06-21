"""Repository for agent configuration data."""
from typing import List, Optional, Dict, Any
from sqlalchemy import select, insert, update, delete
from ai_super_agent.db import async_session, agents_table, personalities_table


class AgentRepository:
    """Repository for managing agent configurations."""
    
    async def get_all_agents(self) -> List[Dict[str, Any]]:
        """Get all agents from the database."""
        async with async_session() as session:
            result = await session.execute(select(agents_table))
            agents = result.fetchall()
            return [dict(agent._mapping) for agent in agents]
    
    async def get_agent_by_id(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific agent by ID."""
        async with async_session() as session:
            result = await session.execute(
                select(agents_table).where(agents_table.c.id == agent_id)
            )
            agent = result.fetchone()
            return dict(agent._mapping) if agent else None
    
    async def create_agent(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new agent."""
        async with async_session() as session:
            result = await session.execute(
                insert(agents_table).values(**agent_data).returning(agents_table)
            )
            await session.commit()
            agent = result.fetchone()
            return dict(agent._mapping)
    
    async def update_agent(self, agent_id: str, agent_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing agent."""
        async with async_session() as session:
            result = await session.execute(
                update(agents_table)
                .where(agents_table.c.id == agent_id)
                .values(**agent_data)
                .returning(agents_table)
            )
            await session.commit()
            agent = result.fetchone()
            return dict(agent._mapping) if agent else None
    
    async def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent."""
        async with async_session() as session:
            result = await session.execute(
                delete(agents_table).where(agents_table.c.id == agent_id)
            )
            await session.commit()
            return result.rowcount > 0


class PersonalityRepository:
    """Repository for managing personality profiles."""
    
    async def get_all_personalities(self) -> List[Dict[str, Any]]:
        """Get all personality profiles."""
        async with async_session() as session:
            result = await session.execute(select(personalities_table))
            personalities = result.fetchall()
            return [dict(personality._mapping) for personality in personalities]
    
    async def get_personality_by_id(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific personality by ID."""
        async with async_session() as session:
            result = await session.execute(
                select(personalities_table).where(personalities_table.c.profile_id == profile_id)
            )
            personality = result.fetchone()
            return dict(personality._mapping) if personality else None
    
    async def create_personality(self, personality_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new personality profile."""
        async with async_session() as session:
            result = await session.execute(
                insert(personalities_table).values(**personality_data).returning(personalities_table)
            )
            await session.commit()
            personality = result.fetchone()
            return dict(personality._mapping)
    
    async def update_personality(self, profile_id: str, personality_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing personality profile."""
        async with async_session() as session:
            result = await session.execute(
                update(personalities_table)
                .where(personalities_table.c.profile_id == profile_id)
                .values(**personality_data)
                .returning(personalities_table)
            )
            await session.commit()
            personality = result.fetchone()
            return dict(personality._mapping) if personality else None
    
    async def delete_personality(self, profile_id: str) -> bool:
        """Delete a personality profile."""
        async with async_session() as session:
            result = await session.execute(
                delete(personalities_table).where(personalities_table.c.profile_id == profile_id)
            )
            await session.commit()
            return result.rowcount > 0