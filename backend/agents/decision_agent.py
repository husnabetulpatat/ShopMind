import json
import asyncio
from google import genai
from backend.config import GEMINI_API_KEY
from backend.graph.state import ShopMindState

_client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM = """Sen bir akıllı alışveriş danışmanısın. Verilen ürün listesi, bütçe ve kullanım amacına göre en iyi kararı ver.
SADECE JSON döndür:
{
  "action": "buy_now|wait|consider_alternative",
  "recommended_index": number (ürün listesindeki index, 0'dan başlar),
  "reason": "string (Türkçe, 2-3 cümle, net gerekçe)",
  "wait_days": number veya null,
  "expected_drop_pct": number veya null,
  "score_breakdown": {
    "price_score": 0-10,
    "quality_score": 0-10,
    "timing_score": 0-10
  }
}"""


def _product_summary(p: dict, idx: int) -> str:
    return (
        f"[{idx}] {p['name']} | {p['price']:,.0f} TL | {p['platform']} | "
        f"Puan: {p['rating']}/5 | Duygu: {p['sentiment_label']} ({p['sentiment_score']:.2f}) | "
        f"Trend: {p['price_trend']} ({p['price_change_pct']:+.1f}%)"
    )


async def _call_with_retry(prompt: str, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            response = _client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait = (attempt + 1) * 10
                await asyncio.sleep(wait)
                continue
            raise e
    raise Exception("Max retries exceeded")


async def decision_agent(state: ShopMindState) -> ShopMindState:
    if not state.get("products"):
        state["decision"] = {
            "action": "consider_alternative",
            "recommended": None,
            "reason": "Uygun ürün bulunamadı. Arama kriterlerini genişletmeyi deneyin.",
            "wait_days": None,
            "expected_drop_pct": None,
        }
        state["trace"].append({"agent": "decision", "status": "no_products", "summary": "Ürün bulunamadı"})
        return state

    try:
        budget_info = ""
        if state.get("budget"):
            b = state["budget"]
            budget_info = f"Bütçe: {b['stated_budget']:,.0f} TL"
            if b["installment_months"] > 0:
                budget_info += f" ({b['installment_months']} taksit)"

        products_text = "\n".join(_product_summary(p, i) for i, p in enumerate(state["products"]))

        prompt = (
            f"{SYSTEM}\n\n"
            f"Kullanıcı sorgusu: {state['user_query']}\n"
            f"Kullanım amacı: {state.get('use_case', '')}\n"
            f"Öncelik: {state.get('priority', 'price')}\n"
            f"{budget_info}\n\n"
            f"Ürünler:\n{products_text}"
        )

        text = await _call_with_retry(prompt)
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)

        idx = int(data.get("recommended_index", 0))
        recommended = state["products"][idx] if 0 <= idx < len(state["products"]) else state["products"][0]

        state["decision"] = {
            "action": data.get("action", "buy_now"),
            "recommended": recommended,
            "reason": data.get("reason", ""),
            "wait_days": data.get("wait_days"),
            "expected_drop_pct": data.get("expected_drop_pct"),
            "score_breakdown": data.get("score_breakdown", {}),
        }

        action_label = {
            "buy_now": "Şimdi al",
            "wait": f"{data.get('wait_days', '?')} gün bekle",
            "consider_alternative": "Alternatif düşün",
        }.get(data.get("action", "buy_now"), "")

        state["trace"].append({
            "agent": "decision",
            "status": "done",
            "summary": f"Karar: {action_label} — {recommended['name'][:40]}",
        })

    except Exception as e:
        products = state["products"]
        best = max(products, key=lambda p: p["sentiment_score"] - (p["price"] / max(p2["price"] for p2 in products)))

        state["decision"] = {
            "action": "buy_now",
            "recommended": best,
            "reason": f"{best['name']} ürünü fiyat-performans dengesi açısından öne çıkıyor. Kullanıcı yorumları {best['sentiment_label']} yönde.",
            "wait_days": None,
            "expected_drop_pct": None,
            "score_breakdown": {
                "price_score": 7,
                "quality_score": int(best["sentiment_score"] * 10),
                "timing_score": 6,
            },
        }
        state["trace"].append({
            "agent": "decision",
            "status": "done",
            "summary": f"Karar: Şimdi al — {best['name'][:40]}",
        })

    return state
