"""add plan_id links for workflow

Revision ID: workflow_plan_links
Revises: 546dfee16af2
Create Date: 2025-06-22 05:59:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'workflow_plan_links'
down_revision = '546dfee16af2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add status column to plans table
    op.add_column('plans', sa.Column('status', sa.String(), server_default='draft', nullable=True))
    
    # Create tasks table if it doesn't exist
    op.create_table('tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('instruction', sa.String(), nullable=False),
        sa.Column('status', sa.String(), server_default='pending', nullable=True),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['plans.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create mcp_envelopes table if it doesn't exist
    op.create_table('mcp_envelopes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('method', sa.String(), nullable=False),
        sa.Column('instruction', sa.String(), nullable=True),
        sa.Column('params', sa.JSON(), nullable=True),
        sa.Column('context', sa.JSON(), nullable=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Remove status column from plans table
    op.drop_column('plans', 'status')
    
    # Drop tables
    op.drop_table('mcp_envelopes')
    op.drop_table('tasks')