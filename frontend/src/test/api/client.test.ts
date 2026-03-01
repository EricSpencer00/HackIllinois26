import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAiOpinion,
  getPlanetCategories,
  getHealth,
  getCandles,
  generateImage,
} from '../../api/client';
import { MOCK_AI_RESPONSE } from '../fixtures';

// We spy on global fetch for each test
const fetchSpy = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ═══════════════════════════════════════
   getAiOpinion
   ═══════════════════════════════════════ */
describe('getAiOpinion', () => {
  it('sends a POST request with the correct body', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_AI_RESPONSE),
    });

    await getAiOpinion({ question: 'Will BTC hit 200k?' });

    expect(fetchSpy).toHaveBeenCalledWith('/api/get-ai-opinion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Will BTC hit 200k?' }),
    });
  });

  it('returns the parsed response on success', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_AI_RESPONSE),
    });

    const result = await getAiOpinion({ question: 'test' });
    expect(result).toEqual(MOCK_AI_RESPONSE);
  });

  it('includes optional context and symbol in the request', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_AI_RESPONSE),
    });

    await getAiOpinion({ question: 'test', context: 'some context', symbol: 'AAPL' });

    expect(fetchSpy).toHaveBeenCalledWith('/api/get-ai-opinion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'test', context: 'some context', symbol: 'AAPL' }),
    });
  });

  it('throws with API error message when response is not ok', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    });

    await expect(getAiOpinion({ question: 'test' })).rejects.toThrow('Internal Server Error');
  });

  it('throws with status code when error body cannot be parsed', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(getAiOpinion({ question: 'test' })).rejects.toThrow('API error: 503');
  });

  it('throws with fallback message when error body has no error field', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Bad request' }),
    });

    await expect(getAiOpinion({ question: 'test' })).rejects.toThrow('API error: 400');
  });
});

/* ═══════════════════════════════════════
   getPlanetCategories
   ═══════════════════════════════════════ */
describe('getPlanetCategories', () => {
  it('fetches from /api/planet-categories', async () => {
    const mockCats = {
      categories: [
        { id: '1', name: 'Crypto', icon: '₿', color: '#f00', description: 'x', orbitRadius: 1 },
      ],
    };
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCats),
    });

    const result = await getPlanetCategories();
    expect(fetchSpy).toHaveBeenCalledWith('/api/planet-categories');
    expect(result).toEqual(mockCats.categories);
  });

  it('throws on non-ok response', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(getPlanetCategories()).rejects.toThrow('API error: 404');
  });
});

/* ═══════════════════════════════════════
   getHealth
   ═══════════════════════════════════════ */
describe('getHealth', () => {
  it('fetches from /api/health', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    });

    const result = await getHealth();
    expect(fetchSpy).toHaveBeenCalledWith('/api/health');
    expect(result).toEqual({ status: 'ok' });
  });

  it('throws on non-ok response', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getHealth()).rejects.toThrow('API error: 500');
  });
});

/* ═══════════════════════════════════════
   getCandles
   ═══════════════════════════════════════ */
describe('getCandles', () => {
  it('sends a POST request with params', async () => {
    const mockResp = {
      series: [{ id: 'btc', label: 'BTC', type: 'candlestick', data: [], color: '#fff' }],
    };
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResp),
    });

    const result = await getCandles({ symbol: 'AAPL', cryptoId: null, polymarketSlug: null });
    expect(fetchSpy).toHaveBeenCalledWith('/api/candles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'AAPL', cryptoId: null, polymarketSlug: null }),
    });
    expect(result).toEqual(mockResp);
  });

  it('returns empty series on non-ok response', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await getCandles({ symbol: 'FAIL' });
    expect(result).toEqual({ series: [] });
  });
});

/* ═══════════════════════════════════════
  generateImage
  ═══════════════════════════════════════ */
describe('generateImage', () => {
  it('sends a POST request with question, sentiment, confidence', async () => {
    const mockResp = {
      type: 'image' as const,
      imageData: 'data:image/png;base64,...',
      sentiment: 'Bullish',
      confidence: 80,
    };
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResp),
    });

    const result = await generateImage('Will BTC hit 200k?', 'Bullish', 80);
    expect(fetchSpy).toHaveBeenCalledWith('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Will BTC hit 200k?', sentiment: 'Bullish', confidence: 80 }),
    });
    expect(result).toEqual(mockResp);
  });

  it('returns null on non-ok response', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await generateImage('test');
    expect(result).toBeNull();
  });

  it('returns null on fetch exception', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network error'));
    const result = await generateImage('test');
    expect(result).toBeNull();
  });
});
