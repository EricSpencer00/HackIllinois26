/**
 * /get-ai-opinion ENDPOINT (POST)
 * Receives a question, scrapes context from multiple sources, sends to Groq AI.
 * Returns confidence score + reasoning.
 */

import type { Env } from '../index';
import {
  callGroqAI,
  fetchWikipedia,
  fetchFinnhubQuote,
  fetchFinnhubNews,
  fetchPolymarketData,
  extractTicker,
  extractCryptoId,
  fetchCoinGecko,
  fetchFearGreedIndex,
  fetchRedditSentiment,
  fetchGoogleTrends,
  fetchFredData,
  fetchAlphaVantageTechnicals,
} from '../services/pythonClient';

export async function handleGetAiOpinion(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { question: string; context?: string; symbol?: string };
  try {
    body = await request.json() as any;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.question) {
    return new Response(JSON.stringify({ error: 'Missing "question" field' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const question = body.question;
  const symbol = body.symbol || extractTicker(question);
  const cryptoId = extractCryptoId(question);

  // Scrape ALL sources in parallel
  const [
    wikiResults, polyResults, finnQuote, finnNews,
    coinGeckoData, fearGreed, redditPosts, googleTrends,
    fredData, technicals
  ] = await Promise.all([
    fetchWikipedia(question),
    fetchPolymarketData(question),
    symbol ? fetchFinnhubQuote(symbol, env) : Promise.resolve(null),
    symbol ? fetchFinnhubNews(symbol, env) : Promise.resolve([]),
    cryptoId ? fetchCoinGecko(cryptoId) : Promise.resolve(null),
    fetchFearGreedIndex(),
    fetchRedditSentiment(question),
    fetchGoogleTrends(question),
    fetchFredData(env),
    symbol ? fetchAlphaVantageTechnicals(symbol, env) : Promise.resolve(null),
  ]);

  // Build context string
  const contextParts: string[] = [];

  if (body.context) contextParts.push(body.context);

  if (wikiResults.length > 0) {
    contextParts.push(
      'Wikipedia Context:\n' + wikiResults.map((w) => `${w.title}: ${w.summary}`).join('\n')
    );
  }

  if (polyResults.length > 0) {
    contextParts.push(
      'Polymarket Predictions:\n' +
        polyResults
          .map((p) => `${p.question} — YES: ${p.yes_price || '?'}, NO: ${p.no_price || '?'}`)
          .join('\n')
    );
  }

  if (finnQuote) {
    contextParts.push(
      `Finnhub Stock Data for ${finnQuote.symbol}: Price $${finnQuote.price}, Change ${finnQuote.changePercent}%`
    );
  }

  if (finnNews && finnNews.length > 0) {
    contextParts.push(
      'Recent News:\n' + finnNews.map((n) => `- ${n.headline}`).join('\n')
    );
  }

  if (coinGeckoData) {
    contextParts.push(
      `Crypto Data (${coinGeckoData.name} / ${coinGeckoData.symbol}): Price $${coinGeckoData.price}, 24h Change ${coinGeckoData.change24h?.toFixed(2)}%, 7d Change ${coinGeckoData.change7d?.toFixed(2)}%, Market Cap $${coinGeckoData.marketCap?.toLocaleString()}, ATH $${coinGeckoData.ath}`
    );
  }

  if (fearGreed) {
    contextParts.push(
      `Market Fear & Greed Index: ${fearGreed.value}/100 (${fearGreed.label}) as of ${fearGreed.timestamp}`
    );
  }

  if (redditPosts.length > 0) {
    contextParts.push(
      'Reddit Sentiment:\n' + redditPosts.map((r) => `- r/${r.subreddit}: "${r.title}" (score: ${r.score}, ${r.created})`).join('\n')
    );
  }

  if (googleTrends) {
    contextParts.push(
      `Google Trends: "${googleTrends.keyword}" — ${googleTrends.interest}`
    );
  }

  if (fredData.length > 0) {
    contextParts.push(
      'Macro Economic Indicators (FRED):\n' + fredData.map((f) => `- ${f.label}: ${f.value} (${f.date})`).join('\n')
    );
  }

  if (technicals) {
    const parts = [];
    if (technicals.rsi !== null) parts.push(`RSI(14): ${technicals.rsi.toFixed(1)}`);
    if (technicals.macd !== null) parts.push(`MACD: ${technicals.macd.toFixed(3)}`);
    if (technicals.sma50 !== null) parts.push(`SMA(50): $${technicals.sma50.toFixed(2)}`);
    if (technicals.sma200 !== null) parts.push(`SMA(200): $${technicals.sma200.toFixed(2)}`);
    if (parts.length > 0) {
      contextParts.push(`Technical Indicators for ${symbol}: ${parts.join(', ')}`);
    }
  }

  const fullContext = contextParts.join('\n\n');

  // Call Groq AI
  const aiResult = await callGroqAI(question, fullContext, env);

  const result = {
    ...aiResult,
    question,
    symbol,
    cryptoId: cryptoId || null,
    sources: {
      wikipedia: wikiResults,
      polymarket: polyResults,
      finnhub: finnQuote
        ? { quote: finnQuote, news: finnNews }
        : null,
      coingecko: coinGeckoData || null,
      fearGreed: fearGreed || null,
      reddit: redditPosts,
      googleTrends: googleTrends || null,
      fred: fredData,
      technicals: technicals || null,
    },
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}