import uuid
import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from backend.graph.state import ShopMindState
from backend.agents.intent_agent import intent_agent
from backend.agents.finance_agent import finance_agent
from backend.agents.search_agent import search_agent
from backend.agents.sentiment_agent import sentiment_agent
from backend.agents.decision_agent import decision_agent
from backend.api.auth import decode_token
from backend.db.database import AsyncSessionLocal
from backend.db.models import User, SearchHistory

ws_router = APIRouter()

AGENT_PIPELINE = [
    ("intent", intent_agent),
    ("finance", finance_agent),
    ("search", search_agent),
    ("sentiment", sentiment_agent),
    ("decision", decision_agent),
]


async def save_history(user_email: str, query: str, state: ShopMindState):
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == user_email))
            user = result.scalar_one_or_none()
            if not user:
                return
            decision = state.get("decision") or {}
            rec = decision.get("recommended") or {}
            summary = f"{decision.get('action', '')} — {rec.get('name', '')[:60]}"
            db.add(SearchHistory(
                user_id=user.id,
                query=query,
                result_summary=summary,
                decision_action=decision.get("action"),
                recommended_name=rec.get("name"),
                recommended_price=str(rec.get("price", "")),
                products_json=state.get("products", []),
                decision_json=decision,
                budget_json=state.get("budget"),
            ))
            await db.commit()
    except Exception:
        pass


@ws_router.websocket("/ws/analyze")
async def ws_analyze(websocket: WebSocket):
    await websocket.accept()
    try:
        raw = await websocket.receive_text()
        data = json.loads(raw)
        query = data.get("query", "")
        session_id = data.get("session_id") or str(uuid.uuid4())
        token = data.get("token", "")

        user_email = None
        if token:
            payload = decode_token(token)
            if payload:
                user_email = payload.get("sub")

        state: ShopMindState = {
            "user_query": query,
            "session_id": session_id,
            "product_category": "",
            "product_keywords": [],
            "use_case": "",
            "priority": "price",
            "budget": None,
            "products": [],
            "sentiment_done": False,
            "decision": None,
            "trace": [],
            "errors": [],
        }

        for agent_name, agent_fn in AGENT_PIPELINE:
            await websocket.send_json({"type": "agent_start", "agent": agent_name})
            state = await agent_fn(state)
            last_trace = state["trace"][-1] if state["trace"] else {}
            await websocket.send_json({
                "type": "agent_done",
                "agent": agent_name,
                "status": last_trace.get("status", "done"),
                "summary": last_trace.get("summary", ""),
            })

        if user_email:
            await save_history(user_email, query, state)

        await websocket.send_json({
            "type": "complete",
            "session_id": session_id,
            "products": state["products"],
            "decision": state["decision"],
            "budget": state.get("budget"),
            "trace": state["trace"],
            "errors": state["errors"],
        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
