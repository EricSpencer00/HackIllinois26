import type { AiOpinionResponse, Source } from '../api/client';

/**
 * Shared mock data used across multiple test files.
 */

export const MOCK_SOURCES: Source = {
  wikipedia: [{ title: 'Bitcoin', summary: 'A cryptocurrency' }],
  polymarket: [
    {
      question: 'Will BTC hit 200k?',
      yes_price: '0.35',
      no_price: '0.65',
      volume: '1000000',
      slug: 'will-btc-hit-200k',
    },
  ],
  finnhub: {
    quote: {
      symbol: 'AAPL',
      price: 180.5,
      change: 2.3,
      changePercent: 1.29,
      high: 182.0,
      low: 178.1,
    },
    news: [
      {
        headline: 'Apple beats earnings',
        summary: 'Strong Q4 results.',
        source: 'Reuters',
        url: 'https://example.com',
      },
    ],
  },
  coingecko: {
    name: 'Bitcoin',
    symbol: 'btc',
    price: 95000,
    change24h: 3.2,
    change7d: 8.1,
    marketCap: 1800000000000,
    volume24h: 50000000000,
    ath: 109000,
  },
  fearGreed: {
    value: 72,
    label: 'Greed',
    timestamp: '2026-02-28T00:00:00Z',
  },
  reddit: [
    {
      subreddit: 'Bitcoin',
      title: 'BTC breaks 95k!',
      score: 1500,
      url: 'https://reddit.com/r/Bitcoin/abc',
      created: '2026-02-27T12:00:00Z',
    },
  ],
  googleTrends: {
    keyword: 'bitcoin',
    interest: 'High',
    relatedQueries: ['bitcoin price', 'bitcoin etf', 'crypto market'],
  },
  fred: [
    { series: 'DGS10', label: '10Y Treasury', value: '4.25', date: '2026-02-27' },
    { series: 'UNRATE', label: 'Unemployment', value: '3.8', date: '2026-02-01' },
  ],
  technicals: {
    rsi: 62,
    macd: 1.5,
    macdSignal: 1.2,
    sma50: 88000,
    sma200: 75000,
  },
};

export const MOCK_AI_RESPONSE: AiOpinionResponse = {
  confidence_score: 78,
  sentiment: 'Bullish',
  reasoning: 'Bitcoin shows strong momentum with positive technicals and high market sentiment.',
  question: 'Will Bitcoin hit $200k by December 2026?',
  symbol: null,
  cryptoId: 'bitcoin',
  sources: MOCK_SOURCES,
};

export const MOCK_STOCK_RESPONSE: AiOpinionResponse = {
  confidence_score: 65,
  sentiment: 'Neutral',
  reasoning: 'Tesla faces mixed signals from earnings and market conditions.',
  question: 'Will Tesla stock reach $500 by end of 2026?',
  symbol: 'TSLA',
  cryptoId: null,
  sources: {
    ...MOCK_SOURCES,
    coingecko: null,
    finnhub: {
      quote: {
        symbol: 'TSLA',
        price: 350.0,
        change: -5.2,
        changePercent: -1.46,
        high: 360.0,
        low: 345.0,
      },
      news: [
        {
          headline: 'Tesla delivery numbers below expectations',
          summary: 'Q4 deliveries were lower than analyst expectations.',
          source: 'Bloomberg',
          url: 'https://example.com/tsla',
        },
      ],
    },
  },
};

export const MOCK_EMPTY_SOURCES: Source = {
  wikipedia: [],
  polymarket: [],
  finnhub: null,
  coingecko: null,
  fearGreed: null,
  reddit: [],
  googleTrends: null,
  fred: [],
  technicals: null,
};

export const MOCK_MINIMAL_RESPONSE: AiOpinionResponse = {
  confidence_score: 30,
  sentiment: 'Uncertain',
  reasoning: 'Insufficient data to make a confident prediction.',
  question: 'Will aliens make contact in 2026?',
  symbol: null,
  cryptoId: null,
  sources: MOCK_EMPTY_SOURCES,
};
