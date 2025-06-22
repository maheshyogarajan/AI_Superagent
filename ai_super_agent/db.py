"""Database setup and session management for AI Super Agent."""
import os
from sqlalchemy import MetaData, Table, Column, String, JSON, DateTime, Float, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.sql import func

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    # Convert to asyncpg format and handle sslmode parameter
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    # Remove sslmode parameter as asyncpg doesn't support it
    if "?sslmode=" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?sslmode=")[0]

# Create async engine
if DATABASE_URL:
    async_engine = create_async_engine(DATABASE_URL)
else:
    raise ValueError("DATABASE_URL environment variable is required")
async_session = async_sessionmaker(async_engine, expire_on_commit=False)

# Metadata for table definitions
metadata = MetaData()

# Plans table definition
plans_table = Table(
    'plans',
    metadata,
    Column('id', String, primary_key=True),
    Column('outline', JSON, nullable=False),
    Column('status', String, server_default='draft'),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
)

# Agents table definition
agents_table = Table(
    'agents',
    metadata,
    Column('id', String, primary_key=True),
    Column('name', String, nullable=False),
    Column('role', String),
    Column('personality_id', String, server_default='Default'),
    Column('temperature_cap', Float, server_default='0.8'),
    Column('risk_bias', Float, server_default='0.5'),
    Column('default_model', String, server_default='gpt-4o'),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
)

# Personalities table definition
personalities_table = Table(
    'personalities',
    metadata,
    Column('profile_id', String, primary_key=True),
    Column('name', String, nullable=False),
    Column('description', String),
    Column('creativity', Float, server_default='0.7'),
    Column('analytical', Float, server_default='0.7'),
    Column('max_temperature', Float, server_default='0.9'),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
)

# Sync engine for Alembic migrations
if DATABASE_URL:
    sync_engine = create_engine(DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"))
else:
    raise ValueError("DATABASE_URL environment variable is required")