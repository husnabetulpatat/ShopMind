import httpx
import xml.etree.ElementTree as ET
from backend.config import TCMB_URL, REDIS_URL, CACHE_TTL
import json, redis

_redis = redis.from_url(REDIS_URL, decode_responses=True)


async def get_rates() -> dict:
    try:
        cached = _redis.get("tcmb:rates")
        if cached:
            return json.loads(cached)
    except redis.RedisError:
        pass # Ignore cache if Redis is down

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(TCMB_URL)
        root = ET.fromstring(r.text)
        rates = {}
        for currency in root.findall("Currency"):
            code = currency.get("CurrencyCode")
            buying = currency.findtext("ForexBuying")
            if code and buying:
                try:
                    rates[code] = float(buying)
                except ValueError:
                    pass
        try:
            _redis.setex("tcmb:rates", CACHE_TTL, json.dumps(rates))
        except redis.RedisError:
            pass
        return rates
    except Exception:
        return {"USD": 32.5, "EUR": 35.2}
