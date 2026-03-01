/**
 * Tests for src/routes/visualize.ts
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleVisualize } from '../../src/routes/visualize';
import { createMockEnv, jsonRequest, jsonBody, mockFetch, jsonResponse } from '../helpers';

describe('handleVisualize', () => {
  afterEach(() => vi.restoreAllMocks());

  function setupMocks() {
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('wikipedia.org') && url.includes('list=search')) {
        return jsonResponse({
          query: { search: [{ title: 'Tesla, Inc.' }] },
        });
      }
      if (url.includes('wikipedia.org') && url.includes('prop=extracts')) {
        return jsonResponse({
          query: { pages: { '1': { extract: 'Tesla is an EV company.' } } },
        });
      }
      if (url.includes('gamma-api.polymarket.com')) {
        return jsonResponse([]);
      }
      if (url.includes('finnhub.io/api/v1/quote')) {
        return jsonResponse({ c: 250, d: 3, dp: 1.2, h: 255, l: 248 });
      }
      if (url.includes('finnhub.io/api/v1/company-news')) {
        return jsonResponse([
          { headline: 'Tesla news', summary: 'stuff', source: 'Reuters', url: 'https://x' },
        ]);
      }
      return jsonResponse({});
    });
  }

  it('handles POST with question in body', async () => {
    setupMocks();
    const req = jsonRequest('https://brightbet.tech/api/visualize', {
      question: 'Will Tesla stock go up?',
    });
    const env = createMockEnv();
    const res = await handleVisualize(req, env);
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    expect(body.question).toBe('Will Tesla stock go up?');
    expect(body.symbol).toBe('TSLA');
    expect(body.planets).toBeDefined();
    expect(Array.isArray(body.planets)).toBe(true);
    expect(body.planets.length).toBe(3);
  });

  it('handles GET with query parameter', async () => {
    setupMocks();
    const req = new Request('https://brightbet.tech/api/visualize?question=Will+Tesla+stock+go+up%3F', {
      method: 'GET',
    });
    const env = createMockEnv();
    const res = await handleVisualize(req, env);
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    expect(body.question).toBe('Will Tesla stock go up?');
  });

  it('returns 400 when question is missing', async () => {
    const req = new Request('https://brightbet.tech/api/visualize', { method: 'GET' });
    const env = createMockEnv();
    const res = await handleVisualize(req, env);
    expect(res.status).toBe(400);
    const body = await jsonBody(res);
    expect(body.error).toContain('Missing "question"');
  });

  it('returns 400 for POST with invalid JSON', async () => {
    const req = new Request('https://brightbet.tech/api/visualize', {
      method: 'POST',
      body: 'not json',
    });
    const env = createMockEnv();
    const res = await handleVisualize(req, env);
    expect(res.status).toBe(400);
  });

  it('includes planet data with correct structure', async () => {
    setupMocks();
    const req = jsonRequest('https://brightbet.tech/api/visualize', {
      question: 'Will Tesla stock go up?',
    });
    const env = createMockEnv();
    const res = await handleVisualize(req, env);
    const body = await jsonBody(res);

    // Check planet structure
    for (const planet of body.planets) {
      expect(planet).toHaveProperty('id');
      expect(planet).toHaveProperty('name');
      expect(planet).toHaveProperty('color');
      expect(planet).toHaveProperty('orbitRadius');
      expect(planet).toHaveProperty('data');
    }

    // Finnhub planet should have data available
    const finnhubPlanet = body.planets.find((p: any) => p.id === 'finnhub');
    expect(finnhubPlanet).toBeDefined();
    expect(finnhubPlanet.data.available).toBe(true);
    expect(finnhubPlanet.data.quote.price).toBe(250);
  });

  it('marks finnhub as unavailable when no symbol detected', async () => {
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('wikipedia.org') && url.includes('list=search')) {
        return jsonResponse({ query: { search: [] } });
      }
      if (url.includes('gamma-api.polymarket.com')) {
        return jsonResponse([]);
      }
      return jsonResponse({});
    });

    const req = jsonRequest('https://brightbet.tech/api/visualize', {
      question: 'Will it rain tomorrow?',
    });
    const env = createMockEnv();
    const res = await handleVisualize(req, env);
    const body = await jsonBody(res);

    const finnhub = body.planets.find((p: any) => p.id === 'finnhub');
    expect(finnhub.data.available).toBe(false);
    expect(finnhub.data.reason).toContain('No stock symbol');
  });
});
