import httpx
import json
import redis
from backend.config import SERPER_API_KEY, REDIS_URL, CACHE_TTL

_redis = redis.from_url(REDIS_URL, decode_responses=True)
SERPER_SHOPPING_URL = "https://google.serper.dev/shopping"


async def search_products(keywords: list[str], budget: float, limit: int = 6) -> list[dict]:
    # Ana sorgu: ilk keyword (search_query) kullan
    main_query = keywords[0] if keywords else ""
    cache_key = f"v4:{main_query[:80]}:{int(budget)}"
    cached = _redis.get(cache_key)
    if cached:
        return json.loads(cached)

    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
    all_products = []

    # Deneme 1: Ana sorgu
    products = await _fetch_shopping(main_query, headers, budget)
    all_products.extend(products)

    # Deneme 2: Yeterli sonuç yoksa ikinci keyword ile dene
    if len(all_products) < 3 and len(keywords) > 1:
        products2 = await _fetch_shopping(keywords[1], headers, budget)
        seen = {p["name"] for p in all_products}
        all_products.extend([p for p in products2 if p["name"] not in seen])

    # Bütçeye göre filtrele ve sırala
    if budget < 999999:
        # Bütçenin %10'undan ucuz olanları da ele (çok ucuz = alakasız olabilir)
        min_price = budget * 0.1
        all_products = [p for p in all_products if p["price"] >= min_price]
        all_products = sorted(all_products, key=lambda p: abs(p["price"] - budget))

    result = all_products[:limit]
    if result:
        _redis.setex(cache_key, CACHE_TTL, json.dumps(result))
    return result


async def _fetch_shopping(query: str, headers: dict, budget: float) -> list[dict]:
    if not query:
        return []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(SERPER_SHOPPING_URL, headers=headers, json={
                "q": query,
                "gl": "tr",
                "hl": "tr",
                "num": 20,
            })
        items = r.json().get("shopping", [])
        return _parse_items(items, budget)
    except Exception:
        return []


def _parse_items(items: list, budget: float) -> list[dict]:
    results = []
    for item in items:
        price = _parse_price(item.get("price", ""))
        if price <= 0:
            continue
        # Bütçenin 3 katından pahalıysa atla
        if budget < 999999 and price > budget * 3:
            continue
        results.append({
            "name": item.get("title", ""),
            "price": price,
            "url": item.get("link", ""),
            "platform": _extract_platform(item.get("source", "")),
            "rating": float(item.get("rating", 0) or 0),
            "review_count": int(item.get("ratingCount", 0) or 0),
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "price_trend": "stable",
            "price_change_pct": 0.0,
        })
    return results


def _parse_price(raw: str) -> float:
    cleaned = (raw.replace(".", "").replace(",", ".")
               .replace("₺", "").replace("TL", "")
               .replace("$", "").replace("€", "")
               .replace(" ", "").strip())
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _extract_platform(source: str) -> str:
    source_lower = source.lower()
    for name in ["trendyol", "hepsiburada", "amazon", "n11", "gittigidiyor",
                 "çiçeksepeti", "teknosa", "vatan", "mediamarkt", "boyner",
                 "morhipo", "lcwaikiki", "migros", "a101", "bim", "incehesap",
                 "akakce", "cimri", "epey"]:
        if name in source_lower:
            return name.capitalize()
    return source or "Web"
