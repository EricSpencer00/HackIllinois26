"""
MAIN FASTAPI SERVER
- Initializes the FastAPI app.
- Defines the internal routes that the Cloudflare Worker calls.
- Orchestrates the scraping modules and the scoring module.
- Uses concurrent.futures to call Wikipedia, Finnhub, and Polymarket simultaneously.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import concurrent.futures
import re

from scoring import get_trade_confidence
from scraping.wikipedia import search_wikipedia
from scraping.finnHub import get_stock_quote, get_company_news, get_market_sentiment
from scraping.polymarket import search_markets, get_polymarket_context

app = FastAPI(title="BrightBet Quant Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TradeRequest(BaseModel):
    question: str
    context: str = ""
    symbol: Optional[str] = None


def _extract_symbol(question: str) -> Optional[str]:
    """Try to extract a stock ticker from the question."""
    match = re.search(r'\$([A-Z]{1,5})', question.upper())
    if match:
        return match.group(1)

    # Skip stock ticker extraction if a crypto keyword is detected
    crypto_keywords = [
        "monero", "xmr", "ethereum", "eth", "solana", "sol", "dogecoin", "doge",
        "cardano", "ada", "xrp", "ripple", "polkadot", "dot", "avalanche", "avax",
        "litecoin", "ltc", "chainlink", "link", "tron", "trx", "stellar", "xlm",
        "cosmos", "atom", "algorand", "algo", "fantom", "ftm", "aptos", "apt",
        "sui", "pepe", "shiba", "shib", "uniswap", "uni", "aave", "arbitrum", "arb",
    ]
    q_lower = question.lower()
    for kw in crypto_keywords:
        if kw in q_lower:
            return None

    mappings = {
        "tesla": "TSLA", "apple": "AAPL", "google": "GOOGL", "alphabet": "GOOGL",
        "amazon": "AMZN", "microsoft": "MSFT", "nvidia": "NVDA", "meta": "META",
        "netflix": "NFLX", "disney": "DIS", "amd": "AMD", "intel": "INTC",
        "coinbase": "COIN", "palantir": "PLTR", "uber": "UBER",
        "spacex": "TSLA", "elon": "TSLA", "musk": "TSLA",
        "bitcoin": "COIN", "crypto": "COIN",
    }
    for keyword, ticker in mappings.items():
        if keyword in q_lower:
            return ticker
    return None


@app.get("/")
def read_root():
    return {"status": "Quant Engine is running!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/analyze")
async def analyze_trade(request: TradeRequest):
    """Full pipeline: scrape context -> AI inference -> return confidence."""
    try:
        symbol = request.symbol or _extract_symbol(request.question)
        context_parts = []
        finnhub_ctx = None

        if request.context:
            context_parts.append(request.context)

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            wiki_future = executor.submit(search_wikipedia, request.question)
            poly_future = executor.submit(get_polymarket_context, request.question)

            if symbol:
                finn_future = executor.submit(get_market_sentiment, symbol)
                finnhub_ctx = finn_future.result(timeout=15)
                context_parts.append(finnhub_ctx)

            wiki_ctx = wiki_future.result(timeout=15)
            poly_ctx = poly_future.result(timeout=15)

            context_parts.append(wiki_ctx)
            context_parts.append(poly_ctx)

        full_context = "\n\n".join(context_parts)
        result = get_trade_confidence(request.question, full_context)
        result["sources"] = {
            "wikipedia": wiki_ctx[:500] if wiki_ctx else None,
            "polymarket": poly_ctx[:500] if poly_ctx else None,
            "finnhub": finnhub_ctx[:500] if symbol and finnhub_ctx else None,
        }
        result["question"] = request.question
        result["symbol"] = symbol
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scrape")
async def scrape_only(question: str):
    """Just scrape context without AI inference."""
    symbol = _extract_symbol(question)
    data = {"wikipedia": None, "finnhub": None, "polymarket": None}

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        wiki_future = executor.submit(search_wikipedia, question)
        poly_future = executor.submit(search_markets, question)

        data["wikipedia"] = wiki_future.result(timeout=15)
        data["polymarket"] = poly_future.result(timeout=15)

        if symbol:
            quote_future = executor.submit(get_stock_quote, symbol)
            news_future = executor.submit(get_company_news, symbol)
            data["finnhub"] = {
                "quote": quote_future.result(timeout=15),
                "news": news_future.result(timeout=15),
            }
            data["symbol"] = symbol

    return data