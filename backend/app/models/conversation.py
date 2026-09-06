from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class ConversationState(SQLModel, table=True):
    __tablename__ = "conversation_states"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    database_connection_id: int = Field(foreign_key="database_connections.id")
    original_question: str
    intent: Optional[str] = None
    entity: Optional[str] = None
    metric: Optional[str] = None
    clarification_question: Optional[str] = None
    status: str = Field(default="NEEDS_CLARIFICATION")  # NEEDS_CLARIFICATION | COMPLETE
    final_question: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)