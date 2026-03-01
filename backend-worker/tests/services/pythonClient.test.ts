/**
 * Tests for src/services/pythonClient.ts
 * Covers: extractTicker, extractCryptoId, callGroqAI, fetchWikipedia,
 *         fetchFinnhubQuote, fetchFinnhubNews, fetchPolymarketData,
 *         fetchCoinGecko, fetchFearGreedIndex, fetchRedditSentiment,
 *         fetchGoogleTrends, fetchFredData, fetchAlphaVantageTechnicals,
 *         fetchFinnhubCandles, fetchCoinGeckoOHLC, fetchPolymarketHistory
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractTicker,
  extractCryptoId,
  callGroqAI,
  fetchWikipedia,
  fetchFinnhubQuote,
  fetchFinnhubNews,
  fetchPolymarketData,
  fetchCoinGecko,
  fetchFearGreedIndex,
  fetchRedditSentiment,
  fetchGoogleTrends,
  fetchFredData,
  fetchAlphaVantageTechnicals,
  fetchFinnhubCandles,
  fetchCoinGeckoOHLC,
  fetchPolymarketHistory,
} from '../../src/services/pythonClient';
import { createMockEnv, mockFetch, jsonResponse } from '../helpers';

// ────────────────────────────────────────────────
// extractTicker
// ────────────────────────────────────────────────
describe('extractTicker', () => {
  it('extracts a $-prefixed ticker', () => {
    expect(extractTicker('Will $AAPL go up?')).toBe('AAPL');
  });

  it('maps company names to tickers', () => {
    expect(extractTicker('Is Tesla going to the moon?')).toBe('TSLA');
    expect(extractTicker('What about nvidia stock?')).toBe('NVDA');
    expect(extractTicker('Buy microsoft?')).toBe('MSFT');
    expect(extractTicker('Should I invest in amazon')).toBe('AMZN');
  });

  it('returns null for crypto questions (avoids false positives)', () => {
    expect(extractTicker('Will bitcoin hit 100k?')).toBeNull();
    expect(extractTicker('Is ethereum a good buy?')).toBeNull();
    expect(extractTicker('Should I buy SOL?')).toBeNull();
    expect(extractTicker('What about ETH?')).toBeNull();
  });

  it('returns null when no ticker detected', () => {
    expect(extractTicker('Will it rain tomorrow?')).toBeNull();
    expect(extractTicker('Is the economy going to crash?')).toBeNull();
  });

  it('handles case-insensitive inputs', () => {
    expect(extractTicker('is APPLE stock overvalued?')).toBe('AAPL');
  });

  it('maps Elon/Musk/SpaceX to TSLA', () => {
    expect(extractTicker('Will Elon become a trillionaire?')).toBe('TSLA');
    expect(extractTicker('SpaceX IPO when?')).toBe('TSLA');
  });
});

// ────────────────────────────────────────────────
// extractCryptoId
// ────────────────────────────────────────────────
describe('extractCryptoId', () => {
  it('maps long crypto names', () => {
    expect(extractCryptoId('Will bitcoin hit 100k?')).toBe('bitcoin');
    expect(extractCryptoId('Is ethereum undervalued?')).toBe('ethereum');
    expect(extractCryptoId('Solana to the moon?')).toBe('solana');
    expect(extractCryptoId('What about dogecoin?')).toBe('dogecoin');
  });

  it('maps short tickers with word boundaries', () => {
    expect(extractCryptoId('Buy BTC now?')).toBe('bitcoin');
    expect(extractCryptoId('ETH price prediction')).toBe('ethereum');
    expect(extractCryptoId('Is SOL good?')).toBe('solana');
    expect(extractCryptoId('Should I hold ADA?')).toBe('cardano');
  });

  it('does NOT match substrings (eth in "whether")', () => {
    expect(extractCryptoId('Whether the market recovers')).toBeNull();
  });

  it('returns null for non-crypto', () => {
    expect(extractCryptoId('Will Tesla stock go up?')).toBeNull();
    expect(extractCryptoId('Is the economy healthy?')).toBeNull();
  });

  it('maps generic "crypto" to bitcoin', () => {
    expect(extractCryptoId('Is crypto a good investment?')).toBe('bitcoin');
    expect(extractCryptoId('cryptocurrency market analysis')).toBe('bitcoin');
  });
});

// ────────────────────────────────────────────────
// callGroqAI
// ────────────────────────────────────────────────
describe('callGroqAI', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns parsed AI response on success', async () => {
    const aiResponse = { confidence_score: 75, sentiment: 'bullish', reasoning: 'Strong growth.' };
    mockFetch(() =>
      jsonResponse({
        choices: [{ message: { content: JSON.stringify(aiResponse) } }],
      }),
    );

    const env = createMockEnv();
    const result = await callGroqAI('Will Tesla go up?', 'Price is $250', env);
    expect(result).toEqual(aiResponse);
  });

  it('falls back to next key on 429', async () => {
    const aiResponse = { confidence_score: 60, sentiment: 'neutral', reasoning: 'Uncertain.' };
    let callCount = 0;
    mockFetch(() => {
      callCount++;
      if (callCount === 1) {
        return new Response('rate limited', { status: 429 });
      }
      return jsonResponse({
        choices: [{ message: { content: JSON.stringify(aiResponse) } }],
      });
    });

    const env = createMockEnv({ GROQ_API_KEY_2: 'second-key' });
    const result = await callGroqAI('Question?', 'Context', env);
    expect(result).toEqual(aiResponse);
    expect(callCount).toBe(2);
  });

  it('throws when all keys exhausted', async () => {
    mockFetch(() => new Response('rate limited', { status: 429 }));
    const env = createMockEnv();
    await expect(callGroqAI('Q?', 'C', env)).rejects.toThrow('All Groq API keys exhausted');
  });

  it('throws when no API key configured', async () => {
    const env = createMockEnv({
      GROQ_API_KEY: undefined,
      GROQ_KEY: undefined,
      GROQ_TOKEN: undefined,
    });
    await expect(callGroqAI('Q?', 'C', env)).rejects.toThrow('Missing GROQ API key');
  });

  it('handles malformed AI response gracefully', async () => {
    mockFetch(() =>
      jsonResponse({
        choices: [{ message: { content: 'This is not JSON but a reasoning' } }],
      }),
    );
    const env = createMockEnv();
    const result = await callGroqAI('Q?', 'C', env);
    expect(result.confidence_score).toBe(50);
    expect(result.sentiment).toBe('neutral');
    expect(result.reasoning).toContain('This is not JSON');
  });
});

// ────────────────────────────────────────────────
// fetchWikipedia
// ────────────────────────────────────────────────
describe('fetchWikipedia', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns article summaries', async () => {
    let callCount = 0;
    mockFetch(() => {
      callCount++;
      if (callCount === 1) {
        // search response
        return jsonResponse({
          query: {
            search: [{ title: 'Tesla, Inc.' }],
          },
        });
      }
      // summary response
      return jsonResponse({
        query: {
          pages: {
            '1': { extract: 'Tesla, Inc. is an American electric vehicle company.' },
          },
        },
      });
    });

    const results = await fetchWikipedia('Will Tesla stock go up?');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Tesla, Inc.');
    expect(results[0].summary).toContain('Tesla');
  });

  it('returns error summary on fetch failure', async () => {
    mockFetch(() => {
      throw new Error('Network error');
    });
    const results = await fetchWikipedia('test');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Error');
  });
});

// ────────────────────────────────────────────────
// fetchFinnhubQuote
// ────────────────────────────────────────────────
describe('fetchFinnhubQuote', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns stock quote data', async () => {
    mockFetch(() =>
      jsonResponse({ c: 250.5, d: 3.2, dp: 1.3, h: 255.0, l: 248.0 }),
    );
    const env = createMockEnv();
    const quote = await fetchFinnhubQuote('TSLA', env);
    expect(quote.symbol).toBe('TSLA');
    expect(quote.price).toBe(250.5);
    expect(quote.change).toBe(3.2);
    expect(quote.changePercent).toBe(1.3);
  });

  it('returns nulls when no API key', async () => {
    const env = createMockEnv({
      FINNHUB_API_KEY: undefined,
      FINNHUB_KEY: undefined,
      FINNHUB_TOKEN: undefined,
    });
    const quote = await fetchFinnhubQuote('TSLA', env);
    expect(quote.price).toBeNull();
  });

  it('handles fetch error gracefully', async () => {
    mockFetch(() => { throw new Error('Network error'); });
    const env = createMockEnv();
    const quote = await fetchFinnhubQuote('TSLA', env);
    expect(quote.price).toBeNull();
  });
});

// ────────────────────────────────────────────────
// fetchFinnhubNews
// ────────────────────────────────────────────────
describe('fetchFinnhubNews', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns news articles', async () => {
    mockFetch(() =>
      jsonResponse([
        { headline: 'Tesla earnings beat', summary: 'Tesla reported...', source: 'Reuters', url: 'https://...' },
        { headline: 'EV market grows', summary: 'The EV market...', source: 'Bloomberg', url: 'https://...' },
      ]),
    );
    const env = createMockEnv();
    const news = await fetchFinnhubNews('TSLA', env);
    expect(news.length).toBe(2);
    expect(news[0].headline).toBe('Tesla earnings beat');
  });

  it('returns empty array when no API key', async () => {
    const env = createMockEnv({
      FINNHUB_API_KEY: undefined,
      FINNHUB_KEY: undefined,
      FINNHUB_TOKEN: undefined,
    });
    const news = await fetchFinnhubNews('TSLA', env);
    expect(news).toEqual([]);
  });
});

// ────────────────────────────────────────────────
// fetchPolymarketData
// ────────────────────────────────────────────────
describe('fetchPolymarketData', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns matching markets', async () => {
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('slug=')) {
        return jsonResponse([
          {
            question: 'Will Tesla reach $500?',
            outcomePrices: '["0.35","0.65"]',
            volume: '1000000',
            slug: 'tesla-500',
          },
        ]);
      }
      // paginated fetch
      return jsonResponse([]);
    });

    const results = await fetchPolymarketData('Will Tesla reach $500?');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].question).toBe('Will Tesla reach $500?');
    expect(results[0].yes_price).toBe('0.35');
    expect(results[0].no_price).toBe('0.65');
  });

  it('returns empty on error', async () => {
    mockFetch(() => { throw new Error('Network fail'); });
    const results = await fetchPolymarketData('test');
    expect(results).toEqual([]);
  });
});

// ────────────────────────────────────────────────
// fetchCoinGecko
// ────────────────────────────────────────────────
describe('fetchCoinGecko', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns crypto data from CoinGecko', async () => {
    mockFetch(() =>
      jsonResponse({
        name: 'Bitcoin',
        symbol: 'btc',
        market_data: {
          current_price: { usd: 65000 },
          price_change_percentage_24h: 2.5,
          price_change_percentage_7d: -1.3,
          market_cap: { usd: 1200000000000 },
          total_volume: { usd: 30000000000 },
          ath: { usd: 73700 },
        },
      }),
    );
    const result = await fetchCoinGecko('bitcoin');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Bitcoin');
    expect(result!.price).toBe(65000);
    expect(result!.change24h).toBe(2.5);
  });

  it('falls back to CoinCap on CoinGecko failure', async () => {
    let callCount = 0;
    mockFetch(() => {
      callCount++;
      if (callCount <= 3) {
        // CoinGecko retries (up to 3 attempts)
        return new Response('Too Many Requests', { status: 429 });
      }
      // CoinCap fallback
      return jsonResponse({
        data: {
          name: 'Bitcoin',
          symbol: 'BTC',
          priceUsd: '65000',
          changePercent24Hr: '2.5',
          marketCapUsd: '1200000000000',
          volumeUsd24Hr: '30000000000',
        },
      });
    });
    const result = await fetchCoinGecko('bitcoin');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Bitcoin');
  });
});

// ────────────────────────────────────────────────
// fetchFearGreedIndex
// ────────────────────────────────────────────────
describe('fetchFearGreedIndex', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns fear & greed data', async () => {
    mockFetch(() =>
      jsonResponse({
        data: [
          { value: '72', value_classification: 'Greed', timestamp: '1700000000' },
        ],
      }),
    );
    const result = await fetchFearGreedIndex();
    expect(result).not.toBeNull();
    expect(result!.value).toBe(72);
    expect(result!.label).toBe('Greed');
  });

  it('returns null on error', async () => {
    mockFetch(() => new Response('error', { status: 500 }));
    const result = await fetchFearGreedIndex();
    expect(result).toBeNull();
  });
});

// ────────────────────────────────────────────────
// fetchRedditSentiment
// ────────────────────────────────────────────────
describe('fetchRedditSentiment', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns posts from reddit', async () => {
    mockFetch(() =>
      jsonResponse({
        data: {
          children: [
            {
              data: {
                title: 'Tesla to the moon!',
                score: 1500,
                permalink: '/r/wallstreetbets/comments/abc123',
                created_utc: 1700000000,
              },
            },
          ],
        },
      }),
    );
    const results = await fetchRedditSentiment('Will Tesla stock go up?');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Tesla to the moon!');
  });

  it('returns empty on error', async () => {
    mockFetch(() => { throw new Error('fail'); });
    const results = await fetchRedditSentiment('test');
    expect(results).toEqual([]);
  });
});

// ────────────────────────────────────────────────
// fetchGoogleTrends
// ────────────────────────────────────────────────
describe('fetchGoogleTrends', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns trend data with suggestions', async () => {
    mockFetch(() =>
      jsonResponse(['tesla stock', ['tesla stock price', 'tesla stock prediction', 'tesla earnings']]),
    );
    const result = await fetchGoogleTrends('Will Tesla stock go up?');
    expect(result).not.toBeNull();
    expect(result!.relatedQueries.length).toBeGreaterThan(0);
  });

  it('returns null for empty query', async () => {
    const result = await fetchGoogleTrends('the and a');
    // All stop words → no keywords
    expect(result).toBeNull();
  });
});

// ────────────────────────────────────────────────
// fetchFredData
// ────────────────────────────────────────────────
describe('fetchFredData', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns macro indicators', async () => {
    mockFetch(() =>
      jsonResponse({
        observations: [{ value: '5.33', date: '2024-01-01' }],
      }),
    );
    const env = createMockEnv();
    const results = await fetchFredData(env);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe('5.33');
  });

  it('returns empty when no FRED key', async () => {
    const env = createMockEnv({ FRED_API_KEY: undefined, FRED_KEY: undefined });
    const results = await fetchFredData(env);
    expect(results).toEqual([]);
  });
});

// ────────────────────────────────────────────────
// fetchAlphaVantageTechnicals
// ────────────────────────────────────────────────
describe('fetchAlphaVantageTechnicals', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns technical indicators', async () => {
    mockFetch((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('RSI')) {
        return jsonResponse({ 'Technical Analysis: RSI': { '2024-01-01': { RSI: '65.5' } } });
      }
      if (url.includes('MACD')) {
        return jsonResponse({
          'Technical Analysis: MACD': { '2024-01-01': { MACD: '1.234', MACD_Signal: '0.987' } },
        });
      }
      if (url.includes('time_period=50')) {
        return jsonResponse({ 'Technical Analysis: SMA': { '2024-01-01': { SMA: '180.5' } } });
      }
      if (url.includes('time_period=200')) {
        return jsonResponse({ 'Technical Analysis: SMA': { '2024-01-01': { SMA: '170.2' } } });
      }
      return jsonResponse({});
    });

    const env = createMockEnv();
    const result = await fetchAlphaVantageTechnicals('TSLA', env);
    expect(result).not.toBeNull();
    expect(result!.rsi).toBeCloseTo(65.5);
    expect(result!.macd).toBeCloseTo(1.234);
    expect(result!.sma50).toBeCloseTo(180.5);
    expect(result!.sma200).toBeCloseTo(170.2);
  });

  it('returns null when no AV key', async () => {
    const env = createMockEnv({
      ALPHA_VANTAGE_API_KEY: undefined,
      ALPHA_VANTAGE_KEY: undefined,
      AV_API_KEY: undefined,
    });
    const result = await fetchAlphaVantageTechnicals('TSLA', env);
    expect(result).toBeNull();
  });
});

// ────────────────────────────────────────────────
// fetchFinnhubCandles
// ────────────────────────────────────────────────
describe('fetchFinnhubCandles', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns OHLC candle data', async () => {
    const spy = mockFetch(async () => {
      // Yahoo Finance response format (function was renamed but uses Yahoo)
      const body = {
        chart: {
          result: [{
            timestamp: [1700000000, 1700086400],
            indicators: {
              quote: [{
                open: [250.0, 252.0],
                high: [255.0, 257.0],
                low: [248.0, 250.0],
                close: [253.0, 254.0],
              }],
            },
          }],
        },
      };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    const env = createMockEnv();
    const candles = await fetchFinnhubCandles('TSLA', env);
    expect(spy).toHaveBeenCalled();
    expect(candles.length).toBe(2);
    expect(candles[0].open).toBe(250.0);
    expect(candles[0].close).toBe(253.0);
  });

  it('returns empty when no API key', async () => {
    // fetchFinnhubCandles no longer checks API keys (uses Yahoo Finance),
    // but still returns empty on network error
    mockFetch(() => new Response('error', { status: 500 }));
    const env = createMockEnv();
    const candles = await fetchFinnhubCandles('TSLA', env);
    expect(candles).toEqual([]);
  });

  it('returns empty on bad response', async () => {
    mockFetch(() =>
      jsonResponse({ chart: { result: [] } }),
    );
    const env = createMockEnv();
    const candles = await fetchFinnhubCandles('TSLA', env);
    expect(candles).toEqual([]);
  });
});

// ────────────────────────────────────────────────
// fetchCoinGeckoOHLC
// ────────────────────────────────────────────────
describe('fetchCoinGeckoOHLC', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns OHLC crypto candle data', async () => {
    mockFetch(() =>
      jsonResponse([
        [1700000000000, 65000, 65500, 64800, 65200],
        [1700086400000, 65200, 66000, 65000, 65800],
      ]),
    );
    const candles = await fetchCoinGeckoOHLC('bitcoin');
    expect(candles.length).toBe(2);
    expect(candles[0].open).toBe(65000);
  });

  it('falls back to CoinCap on 429', async () => {
    let callCount = 0;
    mockFetch(() => {
      callCount++;
      if (callCount === 1) {
        return new Response('rate limited', { status: 429 });
      }
      // CoinCap candles response
      return jsonResponse({
        data: [
          { period: 1700000000000, open: '65000', high: '65500', low: '64800', close: '65200' },
        ],
      });
    });
    const candles = await fetchCoinGeckoOHLC('bitcoin');
    expect(candles.length).toBe(1);
  });
});

// ────────────────────────────────────────────────
// fetchPolymarketHistory
// ────────────────────────────────────────────────
describe('fetchPolymarketHistory', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns price history for a market', async () => {
    let callCount = 0;
    mockFetch(() => {
      callCount++;
      if (callCount === 1) {
        // market lookup
        return jsonResponse([
          {
            question: 'Will BTC hit 100k?',
            clobTokenIds: '["token123"]',
          },
        ]);
      }
      // price history
      return jsonResponse({
        history: [
          { t: 1700000000, p: 0.45 },
          { t: 1700086400, p: 0.52 },
        ],
      });
    });

    const result = await fetchPolymarketHistory('btc-100k');
    expect(result).not.toBeNull();
    expect(result!.question).toBe('Will BTC hit 100k?');
    expect(result!.history.length).toBe(2);
    expect(result!.history[0].value).toBe(45); // 0.45 * 100
  });

  it('returns null when market not found', async () => {
    mockFetch(() => jsonResponse([]));
    const result = await fetchPolymarketHistory('nonexistent-slug');
    expect(result).toBeNull();
  });
});
