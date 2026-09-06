from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class SchemaTable(SQLModel, table=True):
    __tablename__ = "schema_tables"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    database_connection_id: int = Field(foreign_key="database_connections.id")
    table_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SchemaColumn(SQLModel, table=True):
    __tablename__ = "schema_columns"

    id: Optional[int] = Field(default=None, primary_key=True)
    table_id: int = Field(foreign_key="schema_tables.id")
    column_name: str
    data_type: str
    is_primary_key: bool = Field(default=False)


class SchemaRelationship(SQLModel, table=True):
    __tablename__ = "schema_relationships"

    id: Optional[int] = Field(default=None, primary_key=True)
    table_id: int = Field(foreign_key="schema_tables.id")
    column_name: str
    references_table: str
    references_column: str