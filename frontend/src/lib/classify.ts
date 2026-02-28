/**
 * Classify a question into one of the 13 Polymarket-style categories.
 * Uses keyword matching + optional API response data for refinement.
 */

import type { AiOpinionResponse } from '../api/client';
import { CATEGORIES } from './categories';

const KEYWORD_MAP: Record<string, string[]> = {
  Politics: [
    'election', 'president', 'congress', 'senate', 'democrat', 'republican',
    'trump', 'biden', 'vote', 'political', 'legislation', 'governor',
    'party', 'impeach', 'poll', 'ballot', 'kamala', 'harris', 'desantis',
    'primary', 'debate', 'executive order',
  ],
  Sports: [
    'nfl', 'nba', 'mlb', 'soccer', 'football', 'basketball', 'baseball',
    'tennis', 'golf', 'championship', 'super bowl', 'world cup', 'olympics',
    'athlete', 'team', 'score', 'playoff', 'league', 'tournament', 'draft',
    'ufc', 'boxing', 'f1', 'formula 1', 'nhl', 'hockey',
  ],
  Crypto: [
    'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'solana',
    'defi', 'nft', 'token', 'altcoin', 'mining', 'wallet', 'dogecoin',
    'cardano', 'ripple', 'xrp', 'stablecoin', 'binance', 'coinbase',
  ],
  Finance: [
    'stock', 'market', 'wall street', 'sp500', 's&p', 'dow', 'nasdaq',
    'treasury', 'bond', 'interest rate', 'fed ', 'federal reserve', 'bank',
    'investment', 'hedge fund', 'etf', 'index fund', 'dividend', 'short',
    'bull', 'bear',
  ],
  Geopolitics: [
    'war', 'conflict', 'nato', 'china', 'russia', 'ukraine', 'sanctions',
    'trade war', 'military', 'nuclear', 'alliance', 'territory', 'invasion',
    'taiwan', 'north korea', 'iran', 'israel', 'palestine', 'ceasefire',
  ],
  Earnings: [
    'earnings', 'revenue', 'profit', 'eps', 'quarterly', 'annual report',
    'guidance', 'forecast', 'ipo', 'valuation', 'pe ratio', 'margin',
    'beat estimates', 'miss estimates',
  ],
  Tech: [
    'ai', 'artificial intelligence', 'machine learning', 'apple', 'google',
    'microsoft', 'nvidia', 'semiconductor', 'chip', 'software', 'startup',
    'silicon valley', 'meta', 'openai', 'chatgpt', 'robot', 'quantum',
    'spacex', 'autonomous',
  ],
  Culture: [
    'movie', 'music', 'celebrity', 'entertainment', 'oscar', 'grammy',
    'award', 'film', 'artist', 'album', 'streaming', 'tiktok', 'viral',
    'netflix', 'disney', 'tv show', 'series', 'game of', 'taylor swift',
  ],
  World: [
    'global', 'international', 'united nations', 'pandemic', 'health',
    'who', 'immigration', 'refugee', 'crisis', 'humanitarian', 'treaty',
    'summit', 'g7', 'g20', 'brics',
  ],
  Economy: [
    'gdp', 'inflation', 'recession', 'unemployment', 'housing', 'consumer',
    'supply chain', 'trade', 'tariff', 'deficit', 'debt ceiling',
    'stimulus', 'wage', 'labor market', 'cpi',
  ],
  'Climate & Science': [
    'climate', 'environment', 'carbon', 'renewable', 'energy', 'solar',
    'wind', 'emission', 'temperature', 'science', 'research', 'space',
    'nasa', 'mars', 'vaccine', 'asteroid', 'ev ', 'electric vehicle',
  ],
  Mentions: [
    'trending', 'viral', 'social media', 'popular', 'buzz', 'meme',
    'influencer', 'engagement',
  ],
};

export function classifyQuestion(
  question: string,
  result?: AiOpinionResponse | null,
): number {
  const q = question.toLowerCase();

  // Score each category
  const scores = CATEGORIES.map((cat) => {
    const keywords = KEYWORD_MAP[cat.name] || [];
    return keywords.reduce((score, kw) => (q.includes(kw) ? score + 1 : score), 0);
  });

  // Boost based on API response data
  if (result) {
    if (result.sources.coingecko) scores[2] += 5;     // Crypto
    if (result.sources.finnhub) scores[3] += 3;       // Finance
    if (result.sources.technicals) scores[5] += 2;    // Earnings
    if (result.sources.fearGreed) scores[9] += 1;     // Economy
  }

  const maxScore = Math.max(...scores);
  if (maxScore === 0) return CATEGORIES.length - 1; // "Other"
  return scores.indexOf(maxScore);
}
