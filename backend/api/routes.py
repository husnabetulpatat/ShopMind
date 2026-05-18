import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.graph.orchestrator import run_analysis
from backend.db.database import get_db
from backend.db.models import SearchHistory, User
from backend.api.auth import get_optional_user

router = APIRouter(prefix="/api")


class AnalyzeRequest(BaseModel):
    query: str
    session_id: str = ""


@router.post("/analyze")
async def analyze(
    req: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    session_id = req.session_id or str(uuid.uuid4())
    result = await run_analysis(req.query, session_id)

    # Giriş yapmış kullanıcının aramasını kaydet
    if current_user and result.get("decision"):
        decision = result["decision"]
        summary = f"{decision.get('action', '')} — {decision.get('recommended', {}).get('name', '')[:60] if decision.get('recommended') else ''}"
        history = SearchHistory(
            user_id=current_user.id,
            query=req.query,
            result_summary=summary,
        )
        db.add(history)
        await db.commit()

    return {
        "session_id": session_id,
        "products": result["products"],
        "decision": result["decision"],
        "budget": result.get("budget"),
        "trace": result["trace"],
        "errors": result["errors"],
        "meta": {
            "category": result["product_category"],
            "use_case": result["use_case"],
            "priority": result["priority"],
        },
    }
