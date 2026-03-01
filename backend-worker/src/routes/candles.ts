/**
 * /candles ENDPOINT (POST)
 * Returns historical OHLC candle data for chart visualization.
 * Fetches from Finnhub (stocks), CoinGecko (crypto), and Polymarket (predictions).
 */

import type { Env } from '../index';
import {
  fetchFinnhubCandles,
  fetchCoinGeckoOHLC,
  fetchPolymarketHistory,
  extractTicker,
  extractCryptoId,
} from '../services/pythonClient';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LineData {
  time: string;
  value: number;
}

interface ChartSeries {
  id: string;
  label: string;
  type: 'candlestick' | 'line';
  data: CandleData[] | LineData[];
  color: string;
}

export async function handleCandles(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { symbol?: string; cryptoId?: string; polymarketSlug?: string; question?: string };
  try {
    body = (await request.json()) as any;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Auto-detect from question if specific IDs not provided
  const symbol = body.symbol || (body.question ? extractTicker(body.question) : null);
  const cryptoId = body.cryptoId || (body.question ? extractCryptoId(body.question) : null);
  const polySlug = body.polymarketSlug || null;

  // Fetch all data sources in parallel
  const [stockCandles, cryptoCandles, polyHistory] = await Promise.all([
    symbol ? fetchFinnhubCandles(symbol, env) : Promise.resolve([]),
    cryptoId ? fetchCoinGeckoOHLC(cryptoId) : Promise.resolve([]),
    polySlug ? fetchPolymarketHistory(polySlug) : Promise.resolve(null),
  ]);

  const series: ChartSeries[] = [];

  if (stockCandles.length > 0) {
    series.push({
      id: 'stock',
      label: symbol!.toUpperCase(),
      type: 'candlestick',
      data: stockCandles,
      color: '#ffffff',
    });
  }

  if (cryptoCandles.length > 0) {
    series.push({
      id: 'crypto',
      label: cryptoId!.charAt(0).toUpperCase() + cryptoId!.slice(1),
      type: 'candlestick',
      data: cryptoCandles,
      color: '#ffffff',
    });
  }

  if (polyHistory && polyHistory.history.length > 0) {
    series.push({
      id: 'polymarket',
      label: `Polymarket: ${polyHistory.question.length > 50 ? polyHistory.question.slice(0, 47) + '...' : polyHistory.question}`,
      type: 'line',
      data: polyHistory.history,
      color: '#3b82f6',
    });
  }

  return new Response(JSON.stringify({ series }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
