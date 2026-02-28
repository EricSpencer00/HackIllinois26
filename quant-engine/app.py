"""
MAIN FASTAPI SERVER
- Initializes the FastAPI app.
- Defines the internal routes that the Cloudflare Worker calls (e.g., /api/analyze).
- Orchestrates the scraping modules and the scoring module.
- Uses `asyncio` to call Wikipedia, Finnhub, and Polymarket simultaneously to save time.
"""