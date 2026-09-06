from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from .models import UserRole

class TenantCreate(BaseModel):
    name: str


class TenantRead(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.analyst
    tenant_id: Optional[int] = None


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    tenant_id: Optional[int]
    model_config = ConfigDict(from_attributes=True)
    
class RegisterRequest(BaseModel):
    company_name: str
    name: str
    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    tenant: TenantRead
    user: UserRead
    

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    
class DatabaseTestRequest(BaseModel):
    host: str
    port: int = 5432
    database_name: str
    username: str
    password: str


class DatabaseTestResponse(BaseModel):
    success: bool
    message: str
    
class DatabaseConnectionCreate(BaseModel):
    host: str
    port: int = 5432
    database_name: str
    username: str
    password: str


class DatabaseConnectionRead(BaseModel):
    id: int
    tenant_id: int
    host: str
    port: int
    database_name: str
    username: str
    model_config = ConfigDict(from_attributes=True)
    # note: encrypted_password intentionally excluded from the response
    
class ColumnInfo(BaseModel):
    name: str
    type: str
    is_primary_key: bool = False


class ForeignKeyInfo(BaseModel):
    column: str
    references_table: str
    references_column: str


class TableSchema(BaseModel):
    name: str
    columns: list[ColumnInfo]
    foreign_keys: list[ForeignKeyInfo] = []


class SchemaScanResponse(BaseModel):
    database_id: int
    tables: list[TableSchema]
    
class GenerateSQLRequest(BaseModel):
    database_id: int
    question: str


class GenerateSQLResponse(BaseModel):
    question: str
    generated_sql: str
    
class ValidateSQLRequest(BaseModel):
    sql: str


class ValidateSQLResponse(BaseModel):
    is_valid: bool
    sql: Optional[str] = None
    error: Optional[str] = None
    
class AskRequest(BaseModel):
    database_id: int
    question: str


class AskResponse(BaseModel):
    question: str
    generated_sql: str
    columns: list[str]
    rows: list[list]
    row_count: int

class AskResponse(BaseModel):
    # extended from Step 17 — now covers both outcomes
    status: str  # "COMPLETE" or "NEEDS_CLARIFICATION"
    question: str
    generated_sql: Optional[str] = None
    columns: Optional[list[str]] = None
    rows: Optional[list[list]] = None
    row_count: Optional[int] = None
    conversation_id: Optional[int] = None
    clarification_question: Optional[str] = None
    clarification_options: Optional[list[str]] = None


class ClarifyRequest(BaseModel):
    conversation_id: int
    answer: str
    
class InviteEmployeeRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.analyst