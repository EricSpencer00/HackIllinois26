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

  // Scrape in parallel
  const [wikiResults, polyResults, finnQuote, finnNews] = await Promise.all([
    fetchWikipedia(question),
    fetchPolymarketData(question),
    symbol ? fetchFinnhubQuote(symbol, env) : Promise.resolve(null),
    symbol ? fetchFinnhubNews(symbol, env) : Promise.resolve([]),
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

  const fullContext = contextParts.join('\n\n');

  // Call Groq AI
  const aiResult = await callGroqAI(question, fullContext, env);

  const result = {
    ...aiResult,
    question,
    symbol,
    sources: {
      wikipedia: wikiResults,
      polymarket: polyResults,
      finnhub: finnQuote
        ? { quote: finnQuote, news: finnNews }
        : null,
    },
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}