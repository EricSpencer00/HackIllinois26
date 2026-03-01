import { describe, it, expect } from 'vitest';
import { classifyQuestion } from '../../lib/classify';
import { CATEGORIES } from '../../lib/categories';
import type { AiOpinionResponse } from '../../api/client';
import { MOCK_AI_RESPONSE, MOCK_STOCK_RESPONSE, MOCK_EMPTY_SOURCES } from '../fixtures';

function categoryNameAt(index: number): string {
  return CATEGORIES[index]?.name ?? 'Unknown';
}

describe('classifyQuestion', () => {
  describe('keyword-based classification', () => {
    it('classifies a politics question correctly', () => {
      const idx = classifyQuestion('Will Trump win the 2026 election?');
      expect(categoryNameAt(idx)).toBe('Politics');
    });

    it('classifies a sports question correctly', () => {
      const idx = classifyQuestion('Will the NBA championship go to the Lakers?');
      expect(categoryNameAt(idx)).toBe('Sports');
    });

    it('classifies a crypto question correctly', () => {
      const idx = classifyQuestion('Will Bitcoin hit $200k by December 2026?');
      expect(categoryNameAt(idx)).toBe('Crypto');
    });

    it('classifies a finance/stock question correctly', () => {
      const idx = classifyQuestion('Will the stock market crash this year?');
      expect(categoryNameAt(idx)).toBe('Finance');
    });

    it('classifies a geopolitics question correctly', () => {
      const idx = classifyQuestion('Will NATO expand to include Ukraine?');
      expect(categoryNameAt(idx)).toBe('Geopolitics');
    });

    it('classifies an earnings question correctly', () => {
      const idx = classifyQuestion('Will Apple beat earnings estimates this quarter?');
      expect(categoryNameAt(idx)).toBe('Earnings');
    });

    it('classifies a tech question correctly', () => {
      const idx = classifyQuestion('Will artificial intelligence replace programmers?');
      expect(categoryNameAt(idx)).toBe('Tech');
    });

    it('classifies a culture question correctly', () => {
      const idx = classifyQuestion('Will the next Oscar winner be a streaming movie?');
      expect(categoryNameAt(idx)).toBe('Culture');
    });

    it('classifies a world question correctly', () => {
      const idx = classifyQuestion('Will the global pandemic finally end this year?');
      expect(categoryNameAt(idx)).toBe('World');
    });

    it('classifies an economy question correctly', () => {
      const idx = classifyQuestion('Will GDP growth exceed 3% this quarter?');
      expect(categoryNameAt(idx)).toBe('Economy');
    });

    it('classifies a climate/science question correctly', () => {
      const idx = classifyQuestion('Will NASA successfully land on Mars?');
      expect(categoryNameAt(idx)).toBe('Climate & Science');
    });

    it('classifies a mentions question correctly', () => {
      const idx = classifyQuestion('What meme is trending on social media?');
      expect(categoryNameAt(idx)).toBe('Mentions');
    });

    it('returns "Other" for unclassifiable questions', () => {
      // Carefully chosen to avoid substring keyword matches (e.g. "apple" in "pineapple")
      const idx = classifyQuestion('Will a frog jump over a tall fence?');
      expect(categoryNameAt(idx)).toBe('Other');
    });

    it('returns "Other" index which is the last category', () => {
      const idx = classifyQuestion('What color is your favorite sock?');
      expect(idx).toBe(CATEGORIES.length - 1);
    });
  });

  describe('multiple keyword matching (highest score wins)', () => {
    it('picks the category with the most keyword hits', () => {
      // Question hitting multiple Finance keywords
      const idx = classifyQuestion('stock market wall street dow nasdaq bull');
      expect(categoryNameAt(idx)).toBe('Finance');
    });

    it('handles overlap between categories', () => {
      // "bitcoin" is Crypto, "stock" is Finance — both get 1 hit, first max wins
      const idx = classifyQuestion('bitcoin stock');
      // Both scored 1, but indexOf returns the first max → Crypto (index 2)
      expect(idx).toBe(2); // Crypto comes before Finance in the CATEGORIES array
    });
  });

  describe('API response data boosting', () => {
    it('boosts Crypto when coingecko data is present', () => {
      // A vague question that might not match crypto keywords
      const idx = classifyQuestion('Will this asset moon?', MOCK_AI_RESPONSE);
      // coingecko gives +5 to Crypto, so it should win
      expect(categoryNameAt(idx)).toBe('Crypto');
    });

    it('boosts Finance when finnhub data is present', () => {
      const idx = classifyQuestion('Will this asset go up?', MOCK_STOCK_RESPONSE);
      // finnhub gives +3 to Finance
      expect(categoryNameAt(idx)).toBe('Finance');
    });

    it('does not boost when sources are null', () => {
      const response: AiOpinionResponse = {
        confidence_score: 50,
        sentiment: 'Neutral',
        reasoning: 'test',
        question: 'bland query words',
        symbol: null,
        cryptoId: null,
        sources: MOCK_EMPTY_SOURCES,
      };
      // "bland query words" avoids all substring keyword matches (e.g. "eth" in "something")
      const idx = classifyQuestion('bland query words', response);
      expect(categoryNameAt(idx)).toBe('Other');
    });

    it('boosts Earnings when technicals are present', () => {
      const response: AiOpinionResponse = {
        ...MOCK_AI_RESPONSE,
        sources: {
          ...MOCK_EMPTY_SOURCES,
          technicals: { rsi: 60, macd: 1, macdSignal: 0.8, sma50: 100, sma200: 90 },
        },
      };
      // No keyword match + technicals → Earnings gets +2
      const idx = classifyQuestion('very ambiguous', response);
      expect(categoryNameAt(idx)).toBe('Earnings');
    });

    it('boosts Economy when fearGreed is present', () => {
      const response: AiOpinionResponse = {
        ...MOCK_AI_RESPONSE,
        sources: {
          ...MOCK_EMPTY_SOURCES,
          fearGreed: { value: 50, label: 'Neutral', timestamp: '2026-01-01T00:00:00Z' },
        },
      };
      const idx = classifyQuestion('very ambiguous', response);
      expect(categoryNameAt(idx)).toBe('Economy');
    });
  });

  describe('case insensitivity', () => {
    it('is case insensitive', () => {
      const lower = classifyQuestion('bitcoin price prediction');
      const upper = classifyQuestion('BITCOIN PRICE PREDICTION');
      const mixed = classifyQuestion('BiTcOiN pRiCe PrEdIcTiOn');
      expect(lower).toBe(upper);
      expect(lower).toBe(mixed);
    });
  });

  describe('edge cases', () => {
    it('handles an empty string', () => {
      const idx = classifyQuestion('');
      expect(categoryNameAt(idx)).toBe('Other');
    });

    it('handles null result parameter', () => {
      const idx = classifyQuestion('bitcoin', null);
      expect(categoryNameAt(idx)).toBe('Crypto');
    });

    it('handles undefined result parameter', () => {
      const idx = classifyQuestion('bitcoin');
      expect(categoryNameAt(idx)).toBe('Crypto');
    });
  });
});
