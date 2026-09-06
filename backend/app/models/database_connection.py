from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class DatabaseConnection(SQLModel, table=True):
    __tablename__ = "database_connections"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    db_type: str = Field(default="postgresql")
    host: str
    port: int
    database_name: str
    username: str
    encrypted_password: str  # plain text for now, encrypt later
    created_at: datetime = Field(default_factory=datetime.utcnow)