import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as client from '../api/client';
import { MOCK_AI_RESPONSE } from './fixtures';

/* ── Mock heavy dependencies ─── */

// Mock AsciiScene (Three.js)
vi.mock('../components/AsciiScene', () => ({
  default: ({ progress, selectedCategory, phase }: any) => (
    <div data-testid="ascii-scene" data-progress={progress} data-category={selectedCategory} data-phase={phase} />
  ),
}));

// Mock CombinedChart (lightweight-charts)
vi.mock('../components/CombinedChart', () => ({
  default: () => <div data-testid="combined-chart" />,
}));

// Mock API client
vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof client>();
  return {
    ...actual,
    getAiOpinion: vi.fn(),
  };
});

const getAiOpinionMock = vi.mocked(client.getAiOpinion);

// Stub the Polymarket trending fetch
const fetchSpy = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchSpy);
  // Default: Polymarket trending returns fallback (404)
  fetchSpy.mockResolvedValue({
    ok: false,
    status: 404,
    json: () => Promise.resolve([]),
  });
  getAiOpinionMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  describe('initial render', () => {
    it('renders the header', () => {
      render(<App />);
      expect(screen.getByText('brightbet.tech')).toBeInTheDocument();
    });

    it('renders the search input', () => {
      render(<App />);
      expect(screen.getByPlaceholderText('Ask anything...')).toBeInTheDocument();
    });

    it('renders example questions in idle state', () => {
      render(<App />);
      expect(screen.getByText('try asking')).toBeInTheDocument();
    });

    it('renders fallback examples when polymarket fetch fails', () => {
      render(<App />);
      expect(
        screen.getByText('Will Tesla stock reach $500 by end of 2026?'),
      ).toBeInTheDocument();
    });

    it('starts in idle phase', () => {
      render(<App />);
      const scene = screen.getByTestId('ascii-scene');
      expect(scene).toHaveAttribute('data-phase', 'idle');
    });

    it('renders category ring labels in idle', () => {
      render(<App />);
      expect(screen.getByText('Politics')).toBeInTheDocument();
      expect(screen.getByText('Crypto')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
    });

    it('scene progress starts at 0', () => {
      render(<App />);
      const scene = screen.getByTestId('ascii-scene');
      expect(scene).toHaveAttribute('data-progress', '0');
    });
  });

  describe('trending examples', () => {
    it('loads trending examples from polymarket on mount', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { question: 'Will event A happen by 2027?' },
            { question: 'Will event B happen by 2027?' },
            { question: 'Will event C happen by 2027?' },
            { question: 'Short' }, // too short, should be filtered
          ]),
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Will event A happen by 2027?')).toBeInTheDocument();
      });
    });
  });

  describe('search flow', () => {
    it('shows loading state when searching', async () => {
      const user = userEvent.setup();
      getAiOpinionMock.mockReturnValue(new Promise(() => {})); // never resolves

      render(<App />);
      const input = screen.getByPlaceholderText('Ask anything...');
      await user.type(input, 'Will BTC hit 200k?');
      await user.keyboard('{Enter}');

      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
      const scene = screen.getByTestId('ascii-scene');
      expect(scene).toHaveAttribute('data-phase', 'loading');
    });

    it('displays result after successful search', async () => {
      const user = userEvent.setup();
      getAiOpinionMock.mockResolvedValueOnce(MOCK_AI_RESPONSE);

      render(<App />);
      const input = screen.getByPlaceholderText('Ask anything...');
      await user.type(input, 'Will BTC hit 200k?');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        const scene = screen.getByTestId('ascii-scene');
        expect(scene).toHaveAttribute('data-phase', 'animating');
      });
    });

    it('displays error on API failure', async () => {
      const user = userEvent.setup();
      getAiOpinionMock.mockRejectedValueOnce(new Error('Server is down'));

      render(<App />);
      const input = screen.getByPlaceholderText('Ask anything...');
      await user.type(input, 'Will BTC hit 200k?');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Server is down')).toBeInTheDocument();
      });
    });

    it('returns to idle phase on error', async () => {
      const user = userEvent.setup();
      getAiOpinionMock.mockRejectedValueOnce(new Error('fail'));

      render(<App />);
      const input = screen.getByPlaceholderText('Ask anything...');
      await user.type(input, 'test');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        const scene = screen.getByTestId('ascii-scene');
        expect(scene).toHaveAttribute('data-phase', 'idle');
      });
    });

    it('calls getAiOpinion with the trimmed question', async () => {
      const user = userEvent.setup();
      getAiOpinionMock.mockReturnValue(new Promise(() => {}));

      render(<App />);
      const input = screen.getByPlaceholderText('Ask anything...');
      await user.type(input, '  Will BTC hit 200k?  ');
      await user.keyboard('{Enter}');

      expect(getAiOpinionMock).toHaveBeenCalledWith({ question: 'Will BTC hit 200k?' });
    });
  });

  describe('example button clicks', () => {
    it('triggers search when clicking an example', async () => {
      const user = userEvent.setup();
      getAiOpinionMock.mockReturnValue(new Promise(() => {}));

      render(<App />);

      const exampleBtn = screen.getByText('Will Tesla stock reach $500 by end of 2026?');
      await user.click(exampleBtn);

      expect(getAiOpinionMock).toHaveBeenCalledWith({
        question: 'Will Tesla stock reach $500 by end of 2026?',
      });
    });
  });
});
