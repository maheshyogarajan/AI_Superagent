"""Add status to plans and plan_id to tasks and envelopes

Revision ID: add_plan_status_002
Revises: 
Create Date: 2025-06-22 06:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_plan_status_002'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add status column to plans table if it doesn't exist
    op.execute("ALTER TABLE plans ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'")
    
    # Add plan_id column to tasks table if it doesn't exist
    op.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id)")
    
    # Add plan_id column to mcp_envelopes table if it doesn't exist
    op.execute("ALTER TABLE mcp_envelopes ADD COLUMN IF NOT EXISTS plan_id UUID")


def downgrade() -> None:
    # Remove added columns
    op.drop_column('mcp_envelopes', 'plan_id')
    op.drop_column('tasks', 'plan_id') 
    op.drop_column('plans', 'status')