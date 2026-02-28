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
function extractWikiQuery(question: string): string {
  // Extract proper nouns and meaningful entities for Wikipedia search
  // instead of sending the full predictive question
  const words = question.split(/\s+/);
  const properNouns: string[] = [];
  const importantTerms: string[] = [];

  // Detect capitalized words (likely proper nouns) - skip first word which is always capitalized
  for (let i = 0; i < words.length; i++) {
    const clean = words[i].replace(/[^a-zA-Z0-9'-]/g, '');
    if (!clean) continue;
    // Proper noun detection: capitalized and not a common word
    if (/^[A-Z]/.test(clean) && clean.length > 1 && i > 0) {
      properNouns.push(clean);
    } else if (i === 0 && /^[A-Z]/.test(clean) && clean.length > 1) {
      // First word - include if it looks like a real name (not a question word)
      const questionWords = new Set(['will', 'what', 'when', 'where', 'how', 'is', 'are', 'can', 'do', 'does', 'should', 'would', 'could', 'the', 'a', 'an']);
      if (!questionWords.has(clean.toLowerCase())) {
        properNouns.push(clean);
      }
    }
  }

  // Also extract domain-specific terms
  const domainTerms = ['trillionaire', 'billionaire', 'millionaire', 'net worth', 'wealth',
    'president', 'ceo', 'founder', 'market cap', 'ipo', 'acquisition'];
  const lowerQ = question.toLowerCase();
  for (const term of domainTerms) {
    if (lowerQ.includes(term)) importantTerms.push(term);
  }

  if (properNouns.length > 0) {
    // Use just proper nouns for Wikipedia — domain terms like "trillionaire" cause noise
    // since they match tangential mentions in unrelated articles
    return properNouns.join(' ');
  }

  // Fallback: use keyword extraction
  return extractKeywords(question).slice(0, 4).join(' ');
}

export async function fetchWikipedia(query: string): Promise<{ title: string; summary: string }[]> {
  const headers = { 'User-Agent': 'BrightBet/1.0 (hackathon project; contact@brightbet.tech)', 'Accept': 'application/json' };
  try {
    const wikiQuery = extractWikiQuery(query);
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(wikiQuery)}&srlimit=3&format=json`;
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
const STOP_WORDS = new Set([
  'will', 'what', 'when', 'where', 'which', 'would', 'could', 'should', 'does', 'have',
  'been', 'being', 'that', 'this', 'than', 'them', 'they', 'their', 'there', 'these',
  'those', 'with', 'from', 'into', 'about', 'also', 'more', 'most', 'much', 'many',
  'some', 'such', 'very', 'just', 'over', 'under', 'before', 'after', 'other', 'each',
  'stock', 'price', 'reach', 'think', 'going', 'still', 'remain', 'become',
  'next', 'year', 'month', 'week', 'end', 'start', 'until', 'during',
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'its', 'let', 'say', 'she',
  'too', 'use', 'way', 'who', 'did', 'get', 'may', 'new', 'now', 'old',
  'see', 'how', 'any', 'its', 'his', 'only',
]);

function extractKeywords(query: string): string[] {
  return query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Check if a keyword matches as a whole word (not substring like "elon" in "Barcelona") */
function matchesWholeWord(text: string, keyword: string): boolean {
  const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return regex.test(text);
}

/** Generate potential Polymarket slugs from a query */
function generateSlugs(query: string): string[] {
  const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const slugs: string[] = [];

  // Filter to meaningful words
  const dateWords = new Set(['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december']);
  const meaningful = words.filter(w => !STOP_WORDS.has(w) && w.length > 2);
  const nonDateMeaningful = meaningful.filter(w => !dateWords.has(w) && !/^\d{4}$/.test(w));

  // Extract year from query
  const yearMatch = query.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  if (nonDateMeaningful.length >= 2) {
    const base = nonDateMeaningful.join('-');
    slugs.push(base);
    // Try common Polymarket date patterns
    if (year) {
      slugs.push(`${base}-before-${year}`);
      slugs.push(`${base}-before-${year + 1}`);
      slugs.push(`${base}-by-${year}`);
      slugs.push(`${base}-by-${year + 1}`);
      slugs.push(`${base}-in-${year}`);
    } else {
      for (const suffix of ['before-2027', 'before-2026', 'by-2027', 'by-2026']) {
        slugs.push(`${base}-${suffix}`);
      }
    }
  }

  // Also try full slug with date words
  if (meaningful.length >= 2 && meaningful.join('-') !== nonDateMeaningful.join('-')) {
    slugs.push(meaningful.join('-'));
  }

  // Try proper nouns + topic
  const properNouns = query.split(/\s+/)
    .filter(w => /^[A-Z]/.test(w) && w.length > 1)
    .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
    .filter(w => !['will', 'what', 'when', 'where', 'how', 'is', 'the', 'a'].includes(w));
  if (properNouns.length >= 1) {
    const topicWords = nonDateMeaningful.filter(w => !properNouns.includes(w)).slice(0, 2);
    if (topicWords.length > 0) {
      slugs.push([...properNouns, ...topicWords].join('-'));
    }
  }

  return [...new Set(slugs)];
}

export async function fetchPolymarketData(
  query: string
): Promise<{ question: string; yes_price: string | null; no_price: string | null; volume: string | null; slug: string | null }[]> {
  try {
    const keywords = extractKeywords(query);
    let markets: any[] = [];

    // Strategy 1: Try direct slug lookups (fast, exact match)
    const slugs = generateSlugs(query);
    const slugFetches = slugs.slice(0, 6).map(async (slug) => {
      try {
        const resp = await fetch(`https://gamma-api.polymarket.com/markets?closed=false&limit=5&slug=${encodeURIComponent(slug)}`);
        if (resp.ok) {
          const data: any[] = await resp.json();
          return data;
        }
      } catch {}
      return [];
    });

    // Strategy 2: Parallel paginated fetch (scan broadly for keyword matches)
    const pageFetches = [0, 1000, 2000, 3000, 4000].map(async (offset) => {
      try {
        const resp = await fetch(`https://gamma-api.polymarket.com/markets?closed=false&limit=500&offset=${offset}`);
        if (resp.ok) return resp.json() as Promise<any[]>;
      } catch {}
      return [] as any[];
    });

    // Run all fetches in parallel
    const [slugResults, pageResults] = await Promise.all([
      Promise.all(slugFetches),
      Promise.all(pageFetches),
    ]);

    // Merge slug results (highest priority)
    const seen = new Set<string>();
    for (const batch of slugResults) {
      for (const m of batch) {
        const q = m.question || m.title;
        if (q && !seen.has(q)) {
          markets.push(m);
          seen.add(q);
        }
      }
    }

    // Filter paginated results with whole-word matching
    const allPages = pageResults.flat();
    for (const m of allPages) {
      const q = m.question || m.title;
      if (!q || seen.has(q)) continue;
      const text = (q + ' ' + (m.description || '')).toLowerCase();
      const matchCount = keywords.filter((kw) => matchesWholeWord(text, kw)).length;
      if (matchCount >= 2) {
        markets.push({ ...m, _matchCount: matchCount });
        seen.add(q);
      }
    }

    // Score and sort
    const scored = markets.map((m: any) => {
      if (m._matchCount) return { market: m, matchCount: m._matchCount };
      const text = ((m.question || m.title || '') + ' ' + (m.description || '')).toLowerCase();
      const matchCount = keywords.filter((kw) => matchesWholeWord(text, kw)).length;
      return { market: m, matchCount };
    });
    const relevant = scored
      .sort((a, b) => b.matchCount - a.matchCount)
      .map((s) => s.market);

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

  // Skip ticker extraction if a crypto keyword is detected — avoids false stock matches
  const cryptoKeywords = [
    'monero', 'xmr', 'ethereum', 'eth', 'solana', 'sol', 'dogecoin', 'doge',
    'cardano', 'ada', 'xrp', 'ripple', 'polkadot', 'dot', 'avalanche', 'avax',
    'litecoin', 'ltc', 'chainlink', 'link', 'tron', 'trx', 'stellar', 'xlm',
    'cosmos', 'atom', 'algorand', 'algo', 'fantom', 'ftm', 'aptos', 'apt',
    'sui', 'pepe', 'shiba', 'shib', 'uniswap', 'uni', 'aave', 'arbitrum', 'arb',
    'near protocol',
  ];
  const lower = question.toLowerCase();
  for (const kw of cryptoKeywords) {
    if (lower.includes(kw)) return null;
  }

  const mappings: Record<string, string> = {
    tesla: 'TSLA', apple: 'AAPL', google: 'GOOGL', alphabet: 'GOOGL',
    amazon: 'AMZN', microsoft: 'MSFT', nvidia: 'NVDA', meta: 'META',
    netflix: 'NFLX', disney: 'DIS', amd: 'AMD', intel: 'INTC',
    coinbase: 'COIN', palantir: 'PLTR', uber: 'UBER', snap: 'SNAP',
    spacex: 'TSLA', elon: 'TSLA', musk: 'TSLA',
    bitcoin: 'COIN', crypto: 'COIN',
  };
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
    monero: 'monero', xmr: 'monero',
    tron: 'tron', trx: 'tron',
    stellar: 'stellar', xlm: 'stellar',
    cosmos: 'cosmos', atom: 'cosmos',
    algorand: 'algorand', algo: 'algorand',
    near: 'near', 'near protocol': 'near',
    fantom: 'fantom', ftm: 'fantom',
    aptos: 'aptos', apt: 'aptos',
    sui: 'sui',
    pepe: 'pepe',
    shiba: 'shiba-inu', shib: 'shiba-inu',
    uniswap: 'uniswap', uni: 'uniswap',
    aave: 'aave',
    arbitrum: 'arbitrum', arb: 'arbitrum',
    optimism: 'optimism',
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
function extractRedditQuery(question: string): string {
  // Use proper nouns + 1 key topic word for broader Reddit matches
  const words = question.split(/\s+/);
  const properNouns = words
    .filter(w => /^[A-Z][a-z]/.test(w.replace(/[^a-zA-Z]/g, '')))
    .map(w => w.replace(/[^a-zA-Z'-]/g, ''))
    .filter(w => w.length > 1);

  if (properNouns.length > 0) {
    // Add a finance-relevant topic term if available
    const topicTerms = extractKeywords(question)
      .filter(w => !properNouns.map(n => n.toLowerCase()).includes(w));
    const topic = topicTerms.length > 0 ? ' ' + topicTerms[0] : '';
    return properNouns.join(' ') + topic;
  }
  return extractKeywords(question).slice(0, 3).join(' ');
}

export async function fetchRedditSentiment(
  query: string
): Promise<{ subreddit: string; title: string; score: number; url: string; created: string }[]> {
  const subreddits = ['wallstreetbets', 'stocks', 'investing', 'CryptoCurrency', 'economy', 'finance'];
  const results: { subreddit: string; title: string; score: number; url: string; created: string }[] = [];
  // Use entity-focused search terms for broader matches
  const searchTerms = extractRedditQuery(query);
  if (!searchTerms) return [];
  const encoded = encodeURIComponent(searchTerms);
  try {
    // Search across relevant subreddits in parallel
    const fetches = subreddits.map(async (sub) => {
      try {
        const resp = await fetch(
          `https://www.reddit.com/r/${sub}/search.json?q=${encoded}&sort=relevance&t=month&limit=3&restrict_sr=on`,
          { headers: { 'User-Agent': 'BrightBet/1.0 (hackathon; contact@brightbet.tech)' } }
        );
        if (!resp.ok) return [];
        const data: any = await resp.json();
        const posts = data?.data?.children || [];
        return posts.slice(0, 2).map((p: any) => {
          const post = p.data;
          return {
            subreddit: sub,
            title: post.title || '',
            score: post.score || 0,
            url: `https://reddit.com${post.permalink || ''}`,
            created: new Date((post.created_utc || 0) * 1000).toISOString().split('T')[0],
          };
        });
      } catch {
        return [];
      }
    });
    const allResults = (await Promise.all(fetches)).flat();
    // Deduplicate by title
    const seen = new Set<string>();
    for (const r of allResults) {
      if (!seen.has(r.title)) {
        seen.add(r.title);
        results.push(r);
      }
    }
    return results.slice(0, 6);
  } catch {
    return [];
  }
}

// ─── GOOGLE TRENDS (via Google Suggest as a proxy) ──────────
export async function fetchGoogleTrends(
  query: string
): Promise<{ keyword: string; interest: string; relatedQueries: string[] } | null> {
  const keywords = extractKeywords(query).slice(0, 3).join(' ');
  if (!keywords) return null;
  try {
    // Use Google Suggest API — works from Workers, shows what people are searching
    const resp = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keywords)}`,
      { headers: { 'User-Agent': 'BrightBet/1.0' } }
    );
    if (!resp.ok) return { keyword: keywords, interest: 'Data unavailable', relatedQueries: [] };
    const data: any = await resp.json();
    const suggestions: string[] = (data?.[1] || []).slice(0, 6);
    if (suggestions.length > 0) {
      return {
        keyword: keywords,
        interest: `${suggestions.length} related searches found`,
        relatedQueries: suggestions,
      };
    }
    return { keyword: keywords, interest: 'Low search activity', relatedQueries: [] };
  } catch {
    return { keyword: keywords, interest: 'Data unavailable', relatedQueries: [] };
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