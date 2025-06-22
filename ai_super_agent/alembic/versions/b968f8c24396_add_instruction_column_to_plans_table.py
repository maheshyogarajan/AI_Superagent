"""add instruction column to plans table

Revision ID: b968f8c24396
Revises: 88c26c44e14e
Create Date: 2025-06-22 08:05:54.601735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b968f8c24396'
down_revision: Union[str, Sequence[str], None] = '88c26c44e14e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add instruction column to plans table."""
    op.add_column('plans', sa.Column('instruction', sa.Text(), nullable=False, server_default=''))


def downgrade() -> None:
    """Remove instruction column from plans table."""
    op.drop_column('plans', 'instruction')
