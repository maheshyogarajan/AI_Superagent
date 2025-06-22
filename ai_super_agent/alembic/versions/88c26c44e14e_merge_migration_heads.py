"""merge migration heads

Revision ID: 88c26c44e14e
Revises: 79410d55383b, workflow_plan_links, add_plan_status_002
Create Date: 2025-06-22 08:05:04.275987

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88c26c44e14e'
down_revision: Union[str, Sequence[str], None] = ('79410d55383b', 'workflow_plan_links', 'add_plan_status_002')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
