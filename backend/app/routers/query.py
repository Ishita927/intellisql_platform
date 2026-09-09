# from fastapi import APIRouter, Depends, HTTPException

# from ..schemas import (
#     GenerateSQLRequest, GenerateSQLResponse,
#     ValidateSQLRequest, ValidateSQLResponse,
# )
# from ..models import User
# from .. import crud
# from ..llm import generate_sql
# from ..sql_validator import validate_select_only, SQLValidationError
# from .auth import get_current_user

# from sqlalchemy import text
# from sqlalchemy.ext.asyncio import create_async_engine
# from urllib.parse import quote_plus

# from ..schemas import AskRequest, AskResponse
# from ..security import decrypt_value

# from ..schemas import (
#     GenerateSQLRequest, GenerateSQLResponse,
#     ValidateSQLRequest, ValidateSQLResponse,
#     AskRequest, AskResponse, ClarifyRequest,
# )
# from ..llm import generate_sql, analyze_question
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from urllib.parse import quote_plus

from ..schemas import (
    GenerateSQLRequest, GenerateSQLResponse,
    ValidateSQLRequest, ValidateSQLResponse,
    AskRequest, AskResponse, ClarifyRequest,
)
from ..models import User
from .. import crud
from ..llm import generate_sql, analyze_question
from ..sql_validator import validate_select_only, SQLValidationError
from ..security import decrypt_value
from .auth import get_current_user
from ..routers.databases import _connect_args_for_host

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/generate-sql", response_model=GenerateSQLResponse)
async def generate_sql_endpoint(
    payload: GenerateSQLRequest,
    current_user: User = Depends(get_current_user),
):
    connection = await crud.get_database_connection(payload.database_id)
    if connection is None or connection.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Database connection not found")

    tables = await crud.get_stored_schema(current_user.tenant_id, payload.database_id)
    if not tables:
        raise HTTPException(
            status_code=400,
            detail="No schema found for this connection. Run a schema scan first.",
        )

    try:
        sql = generate_sql(payload.question, tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL generation failed: {str(e)}")

    # validate before ever returning it as usable — catches unsafe LLM output early
    try:
        validated_sql = validate_select_only(sql)
    except SQLValidationError as e:
        raise HTTPException(status_code=400, detail=f"Generated SQL rejected: {str(e)}")

    return GenerateSQLResponse(question=payload.question, generated_sql=validated_sql)


@router.post("/validate-sql", response_model=ValidateSQLResponse)
async def validate_sql_endpoint(
    payload: ValidateSQLRequest,
    current_user: User = Depends(get_current_user),
):
    """Standalone validator endpoint — lets the frontend check arbitrary SQL before running it."""
    try:
        validated = validate_select_only(payload.sql)
        return ValidateSQLResponse(is_valid=True, sql=validated)
    except SQLValidationError as e:
        return ValidateSQLResponse(is_valid=False, error=str(e))
    
MAX_ROWS = 500
QUERY_TIMEOUT_SECONDS = 15


# @router.post("/ask", response_model=AskResponse)
# async def ask(
#     payload: AskRequest,
#     current_user: User = Depends(get_current_user),
# ):
#     # 1. Validate the connection belongs to this tenant
#     connection = await crud.get_database_connection(payload.database_id)
#     if connection is None or connection.tenant_id != current_user.tenant_id:
#         raise HTTPException(status_code=404, detail="Database connection not found")

#     # 2. Load stored schema
#     tables = await crud.get_stored_schema(current_user.tenant_id, payload.database_id)
#     if not tables:
#         raise HTTPException(
#             status_code=400,
#             detail="No schema found for this connection. Run a schema scan first.",
#         )

#     # 3. Generate SQL
#     try:
#         raw_sql = generate_sql(payload.question, tables)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"SQL generation failed: {str(e)}")

#     # 4. Validate — only SELECT allowed, single statement, no nested unsafe ops
#     try:
#         safe_sql = validate_select_only(raw_sql)
#     except SQLValidationError as e:
#         raise HTTPException(status_code=400, detail=f"Generated SQL rejected: {str(e)}")

#     # 5. Connect to the tenant's actual company database using the saved, decrypted credentials
#     password = decrypt_value(connection.encrypted_password)
#     encoded_password = quote_plus(password)
#     company_db_url = (
#         f"postgresql+asyncpg://{connection.username}:{encoded_password}"
#         f"@{connection.host}:{connection.port}/{connection.database_name}"
#     )

#     company_engine = create_async_engine(
#         company_db_url,
#         connect_args={"command_timeout": QUERY_TIMEOUT_SECONDS},
#     )

#     try:
#         # wrap in a read-only transaction as a defense-in-depth measure —
#         # even if something slipped past validation, the DB itself refuses writes
#         async with company_engine.connect() as conn:
#             await conn.execute(text("SET TRANSACTION READ ONLY"))
#             result = await conn.execute(text(safe_sql))
#             columns = list(result.keys())
#             raw_rows = result.fetchmany(MAX_ROWS)
#             rows = [list(row) for row in raw_rows]
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Query execution failed: {str(e)}")
#     finally:
#         await company_engine.dispose()

#     return AskResponse(
#         question=payload.question,
#         generated_sql=safe_sql,
#         columns=columns,
#         rows=rows,
#         row_count=len(rows),
#     )

async def _execute_sql_and_build_response(
    connection, safe_sql: str, question: str
) -> AskResponse:
    password = decrypt_value(connection.encrypted_password)
    encoded_password = quote_plus(password)
    company_db_url = (
        f"postgresql+asyncpg://{connection.username}:{encoded_password}"
        f"@{connection.host}:{connection.port}/{connection.database_name}"
    )
    # company_engine = create_async_engine(
    #     company_db_url, connect_args={"command_timeout": QUERY_TIMEOUT_SECONDS}
    # )
    connect_args = {**connect_args_for_host(connection.host), "command_timeout": QUERY_TIMEOUT_SECONDS}
company_engine = create_async_engine(company_db_url, connect_args=connect_args)
    try:
        async with company_engine.connect() as conn:
            await conn.execute(text("SET TRANSACTION READ ONLY"))
            result = await conn.execute(text(safe_sql))
            columns = list(result.keys())
            raw_rows = result.fetchmany(MAX_ROWS)
            rows = [list(row) for row in raw_rows]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query execution failed: {str(e)}")
    finally:
        await company_engine.dispose()

    return AskResponse(
        status="COMPLETE",
        question=question,
        generated_sql=safe_sql,
        columns=columns,
        rows=rows,
        row_count=len(rows),
    )


@router.post("/ask", response_model=AskResponse)
async def ask(
    payload: AskRequest,
    current_user: User = Depends(get_current_user),
):
    connection = await crud.get_database_connection(payload.database_id)
    if connection is None or connection.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Database connection not found")

    # tables = await crud.get_stored_schema(current_user.tenant_id, payload.database_id)
    # if not tables:
    #     raise HTTPException(
    #         status_code=400,
    #         detail="No schema found for this connection. Run a schema scan first.",
    #     )
    all_tables = await crud.get_stored_schema(current_user.tenant_id, payload.database_id)
    if not all_tables:
        raise HTTPException(
            status_code=400,
            detail="No schema found for this connection. Run a schema scan first.",
        )

    # RAG: retrieve only the relevant tables instead of sending the entire schema
    relevant_table_names = await crud.retrieve_relevant_tables(
        current_user.tenant_id, payload.database_id, payload.question
    )
    if relevant_table_names:
        tables = [t for t in all_tables if t["name"] in relevant_table_names]
    else:
        # fallback: no embeddings yet (e.g. schema scanned before RAG was added) — use full schema
        tables = all_tables

    # STEP 1: analyze the question before generating any SQL
    try:
        analysis = analyze_question(payload.question, tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question analysis failed: {str(e)}")

    if not analysis.get("is_complete", True):
        # save state, ask for clarification, do NOT generate SQL yet
        state = await crud.create_conversation_state(
            tenant_id=current_user.tenant_id,
            database_connection_id=payload.database_id,
            original_question=payload.question,
            intent=analysis.get("intent", "unknown"),
            entity=analysis.get("entity", "unknown"),
            metric=analysis.get("metric"),
            status="NEEDS_CLARIFICATION",
            clarification_question=analysis.get("clarification_question"),
        )
        return AskResponse(
            status="NEEDS_CLARIFICATION",
            question=payload.question,
            conversation_id=state.id,
            clarification_question=analysis.get("clarification_question"),
            clarification_options=analysis.get("clarification_options", []),
        )

    # STEP 2: question is complete — generate SQL directly
    try:
        raw_sql = generate_sql(payload.question, tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL generation failed: {str(e)}")

    try:
        safe_sql = validate_select_only(raw_sql)
    except SQLValidationError as e:
        raise HTTPException(status_code=400, detail=f"Generated SQL rejected: {str(e)}")

    return await _execute_sql_and_build_response(connection, safe_sql, payload.question)


@router.post("/clarify", response_model=AskResponse)
async def clarify(
    payload: ClarifyRequest,
    current_user: User = Depends(get_current_user),
):
    state = await crud.get_conversation_state(payload.conversation_id)
    if state is None or state.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if state.status == "COMPLETE":
        raise HTTPException(status_code=400, detail="This conversation is already complete")

    # combine original question + clarification answer into one final question
    final_question = f"{state.original_question} by {payload.answer}"

    updated_state = await crud.complete_conversation_state(
        conversation_id=state.id,
        metric=payload.answer,
        final_question=final_question,
    )

    connection = await crud.get_database_connection(updated_state.database_connection_id)
    if connection is None or connection.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Database connection not found")

    # /tables = await crud.get_stored_schema(current_user.tenant_id, updated_state.database_connection_id)
    all_tables = await crud.get_stored_schema(current_user.tenant_id, updated_state.database_connection_id)
    relevant_table_names = await crud.retrieve_relevant_tables(
        current_user.tenant_id, updated_state.database_connection_id, final_question
    )
    tables = [t for t in all_tables if t["name"] in relevant_table_names] if relevant_table_names else all_tables
    

    try:
        raw_sql = generate_sql(final_question, tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL generation failed: {str(e)}")

    try:
        safe_sql = validate_select_only(raw_sql)
    except SQLValidationError as e:
        raise HTTPException(status_code=400, detail=f"Generated SQL rejected: {str(e)}")

    return await _execute_sql_and_build_response(connection, safe_sql, final_question)


class RetrievalTestRequest(BaseModel):
    database_id: int
    question: str


@router.post("/debug-retrieval")
async def debug_retrieval(
    payload: RetrievalTestRequest,
    current_user: User = Depends(get_current_user),
):
    tables = await crud.retrieve_relevant_tables(
        current_user.tenant_id, payload.database_id, payload.question
    )
    return {"question": payload.question, "retrieved_tables": tables}