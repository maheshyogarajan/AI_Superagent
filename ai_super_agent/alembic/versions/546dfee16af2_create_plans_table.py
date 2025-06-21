"""create plans table

Revision ID: 546dfee16af2
Revises: 
Create Date: 2025-06-21 14:01:15.072467

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '546dfee16af2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'plans',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('outline', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('plans')
