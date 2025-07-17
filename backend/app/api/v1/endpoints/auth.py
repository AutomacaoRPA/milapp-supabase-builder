from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login do usuário"""
    # Implementação básica - expandir conforme necessário
    return LoginResponse(
        access_token="dummy_token",
        refresh_token="dummy_refresh_token"
    )

@router.post("/refresh")
async def refresh_token():
    """Renovar token de acesso"""
    # Implementação básica
    return {"access_token": "new_dummy_token"} 