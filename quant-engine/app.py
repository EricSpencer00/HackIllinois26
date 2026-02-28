"""
MAIN FASTAPI SERVER
- Initializes the FastAPI app.
- Defines the internal routes that the Cloudflare Worker calls (e.g., /api/analyze).
- Orchestrates the scraping modules and the scoring module.
- Uses `asyncio` to call Wikipedia, Finnhub, and Polymarket simultaneously to save time.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scoring import get_trade_confidence

# Initialize the FastAPI app
app = FastAPI(title="BrightBet Quant Engine")

# Define the data structure we expect to receive
class TradeRequest(BaseModel):
    question: str
    context: str = "" # Optional extra context passed from the frontend

@app.get("/")
def read_root():
    return {"status": "Quant Engine is running!"}

@app.post("/api/analyze")
async def analyze_trade(request: TradeRequest):
    try:
        # TODO: Later, we will call your scraping functions here!
        # For now, we are just passing the question directly to Groq.
        
        # Call your AI scoring function
        result = get_trade_confidence(request.question, request.context)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))