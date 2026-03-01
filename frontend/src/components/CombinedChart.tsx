/**
 * CombinedChart — Polymarket-style candlestick chart using TradingView's lightweight-charts.
 * Shows up to 3 data series (stock candles, crypto candles, Polymarket probability line)
 * on one chart with a clean dark theme.
 */

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, ColorType } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import { getCandles } from '../api/client';
import type { ChartSeries, CandleDataPoint, LineDataPoint } from '../api/client';

interface Props {
  symbol: string | null;
  cryptoId: string | null;
  polymarketSlug: string | null;
  question: string;
}

export default function CombinedChart({ symbol, cryptoId, polymarketSlug }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [series, setSeries] = useState<ChartSeries[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch candle data when inputs change
  useEffect(() => {
    if (!symbol && !cryptoId && !polymarketSlug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getCandles({ symbol, cryptoId, polymarketSlug })
      .then((data) => {
        if (!cancelled) {
          setSeries(data.series || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, cryptoId, polymarketSlug]);

  // Create/update the chart when data arrives
  useEffect(() => {
    if (!containerRef.current || series.length === 0) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 320,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#555',
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        vertLine: { color: '#333', width: 1, style: 3 /* Dashed */ },
        horzLine: { color: '#333', width: 1, style: 3 },
      },
      timeScale: {
        borderColor: '#222',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#222',
      },
      leftPriceScale: {
        visible: false,
      },
    });

    chartRef.current = chart;

    let hasPolymarket = false;

    for (const s of series) {
      if (s.type === 'candlestick') {
        const candle = chart.addSeries(CandlestickSeries, {
          upColor: '#ffffff',
          downColor: '#444444',
          borderUpColor: '#ffffff',
          borderDownColor: '#444444',
          wickUpColor: '#888888',
          wickDownColor: '#555555',
          priceScaleId: 'right',
        });
        candle.setData(s.data as CandleDataPoint[]);
      } else if (s.type === 'line') {
        hasPolymarket = true;
        // Polymarket probability on a secondary axis
        const line = chart.addSeries(LineSeries, {
          color: s.color || '#3b82f6',
          lineWidth: 2,
          priceScaleId: 'polymarket',
          lastValueVisible: true,
          priceLineVisible: false,
        });
        line.setData(s.data as LineDataPoint[]);

        // Configure the secondary scale
        chart.priceScale('polymarket').applyOptions({
          scaleMargins: { top: 0.05, bottom: 0.05 },
          borderColor: '#222',
        });
      }
    }

    // If only polymarket line, use right price scale instead
    if (hasPolymarket && series.length === 1) {
      // Re-create with right scale
      chart.remove();
      chartRef.current = null;

      const chart2 = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 320,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#555',
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.03)' },
          horzLines: { color: 'rgba(255,255,255,0.03)' },
        },
        crosshair: {
          vertLine: { color: '#333', width: 1, style: 3 },
          horzLine: { color: '#333', width: 1, style: 3 },
        },
        timeScale: { borderColor: '#222', timeVisible: false },
        rightPriceScale: { borderColor: '#222' },
      });

      const polyData = series[0];
      const line = chart2.addSeries(LineSeries, {
        color: polyData.color || '#3b82f6',
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineColor: '#3b82f6',
      });
      line.setData(polyData.data as LineDataPoint[]);
      chart2.timeScale().fitContent();
      chartRef.current = chart2;
    } else {
      chart.timeScale().fitContent();
    }

    // Responsive resize
    const observer = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [series]);

  // Don't render anything if there's no data sources at all
  if (!loading && series.length === 0) {
    return null;
  }

  return (
    <div className="chart-container">
      {/* Legend */}
      {series.length > 0 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.id} className="chart-legend-item">
              <span
                className="chart-legend-dot"
                style={{
                  background: s.type === 'candlestick' ? '#fff' : (s.color || '#3b82f6'),
                }}
              />
              {s.label}
              {s.type === 'line' && <span className="chart-legend-unit">%</span>}
            </span>
          ))}
        </div>
      )}

      {/* Chart canvas or loading state */}
      {loading ? (
        <div className="chart-loading">
          <span className="loading-text">loading chart<span className="loading-dots" /></span>
        </div>
      ) : (
        <div ref={containerRef} className="chart-canvas" />
      )}
    </div>
  );
}
