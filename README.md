# BrightBet ✦

**AI-Powered Trade & Prediction Analysis** — HackIllinois 2026

> "Is this trade good or not?" → Get a confidence score backed by real data.

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

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Heartbeat check |
| `/api/get-ai-opinion` | POST | Full analysis: scrape + AI inference |
| `/api/planet-categories` | GET | Data source metadata for UI |
| `/api/visualize` | GET/POST | Raw scraped data for visualization |

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



##Devpost link:
https://devpost.com/software/brightbet

