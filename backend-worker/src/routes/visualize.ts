/**
 * /visualize ENDPOINT (GET/POST)
 * Returns formatted visualization data for the frontend planet view.
 */

import type { Env } from '../index';
import {
  fetchWikipedia,
  fetchFinnhubQuote,
  fetchFinnhubNews,
  fetchPolymarketData,
  extractTicker,
} from '../services/pythonClient';

export async function handleVisualize(request: Request, env: Env): Promise<Response> {
  let question: string;

  if (request.method === 'POST') {
    try {
      const body: any = await request.json();
      question = body.question;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    const url = new URL(request.url);
    question = url.searchParams.get('question') || '';
  }

  if (!question) {
    return new Response(JSON.stringify({ error: 'Missing "question" parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const symbol = extractTicker(question);

  const [wikiResults, polyResults, finnQuote, finnNews] = await Promise.all([
    fetchWikipedia(question),
    fetchPolymarketData(question),
    symbol ? fetchFinnhubQuote(symbol, env) : Promise.resolve(null),
    symbol ? fetchFinnhubNews(symbol, env) : Promise.resolve([]),
  ]);

  const visualization = {
    question,
    symbol,
    planets: [
      {
        id: 'finnhub',
        name: 'Market Data',
        color: '#22c55e',
        icon: '✦',
        orbitRadius: 1,
        data: finnQuote
          ? {
              quote: finnQuote,
              news: finnNews,
              available: true,
            }
          : { available: false, reason: 'No stock symbol detected' },
      },
      {
        id: 'polymarket',
        name: 'Prediction Markets',
        color: '#3b82f6',
        icon: '✦',
        orbitRadius: 2,
        data: {
          markets: polyResults,
          available: polyResults.length > 0,
        },
      },
      {
        id: 'wikipedia',
        name: 'Knowledge Base',
        color: '#f59e0b',
        icon: '✦',
        orbitRadius: 3,
        data: {
          articles: wikiResults,
          available: wikiResults.length > 0,
        },
      },
    ],
  };

  return new Response(JSON.stringify(visualization), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}