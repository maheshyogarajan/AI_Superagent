"""Database setup and session management for AI Super Agent."""
import os
from sqlalchemy import MetaData, Table, Column, String, JSON, DateTime, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.sql import func

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    # Convert to asyncpg format
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
async_engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(async_engine, expire_on_commit=False)

# Metadata for table definitions
metadata = MetaData()

# Plans table definition
plans_table = Table(
    'plans',
    metadata,
    Column('id', String, primary_key=True),
    Column('outline', JSON, nullable=False),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
)

# Sync engine for Alembic migrations
sync_engine = create_engine(DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"))