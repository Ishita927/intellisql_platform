# from fastapi import APIRouter, HTTPException
# from typing import List
# from ..schemas import UserCreate, UserRead
# from .. import crud

# router = APIRouter(prefix="/users", tags=["users"])

# @router.post("/", response_model=UserRead)
# async def create_user(payload: UserCreate):
#     # Very simple uniqueness check:
#     # In production, add proper DB-unique constraint checks and try/except
#     user = await crud.create_user(payload.email, payload.password, payload.tenant_id, payload.is_admin)
#     return user

# @router.get("/tenant/{tenant_id}", response_model=List[UserRead])
# async def list_users_for_tenant(tenant_id: int):
#     return await crud.get_users_for_tenant(tenant_id)

# @router.post("/", response_model=UserRead)
# async def create_user(payload: UserCreate):
#     user = await crud.create_user(
#         payload.name, payload.email, payload.password, payload.tenant_id, payload.role
#     )
#     return user

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from ..schemas import UserRead, InviteEmployeeRequest
from ..models import User
from .. import crud
from .auth import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/invite", response_model=UserRead)
async def invite_employee(
    payload: InviteEmployeeRequest,
    admin: User = Depends(require_admin),
):
    """Only an admin can invite an employee. tenant_id comes from the admin's own JWT,
    never from the request body — every invited employee automatically joins the admin's tenant."""
    existing = await crud.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await crud.create_user(
        name=payload.name,
        email=payload.email,
        password=payload.password,
        tenant_id=admin.tenant_id,  # <-- inherited from the admin, not client-supplied
        role=payload.role,
    )
    return user


@router.get("/", response_model=List[UserRead])
async def list_my_company_users(
    current_user: User = Depends(get_current_user),
):
    """Any logged-in user can see the employees of their own company only."""
    return await crud.get_users_for_tenant(current_user.tenant_id)