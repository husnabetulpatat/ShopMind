from backend.graph.state import ShopMindState
from backend.tools.product_scraper import search_products
from backend.tools.price_tracker import analyze_trend, record_price


async def search_agent(state: ShopMindState) -> ShopMindState:
    try:
        budget = state["budget"]["stated_budget"] if state.get("budget") else 999999
        keywords = state.get("product_keywords", [state["user_query"]])

        products = await search_products(keywords=keywords, budget=budget, limit=6)

        # Fallback: sadece ilk keyword ile dene
        if not products and len(keywords) > 1:
            products = await search_products(keywords=keywords[:1], budget=budget, limit=6)

        if not products:
            state["errors"].append("search_agent: ürün bulunamadı")
            state["products"] = []
            state["trace"].append({"agent": "search", "status": "empty", "summary": "Ürün bulunamadı"})
            return state

        for p in products:
            record_price(p["name"], p["price"])
            trend_data = analyze_trend(p["name"], p["price"])
            p["price_trend"] = trend_data["trend"]
            p["price_change_pct"] = trend_data["change_pct"]

        state["products"] = products
        platforms = list({p["platform"] for p in products})
        price_range = f"{min(p['price'] for p in products):,.0f} – {max(p['price'] for p in products):,.0f} TL"

        state["trace"].append({
            "agent": "search",
            "status": "done",
            "summary": f"{len(products)} ürün bulundu | {price_range} | {', '.join(platforms)}",
        })

    except Exception as e:
        state["errors"].append(f"search_agent: {str(e)}")
        state["products"] = []
        state["trace"].append({"agent": "search", "status": "error", "summary": str(e)})

    return state
