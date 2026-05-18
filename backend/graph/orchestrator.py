from langgraph.graph import StateGraph, END
from backend.graph.state import ShopMindState
from backend.agents.intent_agent import intent_agent
from backend.agents.finance_agent import finance_agent
from backend.agents.search_agent import search_agent
from backend.agents.sentiment_agent import sentiment_agent
from backend.agents.decision_agent import decision_agent


def build_graph():
    graph = StateGraph(ShopMindState)

    graph.add_node("intent", intent_agent)
    graph.add_node("finance", finance_agent)
    graph.add_node("search", search_agent)
    graph.add_node("sentiment", sentiment_agent)
    graph.add_node("decision", decision_agent)

    graph.set_entry_point("intent")
    graph.add_edge("intent", "finance")
    graph.add_edge("finance", "search")
    graph.add_edge("search", "sentiment")
    graph.add_edge("sentiment", "decision")
    graph.add_edge("decision", END)

    return graph.compile()


compiled_graph = build_graph()


async def run_analysis(user_query: str, session_id: str) -> ShopMindState:
    initial_state: ShopMindState = {
        "user_query": user_query,
        "session_id": session_id,
        "product_category": "",
        "product_keywords": [],
        "use_case": "",
        "priority": "price",
        "budget": None,
        "products": [],
        "sentiment_done": False,
        "decision": None,
        "trace": [],
        "errors": [],
    }
    result = await compiled_graph.ainvoke(initial_state)
    return result
