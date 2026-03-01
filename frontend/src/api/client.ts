const API_BASE = '/api';

export interface AiOpinionRequest {
  question: string;
  context?: string;
  symbol?: string;
}

export interface Source {
  wikipedia: { title: string; summary: string }[];
  polymarket: { question: string; yes_price: string | null; no_price: string | null; volume: string | null; slug?: string | null }[];
  finnhub: {
    quote: {
      symbol: string;
      price: number | null;
      change: number | null;
      changePercent: number | null;
      high: number | null;
      low: number | null;
    };
    news: { headline: string; summary: string; source: string; url: string }[];
  } | null;
  coingecko: {
    name: string;
    symbol: string;
    price: number | null;
    change24h: number | null;
    change7d: number | null;
    marketCap: number | null;
    volume24h: number | null;
    ath: number | null;
  } | null;
  fearGreed: {
    value: number;
    label: string;
    timestamp: string;
  } | null;
  reddit: { subreddit: string; title: string; score: number; url: string; created: string }[];
  googleTrends: {
    keyword: string;
    interest: string;
    relatedQueries?: string[];
  } | null;
  fred: { series: string; label: string; value: string; date: string }[];
  technicals: {
    rsi: number | null;
    macd: number | null;
    macdSignal: number | null;
    sma50: number | null;
    sma200: number | null;
  } | null;
}

export interface AiOpinionResponse {
  confidence_score: number;
  sentiment: string;
  reasoning: string;
  question: string;
  symbol: string | null;
  cryptoId: string | null;
  sources: Source;
}

export interface PlanetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  orbitRadius: number;
}

export async function getAiOpinion(req: AiOpinionRequest): Promise<AiOpinionResponse> {
  const resp = await fetch(`${API_BASE}/get-ai-opinion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!resp.ok) {
    let message = `API error: ${resp.status}`;
    try {
      const body = await resp.json() as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // fallback to status message above
    }
    throw new Error(message);
  }
  return resp.json();
}

export async function getPlanetCategories(): Promise<PlanetCategory[]> {
  const resp = await fetch(`${API_BASE}/planet-categories`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  const data = await resp.json();
  return data.categories;
}

export async function getHealth(): Promise<{ status: string }> {
  const resp = await fetch(`${API_BASE}/health`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export interface VideoGenResponse {
  type: 'image' | 'fallback';
  imageData?: string;   // base64 data URL from CF Workers AI
  error?: string;
  prompt?: string;
  sentiment: string;
  confidence: number;
}

// ─── Candle / Chart Data ─────────────────────────────────────
export interface CandleDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LineDataPoint {
  time: string;
  value: number;
}

export interface ChartSeries {
  id: string;
  label: string;
  type: 'candlestick' | 'line';
  data: CandleDataPoint[] | LineDataPoint[];
  color: string;
}

export interface CandlesResponse {
  series: ChartSeries[];
}

export async function getCandles(params: {
  symbol?: string | null;
  cryptoId?: string | null;
  polymarketSlug?: string | null;
}): Promise<CandlesResponse> {
  const resp = await fetch(`${API_BASE}/candles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!resp.ok) return { series: [] };
  return resp.json();
}

export async function generateVideo(
  question: string,
  sentiment?: string,
  confidence?: number
): Promise<VideoGenResponse | null> {
  try {
    const resp = await fetch(`${API_BASE}/generate-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, sentiment, confidence }),
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

export interface MemeGenResponse {
  type: 'meme' | 'error';
  imageData?: string;   // base64 data URL from CF Workers AI
  error?: string;
  question: string;
  prompt?: string;
}

export async function generateMeme(question: string): Promise<MemeGenResponse | null> {
  try {
    const resp = await fetch(`${API_BASE}/generate-meme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}
