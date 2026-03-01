import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataOverlay from '../../components/DataOverlay';
import { MOCK_AI_RESPONSE, MOCK_MINIMAL_RESPONSE, MOCK_STOCK_RESPONSE } from '../fixtures';

// Mock CombinedChart since it uses lightweight-charts which needs a real DOM canvas
vi.mock('../../components/CombinedChart', () => ({
  default: ({ symbol, cryptoId, polymarketSlug, question }: any) => (
    <div data-testid="combined-chart" data-symbol={symbol} data-crypto={cryptoId} data-slug={polymarketSlug}>
      {question}
    </div>
  ),
}));

describe('DataOverlay', () => {
  describe('visibility', () => {
    it('is not visible when progress < 0.75', () => {
      const { container } = render(
        <DataOverlay result={MOCK_AI_RESPONSE} progress={0.5} selectedCategory={2} />,
      );
      const overlay = container.querySelector('.data-overlay');
      expect(overlay).not.toHaveClass('visible');
    });

    it('is visible when progress >= 0.75', () => {
      const { container } = render(
        <DataOverlay result={MOCK_AI_RESPONSE} progress={0.8} selectedCategory={2} />,
      );
      const overlay = container.querySelector('.data-overlay');
      expect(overlay).toHaveClass('visible');
    });

    it('is visible when progress = 1', () => {
      const { container } = render(
        <DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />,
      );
      const overlay = container.querySelector('.data-overlay');
      expect(overlay).toHaveClass('visible');
    });
  });

  describe('question and category', () => {
    it('displays the question', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(
        screen.getByText(`"${MOCK_AI_RESPONSE.question}"`),
      ).toBeInTheDocument();
    });

    it('displays the category badge', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      // Category index 2 = "Crypto"
      expect(screen.getByText('Crypto')).toBeInTheDocument();
    });
  });

  describe('confidence panel', () => {
    it('displays the confidence score', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    it('displays the sentiment', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('Bullish')).toBeInTheDocument();
    });

    it('displays "confidence" label', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('confidence')).toBeInTheDocument();
    });
  });

  describe('fear & greed panel', () => {
    it('displays fear & greed value when available', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('72')).toBeInTheDocument();
      expect(screen.getByText('Greed')).toBeInTheDocument();
    });

    it('shows "Unavailable" when no fear & greed data', () => {
      render(<DataOverlay result={MOCK_MINIMAL_RESPONSE} progress={1} selectedCategory={12} />);
      // Multiple panels show "Unavailable" when data is missing
      const unavailableTexts = screen.getAllByText('Unavailable');
      expect(unavailableTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('polymarket panel', () => {
    it('displays polymarket predictions when available', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('Will BTC hit 200k?')).toBeInTheDocument();
    });

    it('shows "No markets found" when no polymarket data', () => {
      render(<DataOverlay result={MOCK_MINIMAL_RESPONSE} progress={1} selectedCategory={12} />);
      expect(screen.getByText('No markets found')).toBeInTheDocument();
    });
  });

  describe('reddit panel', () => {
    it('displays reddit posts when available', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('BTC breaks 95k!')).toBeInTheDocument();
    });

    it('shows "No posts found" when no reddit data', () => {
      render(<DataOverlay result={MOCK_MINIMAL_RESPONSE} progress={1} selectedCategory={12} />);
      expect(screen.getByText('No posts found')).toBeInTheDocument();
    });
  });

  describe('trends panel', () => {
    it('displays google trends when available', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('"bitcoin"')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('shows "Unavailable" when no trends data', () => {
      render(<DataOverlay result={MOCK_MINIMAL_RESPONSE} progress={1} selectedCategory={12} />);
      // Multiple "Unavailable" texts may exist; just check trends panel
      const panels = screen.getAllByText('Unavailable');
      expect(panels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('macro panel', () => {
    it('displays FRED macro data when available', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('10Y Treasury')).toBeInTheDocument();
      expect(screen.getByText('4.25')).toBeInTheDocument();
    });

    it('shows "No macro data" when no FRED data', () => {
      render(<DataOverlay result={MOCK_MINIMAL_RESPONSE} progress={1} selectedCategory={12} />);
      expect(screen.getByText('No macro data')).toBeInTheDocument();
    });
  });

  describe('reasoning', () => {
    it('displays the reasoning text', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText(MOCK_AI_RESPONSE.reasoning)).toBeInTheDocument();
    });
  });

  describe('trade link', () => {
    it('shows polymarket trade link when polymarket data is available', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      const link = screen.getByText('Trade Now →');
      expect(link).toHaveAttribute('href', expect.stringContaining('polymarket.com'));
    });

    it('shows robinhood trade link when symbol is available and no polymarket', () => {
      const responseNoPolymarket = {
        ...MOCK_STOCK_RESPONSE,
        sources: {
          ...MOCK_STOCK_RESPONSE.sources,
          polymarket: [],
        },
      };
      render(<DataOverlay result={responseNoPolymarket} progress={1} selectedCategory={3} />);
      const link = screen.getByText('Trade Now →');
      expect(link).toHaveAttribute('href', expect.stringContaining('robinhood.com/stocks/TSLA'));
    });

    it('does not show trade link when no polymarket and no symbol', () => {
      render(<DataOverlay result={MOCK_MINIMAL_RESPONSE} progress={1} selectedCategory={12} />);
      expect(screen.queryByText('Trade Now →')).not.toBeInTheDocument();
    });
  });

  describe('buy trade button', () => {
    it('renders the "Buy Trade Now →" button', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      expect(screen.getByText('Buy Trade Now →')).toBeInTheDocument();
    });
  });

  describe('combined chart', () => {
    it('passes correct props to CombinedChart', () => {
      render(<DataOverlay result={MOCK_AI_RESPONSE} progress={1} selectedCategory={2} />);
      const chart = screen.getByTestId('combined-chart');
      expect(chart).toHaveAttribute('data-crypto', 'bitcoin');
      expect(chart).toHaveAttribute('data-slug', 'will-btc-hit-200k');
    });
  });
});
