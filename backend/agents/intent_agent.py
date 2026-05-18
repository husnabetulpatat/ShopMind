import json
import asyncio
from google import genai
from backend.config import GEMINI_API_KEY
from backend.graph.state import ShopMindState

_client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM = """Sen bir e-ticaret alışveriş asistanısın. Kullanıcının sorgusundan bilgileri çıkar ve SADECE geçerli JSON döndür.

JSON formatı:
{
  "product_category": "string (ürün kategorisi, tek kelime veya iki kelime, Türkçe)",
  "product_keywords": ["string (Google Shopping'de aratılacak ana ürün adı, marka veya model adı varsa ekle, maksimum 2-3 kelime)"],
  "search_query": "string (Google Shopping'de aratılacak net sorgu, örn: 'Samsung tablet 10 inç', 'iPad 9. nesil', 'Lenovo laptop i5')",
  "use_case": "string (kimin için, ne amaçla, kısa)",
  "priority": "price|quality|speed",
  "budget": number (TL cinsinden, belirtilmemişse 0),
  "installment_months": number (taksit sayısı, belirtilmemişse 0)
}

ÖNEMLİ: search_query alanı Google Shopping'de gerçek ürün bulmak için kullanılacak. Çok genel veya soyut olmamalı. Doğrudan ürün adı veya kategorisi olmalı."""


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
                await asyncio.sleep((attempt + 1) * 10)
                continue
            raise e
    raise Exception("Max retries exceeded")


async def intent_agent(state: ShopMindState) -> ShopMindState:
    try:
        text = await _call_with_retry(f"{SYSTEM}\n\nKullanıcı sorgusu: {state['user_query']}")
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)

        state["product_category"] = data.get("product_category", "genel")
        
        # search_query varsa onu kullan, yoksa product_keywords'ü kullan
        search_query = data.get("search_query", "")
        product_keywords = data.get("product_keywords", [state["user_query"]])
        
        if search_query:
            state["product_keywords"] = [search_query] + product_keywords[:1]
        else:
            state["product_keywords"] = product_keywords
            
        state["use_case"] = data.get("use_case", "")
        state["priority"] = data.get("priority", "price")

        budget_amount = float(data.get("budget", 0))
        installment = int(data.get("installment_months", 0))

        if budget_amount > 0:
            state["budget"] = {
                "stated_budget": budget_amount,
                "installment_months": installment,
                "monthly_payment": round(budget_amount / installment, 2) if installment > 0 else budget_amount,
                "currency": "TRY",
                "usd_rate": 0.0,
                "eur_rate": 0.0,
            }

        state["trace"].append({
            "agent": "intent",
            "status": "done",
            "summary": f"{state['product_category']} aranıyor — bütçe: {budget_amount or 'belirtilmemiş'} TL",
        })

    except Exception as e:
        state["errors"].append(f"intent_agent: {str(e)}")
        state["product_category"] = "genel"
        state["product_keywords"] = [state["user_query"]]
        state["priority"] = "price"
        state["trace"].append({"agent": "intent", "status": "error", "summary": str(e)})

    return state
