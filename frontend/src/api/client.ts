const API_BASE = '/api';

export interface AiOpinionRequest {
  question: string;
  context?: string;
  symbol?: string;
}

export interface Source {
  wikipedia: { title: string; summary: string }[];
  polymarket: { question: string; yes_price: string | null; no_price: string | null; volume: string | null }[];
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
}

export interface AiOpinionResponse {
  confidence_score: number;
  sentiment: string;
  reasoning: string;
  question: string;
  symbol: string | null;
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
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
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
