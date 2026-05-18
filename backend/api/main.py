from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router
from backend.api.websocket import ws_router
from backend.api.auth_routes import auth_router
from backend.db.database import init_db
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="ShopMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization skipped: {e}")

app.include_router(router)
app.include_router(ws_router)
app.include_router(auth_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
