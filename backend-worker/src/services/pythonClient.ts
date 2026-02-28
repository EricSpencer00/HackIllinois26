/**
 * PYTHON CLIENT SERVICE & DIRECT API HELPERS
 * Makes fetch() calls to external APIs (Groq, Finnhub, Wikipedia, Polymarket).
 * Also can proxy to the Python quant-engine if running.
 */

import type { Env } from '../index';

// ─── GROQ AI ────────────────────────────────────────────────
export async function callGroqAI(
  question: string,
  context: string,
  env: Env
): Promise<{ confidence_score: number; sentiment: string; reasoning: string }> {
  const systemPrompt = `You are an expert quantitative analyst working for a prediction market platform called BrightBet.
Analyze the user's trade/bet question using the provided context from multiple data sources.
You MUST respond with ONLY a valid JSON object in this exact format:
{"confidence_score": 75, "sentiment": "bullish", "reasoning": "Keep it under 3 sentences."}
confidence_score should be 0-100 representing how likely the event is to happen.
sentiment should be "bullish", "bearish", or "neutral".
Do not include any markdown formatting.`;

  const userPrompt = `Question: ${question}\n\nContext from data sources:\n${context}`;

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Groq API error: ${resp.status} ${errText}`);
  }

  const data: any = await resp.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';

  try {
    return JSON.parse(text);
  } catch {
    return { confidence_score: 50, sentiment: 'neutral', reasoning: text.slice(0, 200) };
  }
}

// ─── WIKIPEDIA ──────────────────────────────────────────────
export async function fetchWikipedia(query: string): Promise<{ title: string; summary: string }[]> {
  const headers = { 'User-Agent': 'BrightBet/1.0 (hackathon project; contact@brightbet.tech)', 'Accept': 'application/json' };
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json`;
    const searchResp = await fetch(searchUrl, { headers });
    const searchData: any = await searchResp.json();
    const results = searchData?.query?.search || [];

    const summaries: { title: string; summary: string }[] = [];
    for (const r of results.slice(0, 3)) {
      const title = r.title;
      const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=true&explaintext=true&format=json`;
      const summaryResp = await fetch(summaryUrl, { headers });
      const summaryData: any = await summaryResp.json();
      const pages = summaryData?.query?.pages || {};
      for (const page of Object.values(pages) as any[]) {
        const extract = page.extract || '';
        summaries.push({
          title,
          summary: extract.length > 1000 ? extract.slice(0, 1000) + '...' : extract,
        });
      }
    }
    return summaries;
  } catch (e: any) {
    return [{ title: 'Error', summary: `Wikipedia fetch failed: ${e.message}` }];
  }
}

// ─── FINNHUB ────────────────────────────────────────────────
export async function fetchFinnhubQuote(
  symbol: string,
  env: Env
): Promise<{
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
}> {
  try {
    const resp = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${env.FINNHUB_API_KEY}`
    );
    const data: any = await resp.json();
    return {
      symbol: symbol.toUpperCase(),
      price: data.c ?? null,
      change: data.d ?? null,
      changePercent: data.dp ?? null,
      high: data.h ?? null,
      low: data.l ?? null,
    };
  } catch {
    return { symbol: symbol.toUpperCase(), price: null, change: null, changePercent: null, high: null, low: null };
  }
}

export async function fetchFinnhubNews(
  symbol: string,
  env: Env
): Promise<{ headline: string; summary: string; source: string; url: string }[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const past = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const resp = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${past}&to=${today}&token=${env.FINNHUB_API_KEY}`
    );
    const data: any = await resp.json();
    return (data || []).slice(0, 5).map((a: any) => ({
      headline: a.headline || '',
      summary: (a.summary || '').slice(0, 300),
      source: a.source || '',
      url: a.url || '',
    }));
  } catch {
    return [];
  }
}

// ─── POLYMARKET ─────────────────────────────────────────────
export async function fetchPolymarketData(
  query: string
): Promise<{ question: string; yes_price: string | null; no_price: string | null; volume: string | null }[]> {
  try {
    const resp = await fetch(`https://gamma-api.polymarket.com/markets?closed=false&limit=10`);
    const markets: any[] = await resp.json();

    const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    let relevant = markets.filter((m: any) => {
      const text = ((m.question || m.title || '') + ' ' + (m.description || '')).toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });

    if (relevant.length === 0) relevant = markets.slice(0, 3);

    return relevant.slice(0, 5).map((m: any) => {
      const prices = m.outcomePrices;
      let yes_price = null;
      let no_price = null;
      if (Array.isArray(prices) && prices.length >= 2) {
        yes_price = prices[0];
        no_price = prices[1];
      }
      return {
        question: m.question || m.title || 'Unknown',
        yes_price,
        no_price,
        volume: m.volume || null,
      };
    });
  } catch {
    return [];
  }
}

// ─── TICKER EXTRACTION ─────────────────────────────────────
export function extractTicker(question: string): string | null {
  const tickerMatch = question.match(/\$([A-Z]{1,5})/i);
  if (tickerMatch) return tickerMatch[1].toUpperCase();

  const mappings: Record<string, string> = {
    tesla: 'TSLA', apple: 'AAPL', google: 'GOOGL', alphabet: 'GOOGL',
    amazon: 'AMZN', microsoft: 'MSFT', nvidia: 'NVDA', meta: 'META',
    spacex: 'TSLA', elon: 'TSLA', musk: 'TSLA',
    bitcoin: 'COIN', crypto: 'COIN',
  };
  const lower = question.toLowerCase();
  for (const [kw, ticker] of Object.entries(mappings)) {
    if (lower.includes(kw)) return ticker;
  }
  return null;
}