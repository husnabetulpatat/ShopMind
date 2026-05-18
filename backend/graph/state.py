from typing import TypedDict, Optional, List, Any


class Product(TypedDict):
    name: str
    price: float
    url: str
    platform: str
    rating: float
    review_count: int
    sentiment_score: float
    sentiment_label: str
    price_trend: str       # "rising" | "falling" | "stable"
    price_change_pct: float


class BudgetInfo(TypedDict):
    stated_budget: float
    installment_months: int
    monthly_payment: float
    currency: str
    usd_rate: float
    eur_rate: float


class Decision(TypedDict):
    action: str            # "buy_now" | "wait" | "consider_alternative"
    recommended: Optional[Product]
    reason: str
    wait_days: Optional[int]
    expected_drop_pct: Optional[float]


class ShopMindState(TypedDict):
    # input
    user_query: str
    session_id: str

    # intent agent output
    product_category: str
    product_keywords: List[str]
    use_case: str
    priority: str          # "price" | "quality" | "speed"

    # finance agent output
    budget: Optional[BudgetInfo]

    # search agent output
    products: List[Product]

    # sentiment agent output (enriches products in-place)
    sentiment_done: bool

    # decision agent output
    decision: Optional[Decision]

    # streaming trace for frontend
    trace: List[dict]      # [{"agent": "intent", "status": "done", "summary": "..."}]

    # errors
    errors: List[str]
