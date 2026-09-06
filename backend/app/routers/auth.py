from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlmodel import select

from ..schemas import RegisterRequest, RegisterResponse, LoginRequest, TokenResponse, UserRead
from ..database import AsyncSessionLocal
from ..models import User
from .. import crud
from ..security import verify_password, create_access_token, decode_access_token
from ..models import Tenant
from ..models import User, UserRole

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


@router.post("/register", response_model=RegisterResponse)
async def register(payload: RegisterRequest):
    async with AsyncSessionLocal() as session:
        result = await session.exec(select(User).where(User.email == payload.email))
        if result.first():
            raise HTTPException(status_code=400, detail="Email already registered")

    tenant, user = await crud.register_tenant_with_admin(
        company_name=payload.company_name,
        name=payload.name,
        email=payload.email,
        password=payload.password,
    )
    return RegisterResponse(tenant=tenant, user=user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await crud.get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(
        data={"user_id": user.id, "tenant_id": user.tenant_id, "role": user.role.value}
    )
    return TokenResponse(access_token=token)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    async with AsyncSessionLocal() as session:
        user = await session.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    
async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only admins can perform this action")
    return current_user


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=RegisterResponse)
async def register(payload: RegisterRequest):
    async with AsyncSessionLocal() as session:
        result = await session.exec(select(User).where(User.email == payload.email))
        if result.first():
            raise HTTPException(status_code=400, detail="Email already registered")

        result = await session.exec(select(Tenant).where(Tenant.name == payload.company_name))
        if result.first():
            raise HTTPException(status_code=400, detail="Company name already registered")

    tenant, user = await crud.register_tenant_with_admin(
        company_name=payload.company_name,
        name=payload.name,
        email=payload.email,
        password=payload.password,
    )
    return RegisterResponse(tenant=tenant, user=user)