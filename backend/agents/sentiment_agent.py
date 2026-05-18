import json
import asyncio
from google import genai
from backend.config import GEMINI_API_KEY
from backend.graph.state import ShopMindState

_client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM = """Bir ürün değerlendirmesi yap. Ürün adı ve özelliklerine göre Türk kullanıcıların bu ürün hakkında genel görüşünü tahmin et.
SADECE JSON döndür:
{
  "sentiment_score": 0.0-1.0 (0=çok kötü, 1=mükemmel),
  "sentiment_label": "positive|neutral|negative",
  "key_positives": ["madde1", "madde2"],
  "key_negatives": ["madde1"]
}"""


async def _analyze_product(product: dict, delay: float = 0) -> dict:
    if delay > 0:
        await asyncio.sleep(delay)
    prompt = f"{SYSTEM}\n\nÜrün: {product['name']}\nFiyat: {product['price']} TL\nPlatform: {product['platform']}\nPuan: {product['rating']}/5 ({product['review_count']} yorum)"
    for attempt in range(3):
        try:
            response = _client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            data = json.loads(text)
            return {
                "sentiment_score": float(data.get("sentiment_score", 0.5)),
                "sentiment_label": data.get("sentiment_label", "neutral"),
                "key_positives": data.get("key_positives", []),
                "key_negatives": data.get("key_negatives", []),
            }
        except Exception as e:
            if "429" in str(e) and attempt < 2:
                await asyncio.sleep((attempt + 1) * 12)
                continue
            break
    return {"sentiment_score": 0.5, "sentiment_label": "neutral", "key_positives": [], "key_negatives": []}


async def sentiment_agent(state: ShopMindState) -> ShopMindState:
    if not state.get("products"):
        state["sentiment_done"] = True
        state["trace"].append({"agent": "sentiment", "status": "skipped", "summary": "Analiz edilecek ürün yok"})
        return state

    try:
        # Sıralı çağrı — 3 saniye arayla, rate limit aşımını önler
        results = []
        for i, product in enumerate(state["products"]):
            delay = i * 3
            result = await _analyze_product(product, delay=delay)
            results.append(result)

        for product, result in zip(state["products"], results):
            product["sentiment_score"] = result["sentiment_score"]
            product["sentiment_label"] = result["sentiment_label"]
            product["key_positives"] = result.get("key_positives", [])
            product["key_negatives"] = result.get("key_negatives", [])

        state["sentiment_done"] = True
        positive_count = sum(1 for p in state["products"] if p["sentiment_label"] == "positive")
        state["trace"].append({
            "agent": "sentiment",
            "status": "done",
            "summary": f"{len(state['products'])} ürün analiz edildi | {positive_count} pozitif",
        })

    except Exception as e:
        state["errors"].append(f"sentiment_agent: {str(e)}")
        state["sentiment_done"] = True
        state["trace"].append({"agent": "sentiment", "status": "error", "summary": str(e)})

    return state
