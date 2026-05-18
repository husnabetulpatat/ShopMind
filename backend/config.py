import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://shopmind:shopmind@localhost:5432/shopmind")
TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml"
CACHE_TTL = 3600
