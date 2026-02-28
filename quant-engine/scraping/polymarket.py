"""
POLYMARKET SCRAPER
- Interacts with: Polymarket CLOB API (https://clob.polymarket.com).
- Purpose: Fetches live betting odds and market sentiment for specific events.
"""

import requests

API_URL = "https://clob.polymarket.com"
GAMMA_URL = "https://gamma-api.polymarket.com"


def search_markets(query: str, limit: int = 500) -> list:
    """Search Polymarket for relevant prediction markets."""
    try:
        resp = requests.get(
            f"{GAMMA_URL}/markets",
            params={"closed": "false", "limit": limit},
            timeout=10,
        )
        resp.raise_for_status()
        markets = resp.json()

        # Filter by keyword match
        query_lower = query.lower()
        keywords = query_lower.split()
        relevant = []
        for m in markets:
            title = (m.get("question") or m.get("title") or "").lower()
            desc = (m.get("description") or "").lower()
            text = title + " " + desc
            if any(kw in text for kw in keywords if len(kw) > 3):
                relevant.append(m)

        return [
            {
                "question": m.get("question") or m.get("title", "Unknown"),
                "description": (m.get("description") or "")[:200],
                "outcome_yes": m.get("outcomePrices", [None, None])[0]
                if isinstance(m.get("outcomePrices"), list) and len(m.get("outcomePrices", [])) > 0
                else m.get("bestBid"),
                "outcome_no": m.get("outcomePrices", [None, None])[1]
                if isinstance(m.get("outcomePrices"), list) and len(m.get("outcomePrices", [])) > 1
                else m.get("bestAsk"),
                "volume": m.get("volume"),
                "liquidity": m.get("liquidity"),
                "end_date": m.get("endDate"),
            }
            for m in relevant[:5]
        ]
    except Exception as e:
        return [{"error": f"Polymarket search failed: {str(e)}"}]


def get_polymarket_context(query: str) -> str:
    """Get Polymarket data as a text summary for context."""
    markets = search_markets(query)
    if not markets:
        return "No relevant Polymarket data found."

    parts = ["Polymarket Prediction Markets:"]
    for m in markets:
        if "error" in m:
            parts.append(f"  Error: {m['error']}")
            continue
        parts.append(f"  Market: {m['question']}")
        if m.get("outcome_yes"):
            parts.append(f"    YES price: {m['outcome_yes']}")
        if m.get("outcome_no"):
            parts.append(f"    NO price: {m['outcome_no']}")
        if m.get("volume"):
            parts.append(f"    Volume: ${m['volume']}")

    return "\n".join(parts)