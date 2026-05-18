from backend.graph.state import ShopMindState
from backend.tools.currency import get_rates


async def finance_agent(state: ShopMindState) -> ShopMindState:
    try:
        rates = await get_rates()
        usd = rates.get("USD", 32.5)
        eur = rates.get("EUR", 35.2)

        if state.get("budget"):
            b = state["budget"]
            b["usd_rate"] = usd
            b["eur_rate"] = eur

            budget_usd = round(b["stated_budget"] / usd, 0)
            summary = (
                f"Bütçe {b['stated_budget']:,.0f} TL ≈ ${budget_usd:.0f} | "
                f"USD: {usd:.2f} | EUR: {eur:.2f}"
            )
            if b["installment_months"] > 0:
                summary += f" | {b['installment_months']} taksit = {b['monthly_payment']:,.0f} TL/ay"
        else:
            summary = f"Bütçe belirtilmedi | USD: {usd:.2f} | EUR: {eur:.2f}"

        state["trace"].append({
            "agent": "finance",
            "status": "done",
            "summary": summary,
        })

    except Exception as e:
        state["errors"].append(f"finance_agent: {str(e)}")
        state["trace"].append({"agent": "finance", "status": "error", "summary": str(e)})

    return state
