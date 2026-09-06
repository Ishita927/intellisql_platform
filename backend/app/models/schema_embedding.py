from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class SchemaEmbedding(SQLModel, table=True):
    __tablename__ = "schema_embeddings"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    database_connection_id: int = Field(foreign_key="database_connections.id")
    table_name: str
    document_text: str
    embedding: list[float] = Field(sa_column=Column(JSON))