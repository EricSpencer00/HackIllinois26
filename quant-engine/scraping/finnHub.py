"""
FINNHUB SCRAPER
- Interacts with: Finnhub API.
- Purpose: Fetches real-time stock quotes, company news, and financial sentiment.
- Requires: Finnhub API key (loaded from .env).
"""

import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
BASE_URL = "https://finnhub.io/api/v1"


def get_stock_quote(symbol: str) -> dict:
    """Get real-time stock quote for a symbol."""
    try:
        resp = requests.get(
            f"{BASE_URL}/quote",
            params={"symbol": symbol.upper(), "token": FINNHUB_API_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "symbol": symbol.upper(),
            "current_price": data.get("c"),
            "high": data.get("h"),
            "low": data.get("l"),
            "open": data.get("o"),
            "previous_close": data.get("pc"),
            "change": data.get("d"),
            "change_percent": data.get("dp"),
        }
    except Exception as e:
        return {"error": f"Finnhub quote failed: {str(e)}"}


def get_company_news(symbol: str, days_back: int = 7) -> list:
    """Get recent company news for a symbol."""
    today = datetime.now().strftime("%Y-%m-%d")
    past = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    try:
        resp = requests.get(
            f"{BASE_URL}/company-news",
            params={
                "symbol": symbol.upper(),
                "from": past,
                "to": today,
                "token": FINNHUB_API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        articles = resp.json()[:5]  # Top 5 articles
        return [
            {
                "headline": a.get("headline"),
                "summary": a.get("summary", "")[:300],
                "source": a.get("source"),
                "url": a.get("url"),
                "datetime": a.get("datetime"),
            }
            for a in articles
        ]
    except Exception as e:
        return [{"error": f"Finnhub news failed: {str(e)}"}]


def get_market_sentiment(symbol: str) -> str:
    """Get a quick summary of quote + news as text context."""
    quote = get_stock_quote(symbol)
    news = get_company_news(symbol)

    parts = [f"Stock Quote for {symbol.upper()}:"]
    if "error" not in quote:
        parts.append(
            f"  Price: ${quote['current_price']}, Change: {quote['change_percent']}%"
        )
    else:
        parts.append(f"  {quote['error']}")

    parts.append(f"\nRecent News for {symbol.upper()}:")
    for n in news:
        if "error" not in n:
            parts.append(f"  - {n['headline']}")
            if n.get("summary"):
                parts.append(f"    {n['summary'][:200]}")
        else:
            parts.append(f"  {n['error']}")

    return "\n".join(parts)