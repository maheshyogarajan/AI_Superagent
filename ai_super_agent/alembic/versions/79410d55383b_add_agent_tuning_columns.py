"""add agent tuning columns

Revision ID: 79410d55383b
Revises: 546dfee16af2
Create Date: 2025-06-21 14:17:03.325698

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '79410d55383b'
down_revision: Union[str, Sequence[str], None] = '546dfee16af2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create agents table
    op.create_table(
        'agents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('personality_id', sa.String(), server_default='Default', nullable=True),
        sa.Column('temperature_cap', sa.Float(), server_default='0.8', nullable=True),
        sa.Column('risk_bias', sa.Float(), server_default='0.5', nullable=True),
        sa.Column('default_model', sa.String(), server_default='gpt-4o', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create personalities table
    op.create_table(
        'personalities',
        sa.Column('profile_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('creativity', sa.Float(), server_default='0.7', nullable=True),
        sa.Column('analytical', sa.Float(), server_default='0.7', nullable=True),
        sa.Column('max_temperature', sa.Float(), server_default='0.9', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('profile_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('personalities')
    op.drop_table('agents')
