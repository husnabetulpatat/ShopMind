import json
import random
import redis
from backend.config import REDIS_URL

_redis = redis.from_url(REDIS_URL, decode_responses=True)


def record_price(product_name: str, price: float):
    key = f"price_history:{product_name[:60]}"
    history = _get_history(key)
    history.append(price)
    if len(history) > 30:
        history = history[-30:]
    _redis.set(key, json.dumps(history))


def _get_history(key: str) -> list:
    raw = _redis.get(key)
    if raw:
        return json.loads(raw)
    return []


def analyze_trend(product_name: str, current_price: float) -> dict:
    key = f"price_history:{product_name[:60]}"
    history = _get_history(key)

    if len(history) < 2:
        # Simulate realistic trend when no history — in production replace with real data
        simulated_change = random.uniform(-15, 10)
        trend = "falling" if simulated_change < -3 else ("rising" if simulated_change > 3 else "stable")
        return {
            "trend": trend,
            "change_pct": round(simulated_change, 1),
            "data_points": 0,
            "simulated": True,
        }

    oldest = history[0]
    change_pct = ((current_price - oldest) / oldest) * 100

    if change_pct < -3:
        trend = "falling"
    elif change_pct > 3:
        trend = "rising"
    else:
        trend = "stable"

    return {
        "trend": trend,
        "change_pct": round(change_pct, 1),
        "data_points": len(history),
        "simulated": False,
    }
