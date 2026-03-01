/**
 * Tests for src/routes/candles.ts
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleCandles } from '../../src/routes/candles';
import { createMockEnv, jsonRequest, jsonBody, mockFetch, jsonResponse } from '../helpers';

describe('handleCandles', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects non-POST requests', async () => {
    const req = new Request('https://brightbet.tech/api/candles', { method: 'GET' });
    const env = createMockEnv();
    const res = await handleCandles(req, env);
    expect(res.status).toBe(405);
  });

  it('rejects invalid JSON body', async () => {
    const req = new Request('https://brightbet.tech/api/candles', {
      method: 'POST',
      body: 'not json',
    });
    const env = createMockEnv();
    const res = await handleCandles(req, env);
    expect(res.status).toBe(400);
    const body = await jsonBody(res);
    expect(body.error).toContain('Invalid JSON');
  });

  it('returns stock candles when symbol provided', async () => {
    const yahooResponse = {
      chart: {
        result: [{
          timestamp: [1700000000, 1700086400],
          indicators: {
            quote: [{
              open: [250, 252],
              high: [255, 257],
              low: [248, 250],
              close: [253, 254],
            }],
          },
        }],
      },
    };
    const spy = mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('yahoo') || url.includes('finance')) {
        return jsonResponse(yahooResponse);
      }
      return jsonResponse([]);
    });

    const req = jsonRequest('https://brightbet.tech/api/candles', { symbol: 'TSLA' });
    const env = createMockEnv();
    const res = await handleCandles(req, env);
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalled();

    const body = await jsonBody(res);
    expect(body.series).toBeDefined();
    expect(body.series.length).toBeGreaterThan(0);
    expect(body.series[0].id).toBe('stock');
    expect(body.series[0].type).toBe('candlestick');
    expect(body.series[0].data.length).toBe(2);
  });

  it('auto-detects ticker from question', async () => {
    const yahooResponse = {
      chart: {
        result: [{
          timestamp: [1700000000],
          indicators: {
            quote: [{
              open: [180],
              high: [185],
              low: [178],
              close: [183],
            }],
          },
        }],
      },
    };
    const spy = mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('yahoo') || url.includes('finance')) {
        return jsonResponse(yahooResponse);
      }
      return jsonResponse([]);
    });

    const req = jsonRequest('https://brightbet.tech/api/candles', {
      question: 'Will apple stock go up?',
    });
    const env = createMockEnv();
    const res = await handleCandles(req, env);
    expect(spy).toHaveBeenCalled();
    const body = await jsonBody(res);

    // extractTicker("Will apple stock go up?") → AAPL
    const stockSeries = body.series.find((s: any) => s.id === 'stock');
    expect(stockSeries).toBeDefined();
    expect(stockSeries.label).toBe('AAPL');
  });

  it('returns crypto candles when cryptoId provided', async () => {
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('coingecko.com') || url.includes('coincap.io')) {
        return jsonResponse([
          [1700000000000, 65000, 65500, 64800, 65200],
        ]);
      }
      return jsonResponse([]);
    });

    const req = jsonRequest('https://brightbet.tech/api/candles', { cryptoId: 'bitcoin' });
    const env = createMockEnv();
    const res = await handleCandles(req, env);
    const body = await jsonBody(res);

    const cryptoSeries = body.series.find((s: any) => s.id === 'crypto');
    expect(cryptoSeries).toBeDefined();
    expect(cryptoSeries.type).toBe('candlestick');
  });

  it('returns empty series when no data sources match', async () => {
    mockFetch(() => jsonResponse([]));

    const req = jsonRequest('https://brightbet.tech/api/candles', {});
    const env = createMockEnv();
    const res = await handleCandles(req, env);
    const body = await jsonBody(res);
    expect(body.series).toEqual([]);
  });

  it('returns polymarket line data when slug provided', async () => {
    let callCount = 0;
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('gamma-api.polymarket.com')) {
        return jsonResponse([
          {
            question: 'Will BTC hit 100k?',
            clobTokenIds: '["token123"]',
          },
        ]);
      }
      if (url.includes('clob.polymarket.com')) {
        return jsonResponse({
          history: [
            { t: 1700000000, p: 0.45 },
            { t: 1700086400, p: 0.52 },
          ],
        });
      }
      return jsonResponse([]);
    });

    const req = jsonRequest('https://brightbet.tech/api/candles', { polymarketSlug: 'btc-100k' });
    const env = createMockEnv();
    const res = await handleCandles(req, env);
    const body = await jsonBody(res);

    const polySeries = body.series.find((s: any) => s.id === 'polymarket');
    expect(polySeries).toBeDefined();
    expect(polySeries.type).toBe('line');
  });
});
