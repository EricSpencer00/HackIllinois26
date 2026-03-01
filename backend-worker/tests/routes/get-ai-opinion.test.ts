/**
 * Tests for src/routes/get-ai-opinion.ts
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleGetAiOpinion } from '../../src/routes/get-ai-opinion';
import { createMockEnv, jsonRequest, jsonBody, mockFetch, jsonResponse } from '../helpers';

describe('handleGetAiOpinion', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects non-POST requests', async () => {
    const req = new Request('https://brightbet.tech/api/get-ai-opinion', { method: 'GET' });
    const env = createMockEnv();
    const res = await handleGetAiOpinion(req, env);
    expect(res.status).toBe(405);
  });

  it('rejects invalid JSON body', async () => {
    const req = new Request('https://brightbet.tech/api/get-ai-opinion', {
      method: 'POST',
      body: 'nope',
    });
    const env = createMockEnv();
    const res = await handleGetAiOpinion(req, env);
    expect(res.status).toBe(400);
    const body = await jsonBody(res);
    expect(body.error).toContain('Invalid JSON');
  });

  it('rejects missing question field', async () => {
    const req = jsonRequest('https://brightbet.tech/api/get-ai-opinion', { context: 'some context' });
    const env = createMockEnv();
    const res = await handleGetAiOpinion(req, env);
    expect(res.status).toBe(400);
    const body = await jsonBody(res);
    expect(body.error).toContain('Missing "question"');
  });

  it('returns full AI analysis with all sources', async () => {
    // Mock all external fetch calls
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();

      // Groq AI
      if (url.includes('groq.com')) {
        return jsonResponse({
          choices: [{
            message: {
              content: JSON.stringify({
                confidence_score: 72,
                sentiment: 'bullish',
                reasoning: 'Strong fundamentals and positive market sentiment.',
              }),
            },
          }],
        });
      }

      // Wikipedia search
      if (url.includes('wikipedia.org') && url.includes('action=query&list=search')) {
        return jsonResponse({
          query: { search: [{ title: 'Tesla, Inc.' }] },
        });
      }
      if (url.includes('wikipedia.org') && url.includes('prop=extracts')) {
        return jsonResponse({
          query: {
            pages: { '1': { extract: 'Tesla is an EV company.' } },
          },
        });
      }

      // Polymarket
      if (url.includes('gamma-api.polymarket.com')) {
        return jsonResponse([]);
      }

      // Finnhub quote
      if (url.includes('finnhub.io/api/v1/quote')) {
        return jsonResponse({ c: 250.5, d: 3.2, dp: 1.3, h: 255, l: 248 });
      }

      // Finnhub news
      if (url.includes('finnhub.io/api/v1/company-news')) {
        return jsonResponse([
          { headline: 'Tesla earnings beat', summary: 'Q4 was strong', source: 'Reuters', url: 'https://x.com' },
        ]);
      }

      // Fear & Greed
      if (url.includes('alternative.me')) {
        return jsonResponse({
          data: [{ value: '65', value_classification: 'Greed', timestamp: '1700000000' }],
        });
      }

      // Reddit
      if (url.includes('reddit.com')) {
        return jsonResponse({
          data: { children: [] },
        });
      }

      // Google trends
      if (url.includes('suggestqueries.google.com')) {
        return jsonResponse(['tesla', ['tesla stock', 'tesla price']]);
      }

      // FRED
      if (url.includes('stlouisfed.org')) {
        return jsonResponse({
          observations: [{ value: '5.33', date: '2024-01-01' }],
        });
      }

      // Alpha Vantage
      if (url.includes('alphavantage.co') && url.includes('RSI')) {
        return jsonResponse({ 'Technical Analysis: RSI': { '2024-01-01': { RSI: '62.5' } } });
      }
      if (url.includes('alphavantage.co') && url.includes('MACD')) {
        return jsonResponse({ 'Technical Analysis: MACD': { '2024-01-01': { MACD: '1.5', MACD_Signal: '1.2' } } });
      }
      if (url.includes('alphavantage.co') && url.includes('SMA')) {
        return jsonResponse({ 'Technical Analysis: SMA': { '2024-01-01': { SMA: '200.0' } } });
      }

      return jsonResponse({});
    });

    const req = jsonRequest('https://brightbet.tech/api/get-ai-opinion', {
      question: 'Will Tesla stock hit $300 by 2025?',
    });
    const env = createMockEnv();
    const res = await handleGetAiOpinion(req, env);
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    expect(body.confidence_score).toBe(72);
    expect(body.sentiment).toBe('bullish');
    expect(body.reasoning).toBeDefined();
    expect(body.question).toBe('Will Tesla stock hit $300 by 2025?');
    expect(body.symbol).toBe('TSLA');

    // Check sources are included
    expect(body.sources).toBeDefined();
    expect(body.sources.wikipedia).toBeDefined();
    expect(body.sources.finnhub).toBeDefined();
    expect(body.sources.finnhub.quote.price).toBe(250.5);
    expect(body.sources.fearGreed).toBeDefined();
    expect(body.sources.fred).toBeDefined();
  });

  it('handles crypto questions', async () => {
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('groq.com')) {
        return jsonResponse({
          choices: [{
            message: {
              content: JSON.stringify({
                confidence_score: 60,
                sentiment: 'neutral',
                reasoning: 'Mixed signals.',
              }),
            },
          }],
        });
      }

      if (url.includes('coingecko.com')) {
        return jsonResponse({
          name: 'Bitcoin',
          symbol: 'btc',
          market_data: {
            current_price: { usd: 65000 },
            price_change_percentage_24h: 2.5,
            price_change_percentage_7d: -1.0,
            market_cap: { usd: 1200000000000 },
            total_volume: { usd: 30000000000 },
            ath: { usd: 73700 },
          },
        });
      }

      // Default fallback for other APIs
      if (url.includes('wikipedia.org') && url.includes('list=search')) {
        return jsonResponse({ query: { search: [] } });
      }
      if (url.includes('gamma-api.polymarket.com')) {
        return jsonResponse([]);
      }
      if (url.includes('alternative.me')) {
        return jsonResponse({ data: [{ value: '50', value_classification: 'Neutral', timestamp: '1700000000' }] });
      }
      if (url.includes('reddit.com')) {
        return jsonResponse({ data: { children: [] } });
      }
      if (url.includes('suggestqueries.google.com')) {
        return jsonResponse(['bitcoin', []]);
      }
      if (url.includes('stlouisfed.org')) {
        return jsonResponse({ observations: [] });
      }

      return jsonResponse({});
    });

    const req = jsonRequest('https://brightbet.tech/api/get-ai-opinion', {
      question: 'Will bitcoin hit 100k?',
    });
    const env = createMockEnv();
    const res = await handleGetAiOpinion(req, env);
    const body = await jsonBody(res);

    expect(body.cryptoId).toBe('bitcoin');
    expect(body.sources.coingecko).toBeDefined();
    expect(body.sources.coingecko.name).toBe('Bitcoin');
  });

  it('includes user-provided context', async () => {
    let groqBody: any;
    mockFetch((input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('groq.com')) {
        groqBody = JSON.parse(init?.body as string);
        return jsonResponse({
          choices: [{
            message: {
              content: JSON.stringify({
                confidence_score: 50,
                sentiment: 'neutral',
                reasoning: 'OK',
              }),
            },
          }],
        });
      }
      if (url.includes('wikipedia.org') && url.includes('list=search')) {
        return jsonResponse({ query: { search: [] } });
      }
      if (url.includes('gamma-api.polymarket.com')) return jsonResponse([]);
      if (url.includes('alternative.me')) return jsonResponse({ data: [] });
      if (url.includes('reddit.com')) return jsonResponse({ data: { children: [] } });
      if (url.includes('suggestqueries.google.com')) return jsonResponse(['test', []]);
      if (url.includes('stlouisfed.org')) return jsonResponse({ observations: [] });
      return jsonResponse({});
    });

    const req = jsonRequest('https://brightbet.tech/api/get-ai-opinion', {
      question: 'Will rain affect crops?',
      context: 'Weather forecast says heavy rain next week.',
    });
    const env = createMockEnv();
    await handleGetAiOpinion(req, env);

    // The user context should appear in the Groq prompt
    const userMessage = groqBody.messages.find((m: any) => m.role === 'user');
    expect(userMessage.content).toContain('Weather forecast says heavy rain next week.');
  });
});
