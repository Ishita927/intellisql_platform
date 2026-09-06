from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from urllib.parse import quote_plus
from fastapi import APIRouter, Depends, HTTPException

from ..schemas import DatabaseTestRequest, DatabaseTestResponse
from ..models import User
from .auth import get_current_user
from ..schemas import DatabaseConnectionCreate, DatabaseConnectionRead
from .. import crud
from sqlalchemy import inspect as sa_inspect
from ..schemas import SchemaScanResponse, TableSchema, ColumnInfo, ForeignKeyInfo
from ..security import decrypt_value
from .. import crud

router = APIRouter(prefix="/databases", tags=["databases"])


@router.post("/test", response_model=DatabaseTestResponse)
async def test_connection(
    payload: DatabaseTestRequest,
    current_user: User = Depends(get_current_user),
):
    # tenant_id comes from the JWT, not the request body — never trust the client for this
    tenant_id = current_user.tenant_id

    encoded_password = quote_plus(payload.password)
    test_url = (
        f"postgresql+asyncpg://{payload.username}:{encoded_password}"
        f"@{payload.host}:{payload.port}/{payload.database_name}"
    )

    test_engine = create_async_engine(test_url)
    try:
        async with test_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return DatabaseTestResponse(
            success=True,
            message=f"Successfully connected to '{payload.database_name}' for tenant {tenant_id}",
        )
    except Exception as e:
        return DatabaseTestResponse(success=False, message=f"Connection failed: {str(e)}")
    finally:
        await test_engine.dispose()
        

@router.post("/", response_model=DatabaseConnectionRead)
async def save_database_connection(
    payload: DatabaseConnectionCreate,
    current_user: User = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id  # from JWT — never trust a client-supplied tenant_id

    # re-test the connection before saving, so a broken credential never gets persisted
    encoded_password = quote_plus(payload.password)
    test_url = (
        f"postgresql+asyncpg://{payload.username}:{encoded_password}"
        f"@{payload.host}:{payload.port}/{payload.database_name}"
    )
    test_engine = create_async_engine(test_url)
    try:
        async with test_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection test failed: {str(e)}")
    finally:
        await test_engine.dispose()

    connection = await crud.create_database_connection(
        tenant_id=tenant_id,
        host=payload.host,
        port=payload.port,
        database_name=payload.database_name,
        username=payload.username,
        password=payload.password,
    )
    return connection


def _reflect_schema(sync_conn) -> list[dict]:
    """Runs inside run_sync — sync_conn is a plain sync Connection."""
    inspector = sa_inspect(sync_conn)
    tables_data = []

    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        pk_constraint = inspector.get_pk_constraint(table_name)
        pk_columns = set(pk_constraint.get("constrained_columns", []))
        fks = inspector.get_foreign_keys(table_name)

        column_infos = [
            {
                "name": col["name"],
                "type": str(col["type"]),
                "is_primary_key": col["name"] in pk_columns,
            }
            for col in columns
        ]

        fk_infos = [
            {
                "column": fk["constrained_columns"][0],
                "references_table": fk["referred_table"],
                "references_column": fk["referred_columns"][0],
            }
            for fk in fks
            if fk.get("constrained_columns") and fk.get("referred_columns")
        ]

        tables_data.append(
            {"name": table_name, "columns": column_infos, "foreign_keys": fk_infos}
        )

    return tables_data


@router.post("/{database_id}/scan-schema", response_model=SchemaScanResponse)
async def scan_schema(
    database_id: int,
    current_user: User = Depends(get_current_user),
):
    connection = await crud.get_database_connection(database_id)
    if connection is None:
        raise HTTPException(status_code=404, detail="Database connection not found")

    # enforce tenant isolation — a user can only scan their own tenant's connections
    if connection.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this connection")

    password = decrypt_value(connection.encrypted_password)
    encoded_password = quote_plus(password)
    company_db_url = (
        f"postgresql+asyncpg://{connection.username}:{encoded_password}"
        f"@{connection.host}:{connection.port}/{connection.database_name}"
    )

    company_engine = create_async_engine(company_db_url)
    try:
        async with company_engine.connect() as conn:
            tables_data = await conn.run_sync(_reflect_schema)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Schema scan failed: {str(e)}")
    finally:
        await company_engine.dispose()

    tables = [
        TableSchema(
            name=t["name"],
            columns=[ColumnInfo(**c) for c in t["columns"]],
            foreign_keys=[ForeignKeyInfo(**fk) for fk in t["foreign_keys"]],
        )
        for t in tables_data
    ]

    # persist the scanned schema into schema_tables / schema_columns / schema_relationships
    await crud.store_schema(
        tenant_id=current_user.tenant_id,
        database_connection_id=database_id,
        tables_data=tables_data,
    )

    return SchemaScanResponse(database_id=database_id, tables=tables)

@router.get("/{database_id}/schema", response_model=SchemaScanResponse)
async def get_saved_schema(
    database_id: int,
    current_user: User = Depends(get_current_user),
):
    connection = await crud.get_database_connection(database_id)
    if connection is None or connection.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Database connection not found")

    tables_data = await crud.get_stored_schema(current_user.tenant_id, database_id)
    tables = [
        TableSchema(
            name=t["name"],
            columns=[ColumnInfo(**c) for c in t["columns"]],
            foreign_keys=[ForeignKeyInfo(**fk) for fk in t["foreign_keys"]],
        )
        for t in tables_data
    ]
    return SchemaScanResponse(database_id=database_id, tables=tables)

from typing import List
from ..schemas import DatabaseConnectionRead

@router.get("/", response_model=List[DatabaseConnectionRead])
async def list_database_connections(
    current_user: User = Depends(get_current_user),
):
    return await crud.get_database_connections_for_tenant(current_user.tenant_id)