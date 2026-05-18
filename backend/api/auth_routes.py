from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.database import get_db
from backend.db.models import User, SearchHistory
from backend.api.auth import hash_password, verify_password, create_access_token, get_current_user

auth_router = APIRouter(prefix="/api/auth")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@auth_router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı")
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user.email, "full_name": user.full_name},
    }


@auth_router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user.email, "full_name": user.full_name},
    }


@auth_router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"email": user.email, "full_name": user.full_name}


@auth_router.get("/history")
async def history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SearchHistory)
        .where(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc())
        .limit(20)
    )
    items = result.scalars().all()
    return [
        {
            "id": i.id,
            "query": i.query,
            "result_summary": i.result_summary,
            "decision_action": i.decision_action,
            "recommended_name": i.recommended_name,
            "recommended_price": i.recommended_price,
            "products": i.products_json,
            "decision": i.decision_json,
            "budget": i.budget_json,
            "date": i.created_at.isoformat(),
        }
        for i in items
    ]
