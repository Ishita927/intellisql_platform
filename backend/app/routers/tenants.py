from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas import TenantCreate, TenantRead
from .. import crud

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.post("/", response_model=TenantRead)
async def create_tenant(payload: TenantCreate):
    # check existing
    existing_tenants = await crud.get_all_tenants()
    existing = [t for t in existing_tenants if t.name == payload.name]
    if existing:
        raise HTTPException(status_code=400, detail="Tenant already exists")
    tenant = await crud.create_tenant(payload.name)
    return tenant

@router.get("/", response_model=List[TenantRead])
async def list_tenants():
    return await crud.get_all_tenants()