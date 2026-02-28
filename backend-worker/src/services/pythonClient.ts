/**
 * PYTHON CLIENT SERVICE & DIRECT API HELPERS
 * Makes fetch() calls to external APIs (Groq, Finnhub, Wikipedia, Polymarket).
 * Also can proxy to the Python quant-engine if running.
 */

import type { Env } from '../index';

function resolveEnvValue(env: Env, keys: string[]): string {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

// ─── GROQ AI ────────────────────────────────────────────────
export async function callGroqAI(
  question: string,
  context: string,
  env: Env
): Promise<{ confidence_score: number; sentiment: string; reasoning: string }> {
  const groqKey = resolveEnvValue(env, ['GROQ_API_KEY', 'GROQ_KEY', 'GROQ_TOKEN']);
  if (!groqKey) {
    throw new Error('Missing GROQ API key in worker environment. Set GROQ_API_KEY as a worker secret.');
  }

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
      Authorization: `Bearer ${groqKey}`,
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
  const finnhubKey = resolveEnvValue(env, ['FINNHUB_API_KEY', 'FINNHUB_KEY', 'FINNHUB_TOKEN']);
  if (!finnhubKey) {
    return { symbol: symbol.toUpperCase(), price: null, change: null, changePercent: null, high: null, low: null };
  }

  try {
    const resp = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${finnhubKey}`
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
  const finnhubKey = resolveEnvValue(env, ['FINNHUB_API_KEY', 'FINNHUB_KEY', 'FINNHUB_TOKEN']);
  if (!finnhubKey) {
    return [];
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const past = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const resp = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${past}&to=${today}&token=${finnhubKey}`
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
    const resp = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=500');
    const markets: any[] = await resp.json();

    const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    let relevant = markets.filter((m: any) => {
      const text = ((m.question || m.title || '') + ' ' + (m.description || '')).toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });

    

    return relevant.slice(0, 5).map((m: any) => {
      let prices = m.outcomePrices;
      try {
        if (typeof prices === 'string') prices = JSON.parse(prices);
      } catch(e){}
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
        slug: m.slug || null,
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

// ─── CRYPTO EXTRACTION ─────────────────────────────────────
export function extractCryptoId(question: string): string | null {
  const mappings: Record<string, string> = {
    bitcoin: 'bitcoin', btc: 'bitcoin',
    ethereum: 'ethereum', eth: 'ethereum',
    solana: 'solana', sol: 'solana',
    dogecoin: 'dogecoin', doge: 'dogecoin',
    cardano: 'cardano', ada: 'cardano',
    xrp: 'ripple', ripple: 'ripple',
    polkadot: 'polkadot', dot: 'polkadot',
    avalanche: 'avalanche-2', avax: 'avalanche-2',
    polygon: 'matic-network', matic: 'matic-network',
    litecoin: 'litecoin', ltc: 'litecoin',
    chainlink: 'chainlink', link: 'chainlink',
    crypto: 'bitcoin',
  };
  const lower = question.toLowerCase();
  for (const [kw, id] of Object.entries(mappings)) {
    if (lower.includes(kw)) return id;
  }
  return null;
}

// ─── COINGECKO (free, no key) ───────────────────────────────
export async function fetchCoinGecko(
  coinId: string
): Promise<{
  name: string;
  symbol: string;
  price: number | null;
  change24h: number | null;
  change7d: number | null;
  marketCap: number | null;
  volume24h: number | null;
  ath: number | null;
} | null> {
  try {
    const resp = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!resp.ok) return null;
    const data: any = await resp.json();
    return {
      name: data.name || coinId,
      symbol: (data.symbol || '').toUpperCase(),
      price: data.market_data?.current_price?.usd ?? null,
      change24h: data.market_data?.price_change_percentage_24h ?? null,
      change7d: data.market_data?.price_change_percentage_7d ?? null,
      marketCap: data.market_data?.market_cap?.usd ?? null,
      volume24h: data.market_data?.total_volume?.usd ?? null,
      ath: data.market_data?.ath?.usd ?? null,
    };
  } catch {
    return null;
  }
}

// ─── FEAR & GREED INDEX (free, no key) ──────────────────────
export async function fetchFearGreedIndex(): Promise<{
  value: number;
  label: string;
  timestamp: string;
} | null> {
  try {
    const resp = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const entry = data?.data?.[0];
    if (!entry) return null;
    return {
      value: parseInt(entry.value, 10),
      label: entry.value_classification || 'Unknown',
      timestamp: new Date(parseInt(entry.timestamp, 10) * 1000).toISOString().split('T')[0],
    };
  } catch {
    return null;
  }
}

// ─── REDDIT SENTIMENT (free, no key) ────────────────────────
export async function fetchRedditSentiment(
  query: string
): Promise<{ subreddit: string; title: string; score: number; url: string; created: string }[]> {
  const subreddits = ['wallstreetbets', 'stocks', 'investing', 'CryptoCurrency'];
  const results: { subreddit: string; title: string; score: number; url: string; created: string }[] = [];
  const encoded = encodeURIComponent(query);
  try {
    // Search across relevant subreddits
    for (const sub of subreddits) {
      try {
        const resp = await fetch(
          `https://www.reddit.com/r/${sub}/search.json?q=${encoded}&sort=relevance&t=month&limit=3`,
          { headers: { 'User-Agent': 'BrightBet/1.0 (hackathon)' } }
        );
        if (!resp.ok) continue;
        const data: any = await resp.json();
        const posts = data?.data?.children || [];
        for (const p of posts.slice(0, 2)) {
          const post = p.data;
          results.push({
            subreddit: sub,
            title: post.title || '',
            score: post.score || 0,
            url: `https://reddit.com${post.permalink || ''}`,
            created: new Date((post.created_utc || 0) * 1000).toISOString().split('T')[0],
          });
        }
      } catch {
        continue;
      }
      if (results.length >= 6) break;
    }
    return results.slice(0, 6);
  } catch {
    return [];
  }
}

// ─── GOOGLE TRENDS (free, unofficial) ───────────────────────
export async function fetchGoogleTrends(
  query: string
): Promise<{ keyword: string; interest: string } | null> {
  // Google Trends doesn't have a stable free API for Workers,
  // so we use SerpAPI-style or a simple signal. For the hackathon
  // we'll use the daily trends endpoint as a relevance signal.
  try {
    const resp = await fetch(
      `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-300&geo=US&ed=${new Date().toISOString().split('T')[0].replace(/-/g, '')}&ns=15`,
      { headers: { 'User-Agent': 'BrightBet/1.0' } }
    );
    if (!resp.ok) return { keyword: query, interest: 'unavailable' };
    const text = await resp.text();
    // Google Trends prefixes response with ")]}'"
    const clean = text.replace(/^\)\]\}\'/, '');
    const data = JSON.parse(clean);
    const topics = data?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
    const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const match = topics.find((t: any) => {
      const title = (t.title?.query || '').toLowerCase();
      return keywords.some((kw) => title.includes(kw));
    });
    if (match) {
      return {
        keyword: match.title?.query || query,
        interest: `Trending — ${match.formattedTraffic || 'high'} searches`,
      };
    }
    return { keyword: query, interest: 'Not currently trending' };
  } catch {
    return { keyword: query, interest: 'unavailable' };
  }
}

// ─── FRED (Federal Reserve Economic Data) ───────────────────
export async function fetchFredData(
  env: Env
): Promise<{ series: string; label: string; value: string; date: string }[]> {
  const fredKey = resolveEnvValue(env, ['FRED_API_KEY', 'FRED_KEY']);
  if (!fredKey) {
    return [];
  }
  // Fetch key macro indicators
  const seriesIds: { id: string; label: string }[] = [
    { id: 'DFF', label: 'Federal Funds Rate' },
    { id: 'CPIAUCSL', label: 'CPI (Inflation)' },
    { id: 'UNRATE', label: 'Unemployment Rate' },
    { id: 'GDP', label: 'GDP' },
    { id: 'T10Y2Y', label: '10Y-2Y Treasury Spread' },
  ];
  const results: { series: string; label: string; value: string; date: string }[] = [];
  try {
    const fetches = seriesIds.map(async (s) => {
      try {
        const resp = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&sort_order=desc&limit=1&api_key=${fredKey}&file_type=json`
        );
        if (!resp.ok) return;
        const data: any = await resp.json();
        const obs = data?.observations?.[0];
        if (obs) {
          results.push({ series: s.id, label: s.label, value: obs.value || 'N/A', date: obs.date || '' });
        }
      } catch { /* skip */ }
    });
    await Promise.all(fetches);
    return results;
  } catch {
    return [];
  }
}

// ─── ALPHA VANTAGE (stock technicals) ───────────────────────
export async function fetchAlphaVantageTechnicals(
  symbol: string,
  env: Env
): Promise<{
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  sma50: number | null;
  sma200: number | null;
} | null> {
  const avKey = resolveEnvValue(env, ['ALPHA_VANTAGE_API_KEY', 'ALPHA_VANTAGE_KEY', 'AV_API_KEY']);
  if (!avKey) return null;

  const base = 'https://www.alphavantage.co/query';
  try {
    const [rsiResp, macdResp, sma50Resp, sma200Resp] = await Promise.all([
      fetch(`${base}?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${avKey}`),
      fetch(`${base}?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${avKey}`),
      fetch(`${base}?function=SMA&symbol=${symbol}&interval=daily&time_period=50&series_type=close&apikey=${avKey}`),
      fetch(`${base}?function=SMA&symbol=${symbol}&interval=daily&time_period=200&series_type=close&apikey=${avKey}`),
    ]);

    let rsi: number | null = null;
    let macd: number | null = null;
    let macdSignal: number | null = null;
    let sma50: number | null = null;
    let sma200: number | null = null;

    try {
      const rsiData: any = await rsiResp.json();
      const rsiEntries = Object.values(rsiData?.['Technical Analysis: RSI'] || {}) as any[];
      if (rsiEntries[0]) rsi = parseFloat(rsiEntries[0].RSI);
    } catch {}
    try {
      const macdData: any = await macdResp.json();
      const macdEntries = Object.values(macdData?.['Technical Analysis: MACD'] || {}) as any[];
      if (macdEntries[0]) {
        macd = parseFloat(macdEntries[0].MACD);
        macdSignal = parseFloat(macdEntries[0].MACD_Signal);
      }
    } catch {}
    try {
      const sma50Data: any = await sma50Resp.json();
      const sma50Entries = Object.values(sma50Data?.['Technical Analysis: SMA'] || {}) as any[];
      if (sma50Entries[0]) sma50 = parseFloat(sma50Entries[0].SMA);
    } catch {}
    try {
      const sma200Data: any = await sma200Resp.json();
      const sma200Entries = Object.values(sma200Data?.['Technical Analysis: SMA'] || {}) as any[];
      if (sma200Entries[0]) sma200 = parseFloat(sma200Entries[0].SMA);
    } catch {}

    if (rsi === null && macd === null && sma50 === null && sma200 === null) return null;
    return { rsi, macd, macdSignal, sma50, sma200 };
  } catch {
    return null;
  }
}