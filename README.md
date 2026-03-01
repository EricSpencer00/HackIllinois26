# BrightBet ✦

**AI-Powered Trade & Prediction Analysis** — HackIllinois 2026

> "Is this trade good or not?" → Get a confidence score backed by real data.

[brightbet.tech/docs](https://brightbet.tech/docs)

## Quick Test

```
curl brightbet.tech/api/health
```
`
{"status":"healthy","service":"BrightBet API","timestamp":"2026-03-01T08:41:32.357Z"}`                                  

## What It Does

Ask any trade or prediction question. BrightBet scrapes context from multiple live data sources, feeds it to an AI, and returns a confidence score with reasoning.

**Data Sources (Planets):**
- 🧠 **AI Analysis** — Groq LLM (Llama 3.3 70B) inference with structured output
- 📈 **Market Data** — Real-time stock quotes & news from Finnhub
- 🎯 **Prediction Markets** — Live betting odds from Polymarket
- 📚 **Knowledge Base** — Background context from Wikipedia

## Architecture

```
Frontend (React/Vite) → Cloudflare Worker → External APIs
                                           ├── Groq AI
                                           ├── Finnhub
                                           ├── Polymarket
                                           └── Wikipedia
```

## Quick Start

```bash
# 1. Backend Worker (port 8787)
cd backend-worker && npm install && npx wrangler dev --port 8787

# 2. Frontend (port 5173, proxies /api to worker)
cd frontend && npm install && npx vite --port 5173

# Open http://localhost:5173

# 3. Python Engine
cd quant-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Features

- 🤖 **AI-Powered Analysis** — Groq Llama 3.3 70B returns confidence score + reasoning
- 📊 **Multi-Source Data** — Parallel scraping from Finnhub, Polymarket, Wikipedia
- 🎨 **AI-Generated Visuals** — Stable Diffusion XL meme/planet images via Cloudflare Workers AI
- 💳 **Premium Features** — HTTP 402 payment flow with Stripe x402 for unlocking meme generation
- 📚 **Live Documentation** — Sidebar-based docs with copy-to-clipboard code examples
- ⚡ **Edge Computing** — Serverless architecture on Cloudflare Workers (zero cold start)

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Heartbeat check |
| `/api/get-ai-opinion` | POST | Full analysis: scrape data sources + run LLM inference |
| `/api/planet-categories` | GET | Data source names for UI rendering |
| `/api/visualize` | GET/POST | Raw scraped data for charts/visualization |
| `/api/generate-image` | GET/POST | AI-generated planet visual or meme (with `?type=meme`) |
| `/api/rickroll` | GET | HTTP 402 payment flow for premium features |

## Usage Examples

### Full AI Analysis (POST)
```bash
curl -X POST http://localhost:5173/api/get-ai-opinion \
  -H "Content-Type: application/json" \
  -d '{"question": "Will Tesla stock hit $500 by 2026?"}'
```

**Response (200):**
```json
{
  "question": "Will Tesla stock hit $500 by 2026?",
  "confidence": 0.62,
  "reasoning": "Tesla at $300, needs 67% growth. Historical returns average 35% annually...",
  "sources": {
    "stocks": {"TSLA": {"price": 305.2, "change": 2.1}},
    "markets": {"Tesla $500 by 2026": "45% odds"},
    "wiki": "Founded 2003, ~1M vehicles/year..."
  },
  "sentiment": "neutral"
}
```

**Error Response (400, missing question):**
```json
{
  "error": "Missing required field: question"
}
```

### Generate Visualization
```bash
# Planet visual
curl "http://localhost:5173/api/generate-image?question=bullish_tech"

# Premium meme with payment
curl "http://localhost:5173/api/rickroll?question=funny_loss_meme"
# Returns: HTTP 402 Payment Required with Stripe checkout URL
```

### Get Data Categories
```bash
curl http://localhost:5173/api/planet-categories
# Response: ["AI Analysis", "Market Data", "Prediction Markets", "Knowledge Base"]
```

## Documentation

Full API documentation with copy-to-clipboard examples:
**Hosted at**: `http://localhost:5173/docs`

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, CSS (space theme)
- **Backend**: Cloudflare Workers (TypeScript)
- **AI**: Groq API (Llama 3.3 70B Versatile)
- **Data**: Finnhub, Polymarket, Wikipedia APIs
- **Python Engine**: FastAPI + concurrent scraping (standalone)

## Deploy

```bash
# Worker → Cloudflare Workers
cd backend-worker && npx wrangler deploy

# Frontend → Cloudflare Pages (via GitHub)
```

## Submission


##Devpost link:
https://devpost.com/software/brightbet

