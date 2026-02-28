"""
POLYMARKET SCRAPER
- Interacts with: Polymarket CLOB API (https://clob.polymarket.com).
- Purpose: Fetches live betting odds and market sentiment for specific events.
"""

import requests

API_URL = "https://clob.polymarket.com"
GAMMA_URL = "https://gamma-api.polymarket.com"


def search_markets(query: str, limit: int = 20) -> list:
    """Search Polymarket for relevant prediction markets using native text search."""
    try:
        # Extract keywords for search
        stop_words = {'will', 'what', 'when', 'where', 'which', 'would', 'could', 'should',
                      'does', 'have', 'been', 'that', 'this', 'with', 'from', 'about',
                      'the', 'and', 'for', 'not', 'but', 'are', 'was', 'were'}
        keywords = [w.lower().strip('.,!?') for w in query.split()
                    if len(w) > 2 and w.lower().strip('.,!?') not in stop_words]
        search_query = ' '.join(keywords[:5])

        # Use Gamma API's native text search
        resp = requests.get(
            f"{GAMMA_URL}/markets",
            params={"closed": "false", "limit": limit, "query": search_query},
            timeout=10,
        )
        resp.raise_for_status()
        markets = resp.json()

        # Re-score by keyword relevance
        relevant = []
        for m in markets:
            title = (m.get("question") or m.get("title") or "").lower()
            desc = (m.get("description") or "").lower()
            text = title + " " + desc
            match_count = sum(1 for kw in keywords if kw in text)
            if match_count >= 1:
                relevant.append((match_count, m))
        relevant.sort(key=lambda x: x[0], reverse=True)
        relevant = [m for _, m in relevant]

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
                "end_date": m.get("endDate"), "slug": m.get("slug"),
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