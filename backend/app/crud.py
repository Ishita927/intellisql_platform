from sqlmodel import select
from .database import AsyncSessionLocal
from .models import Tenant, User, UserRole
from .security import hash_password
from typing import List, Optional, Tuple
from .models import DatabaseConnection
from .security import encrypt_value
from .models import SchemaTable, SchemaColumn, SchemaRelationship
from .models import ConversationState
from .models import SchemaEmbedding
from .embeddings import embed_text


async def create_tenant(name: str) -> Tenant:
    async with AsyncSessionLocal() as session:
        tenant = Tenant(name=name)
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)
        return tenant


async def get_all_tenants() -> List[Tenant]:
    async with AsyncSessionLocal() as session:
        result = await session.exec(select(Tenant))
        return result.all()


async def create_user(
    name: str,
    email: str,
    password: str,
    tenant_id: Optional[int],
    role: UserRole = UserRole.analyst,
) -> User:
    async with AsyncSessionLocal() as session:
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            tenant_id=tenant_id,
            role=role,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


async def get_users_for_tenant(tenant_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.exec(select(User).where(User.tenant_id == tenant_id))
        return result.all()


async def get_user_by_email(email: str) -> Optional[User]:
    async with AsyncSessionLocal() as session:
        result = await session.exec(select(User).where(User.email == email))
        return result.first()


async def register_tenant_with_admin(
    company_name: str, name: str, email: str, password: str
) -> Tuple[Tenant, User]:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            tenant = Tenant(name=company_name)
            session.add(tenant)
            await session.flush()

            user = User(
                tenant_id=tenant.id,
                name=name,
                email=email,
                password_hash=hash_password(password),
                role=UserRole.admin,
            )
            session.add(user)
            await session.flush()

        await session.refresh(tenant)
        await session.refresh(user)
        return tenant, user
    
async def create_database_connection(
    tenant_id: int, host: str, port: int, database_name: str, username: str, password: str
) -> DatabaseConnection:
    async with AsyncSessionLocal() as session:
        conn = DatabaseConnection(
            tenant_id=tenant_id,
            host=host,
            port=port,
            database_name=database_name,
            username=username,
            encrypted_password=encrypt_value(password),
        )
        session.add(conn)
        await session.commit()
        await session.refresh(conn)
        return conn


async def get_database_connections_for_tenant(tenant_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.exec(
            select(DatabaseConnection).where(DatabaseConnection.tenant_id == tenant_id)
        )
        return result.all()

async def get_database_connection(connection_id: int) -> Optional[DatabaseConnection]:
    async with AsyncSessionLocal() as session:
        return await session.get(DatabaseConnection, connection_id)


async def store_schema(tenant_id: int, database_connection_id: int, tables_data: list[dict]):
    """tables_data: [{"name": ..., "columns": [{"name","type","is_primary_key"}], "foreign_keys": [{"column","references_table","references_column"}]}]"""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # clear previous schema for this connection so re-scans don't duplicate
            old_tables_result = await session.exec(
                select(SchemaTable).where(SchemaTable.database_connection_id == database_connection_id)
            )
            old_tables = old_tables_result.all()
            for old_table in old_tables:
                await session.exec(
                    select(SchemaColumn).where(SchemaColumn.table_id == old_table.id)
                )
                cols = (await session.exec(
                    select(SchemaColumn).where(SchemaColumn.table_id == old_table.id)
                )).all()
                for c in cols:
                    await session.delete(c)
                rels = (await session.exec(
                    select(SchemaRelationship).where(SchemaRelationship.table_id == old_table.id)
                )).all()
                for r in rels:
                    await session.delete(r)
                await session.delete(old_table)
            await session.flush()

            # insert freshly scanned schema
            for table in tables_data:
                schema_table = SchemaTable(
                    tenant_id=tenant_id,
                    database_connection_id=database_connection_id,
                    table_name=table["name"],
                )
                session.add(schema_table)
                await session.flush()  # get schema_table.id

                for col in table["columns"]:
                    session.add(SchemaColumn(
                        table_id=schema_table.id,
                        column_name=col["name"],
                        data_type=col["type"],
                        is_primary_key=col["is_primary_key"],
                    ))

                for fk in table["foreign_keys"]:
                    session.add(SchemaRelationship(
                        table_id=schema_table.id,
                        column_name=fk["column"],
                        references_table=fk["references_table"],
                        references_column=fk["references_column"],
                    ))


async def get_stored_schema(tenant_id: int, database_connection_id: int):
    async with AsyncSessionLocal() as session:
        tables_result = await session.exec(
            select(SchemaTable).where(
                SchemaTable.tenant_id == tenant_id,
                SchemaTable.database_connection_id == database_connection_id,
            )
        )
        tables = tables_result.all()

        output = []
        for t in tables:
            cols_result = await session.exec(select(SchemaColumn).where(SchemaColumn.table_id == t.id))
            cols = cols_result.all()
            rels_result = await session.exec(select(SchemaRelationship).where(SchemaRelationship.table_id == t.id))
            rels = rels_result.all()
            output.append({
                "name": t.table_name,
                "columns": [
                    {"name": c.column_name, "type": c.data_type, "is_primary_key": c.is_primary_key}
                    for c in cols
                ],
                "foreign_keys": [
                    {"column": r.column_name, "references_table": r.references_table, "references_column": r.references_column}
                    for r in rels
                ],
            })
        return output
    


async def create_conversation_state(
    tenant_id: int,
    database_connection_id: int,
    original_question: str,
    intent: str,
    entity: str,
    metric: Optional[str],
    status: str,
    clarification_question: Optional[str] = None,
) -> ConversationState:
    async with AsyncSessionLocal() as session:
        state = ConversationState(
            tenant_id=tenant_id,
            database_connection_id=database_connection_id,
            original_question=original_question,
            intent=intent,
            entity=entity,
            metric=metric,
            clarification_question=clarification_question,
            status=status,
        )
        session.add(state)
        await session.commit()
        await session.refresh(state)
        return state


async def get_conversation_state(conversation_id: int) -> Optional[ConversationState]:
    async with AsyncSessionLocal() as session:
        return await session.get(ConversationState, conversation_id)


async def complete_conversation_state(
    conversation_id: int, metric: str, final_question: str
) -> ConversationState:
    async with AsyncSessionLocal() as session:
        state = await session.get(ConversationState, conversation_id)
        if state is None:
            raise ValueError("Conversation state not found")
        state.metric = metric
        state.final_question = final_question
        state.status = "COMPLETE"
        session.add(state)
        await session.commit()
        await session.refresh(state)
        return state
    
    


def _build_table_document(table: dict) -> str:
    """Turns a table's schema info into a natural-language document for embedding."""
    lines = [f"Table: {table['name']}", "", f"Description: Contains {table['name']} data."]
    lines.append("")
    lines.append("Columns:")
    for col in table["columns"]:
        lines.append(f"- {col['name']} ({col['type']})")
    if table["foreign_keys"]:
        lines.append("")
        lines.append("Relationships:")
        for fk in table["foreign_keys"]:
            lines.append(
                f"- {table['name']}.{fk['column']} -> {fk['references_table']}.{fk['references_column']}"
            )
    return "\n".join(lines)


async def store_schema_embeddings(tenant_id: int, database_connection_id: int, tables_data: list[dict]):
    async with AsyncSessionLocal() as session:
        async with session.begin():
            old = (await session.exec(
                select(SchemaEmbedding).where(
                    SchemaEmbedding.database_connection_id == database_connection_id
                )
            )).all()
            for row in old:
                await session.delete(row)
            await session.flush()

            for table in tables_data:
                document = _build_table_document(table)
                vector = embed_text(document)
                session.add(SchemaEmbedding(
                    tenant_id=tenant_id,
                    database_connection_id=database_connection_id,
                    table_name=table["name"],
                    document_text=document,
                    embedding=vector,
                ))


import numpy as np


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    a_arr = np.array(a)
    b_arr = np.array(b)
    denom = (np.linalg.norm(a_arr) * np.linalg.norm(b_arr))
    if denom == 0:
        return 0.0
    return float(np.dot(a_arr, b_arr) / denom)


async def retrieve_relevant_tables(
    tenant_id: int, database_connection_id: int, question: str, top_k: int = 4
) -> list[str]:
    """Returns the names of the top_k most relevant tables for the question, via cosine similarity computed in Python."""
    query_vector = embed_text(question)

    async with AsyncSessionLocal() as session:
        result = await session.exec(
            select(SchemaEmbedding).where(
                SchemaEmbedding.tenant_id == tenant_id,
                SchemaEmbedding.database_connection_id == database_connection_id,
            )
        )
        rows = result.all()

    scored = [
        (row.table_name, _cosine_similarity(query_vector, row.embedding))
        for row in rows
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [name for name, _ in scored[:top_k]]