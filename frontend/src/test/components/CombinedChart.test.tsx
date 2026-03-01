import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CombinedChart from '../../components/CombinedChart';
import * as client from '../../api/client';

// Mock the canvas-based chart library
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
    })),
    priceScale: vi.fn(() => ({
      applyOptions: vi.fn(),
    })),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
    })),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  })),
  CandlestickSeries: 'CandlestickSeries',
  LineSeries: 'LineSeries',
  ColorType: { Solid: 'Solid' },
}));

// Spy on getCandles
vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof client>();
  return {
    ...actual,
    getCandles: vi.fn(),
  };
});

const getCandlesMock = vi.mocked(client.getCandles);

describe('CombinedChart', () => {
  beforeEach(() => {
    getCandlesMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially when there are data sources', () => {
    getCandlesMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <CombinedChart symbol="AAPL" cryptoId={null} polymarketSlug={null} question="test" />,
    );
    expect(screen.getByText(/loading chart/i)).toBeInTheDocument();
  });

  it('renders nothing when no data sources and no data returned', async () => {
    getCandlesMock.mockResolvedValueOnce({ series: [] });
    const { container } = render(
      <CombinedChart symbol="AAPL" cryptoId={null} polymarketSlug={null} question="test" />,
    );
    await waitFor(() => {
      expect(screen.queryByText(/loading chart/i)).not.toBeInTheDocument();
    });
    // Should render null (empty)
    expect(container.querySelector('.chart-container')).toBeNull();
  });

  it('does not fetch when all inputs are null', () => {
    render(
      <CombinedChart symbol={null} cryptoId={null} polymarketSlug={null} question="test" />,
    );
    expect(getCandlesMock).not.toHaveBeenCalled();
  });

  it('fetches candles when symbol is provided', async () => {
    getCandlesMock.mockResolvedValueOnce({
      series: [
        {
          id: 'aapl',
          label: 'AAPL',
          type: 'candlestick',
          data: [{ time: '2026-01-01', open: 100, high: 110, low: 95, close: 105 }],
          color: '#fff',
        },
      ],
    });

    render(
      <CombinedChart symbol="AAPL" cryptoId={null} polymarketSlug={null} question="test" />,
    );

    await waitFor(() => {
      expect(getCandlesMock).toHaveBeenCalledWith({
        symbol: 'AAPL',
        cryptoId: null,
        polymarketSlug: null,
      });
    });
  });

  it('renders legend when data is available', async () => {
    getCandlesMock.mockResolvedValueOnce({
      series: [
        {
          id: 'btc',
          label: 'BTC/USD',
          type: 'candlestick',
          data: [{ time: '2026-01-01', open: 90000, high: 95000, low: 88000, close: 93000 }],
          color: '#fff',
        },
      ],
    });

    render(
      <CombinedChart symbol={null} cryptoId="bitcoin" polymarketSlug={null} question="test" />,
    );

    await waitFor(() => {
      expect(screen.getByText('BTC/USD')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    getCandlesMock.mockRejectedValueOnce(new Error('network error'));
    const { container } = render(
      <CombinedChart symbol="FAIL" cryptoId={null} polymarketSlug={null} question="test" />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading chart/i)).not.toBeInTheDocument();
    });
    // Should not crash, renders null when series is empty
    expect(container.querySelector('.chart-container')).toBeNull();
  });
});
