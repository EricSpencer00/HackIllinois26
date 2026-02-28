/**
 * DataOverlay — 3×3 floating grid of source data with confidence in the center.
 * Fades in during the explosion phase (progress ≥ 0.75).
 */

import type { AiOpinionResponse } from '../api/client';
import { CATEGORIES } from '../lib/categories';

interface Props {
  result: AiOpinionResponse;
  progress: number;
  selectedCategory: number;
}

export default function DataOverlay({ result, progress, selectedCategory }: Props) {
  const visible = progress >= 0.75;
  const category = CATEGORIES[selectedCategory]?.name ?? 'Other';

  const {
    confidence_score: score,
    sentiment,
    reasoning,
    question,
    sources,
    symbol,
  } = result;

  // Build trade URL (preserve existing logic)
  let tradeUrl: string | undefined;
  if ((sources?.polymarket?.length ?? 0) > 0) {
    tradeUrl = `https://polymarket.com/markets?q=${encodeURIComponent(question)}`;
  } else if (symbol) {
    tradeUrl = `https://robinhood.com/stocks/${symbol}`;
  }

  return (
    <div className={`data-overlay ${visible ? 'visible' : ''}`}>
      <div className="data-overlay-inner">
        {/* Category + Question */}
        <span className="data-category-badge">{category}</span>
        <p className="data-question">"{question}"</p>

        {/* 3×3 Data Grid */}
        <div className="data-grid">
          {/* Row 1 */}
          <MarketDataPanel sources={sources} symbol={symbol} />
          <TechnicalsPanel sources={sources} symbol={symbol} />
          <CryptoPanel sources={sources} />

          {/* Row 2 */}
          <FearGreedPanel sources={sources} />
          <ConfidencePanel score={score} sentiment={sentiment} />
          <PolymarketPanel sources={sources} />

          {/* Row 3 */}
          <RedditPanel sources={sources} />
          <TrendsPanel sources={sources} />
          <MacroPanel sources={sources} />
        </div>

        {/* Reasoning */}
        <div className="reasoning-section">
          <p className="reasoning-text">{reasoning}</p>
        </div>

        {/* Trade link */}
        {tradeUrl && (
          <div className="trade-link-container">
            <a
              href={tradeUrl}
              target="_blank"
              rel="noreferrer"
              className="trade-link"
            >
              Trade Now →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-panels ─── */

function ConfidencePanel({ score, sentiment }: { score: number; sentiment: string }) {
  return (
    <div className="data-panel confidence-cell">
      <span className="confidence-score">
        {score}<span className="confidence-percent">%</span>
      </span>
      <span className="confidence-label">confidence</span>
      <span className="confidence-sentiment">{sentiment}</span>
    </div>
  );
}

function MarketDataPanel({ sources, symbol }: { sources: AiOpinionResponse['sources']; symbol: string | null }) {
  const fh = sources.finnhub;
  return (
    <div className="data-panel">
      <h4>Market Data{symbol ? ` · ${symbol}` : ''}</h4>
      {fh ? (
        <>
          <span className="value">${fh.quote.price ?? '—'}</span>
          <span className={`change ${(fh.quote.changePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}>
            {(fh.quote.changePercent ?? 0) >= 0 ? '▲' : '▼'} {fh.quote.changePercent?.toFixed(2) ?? 0}%
          </span>
          {fh.news.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {fh.news.slice(0, 2).map((n, i) => (
                <div key={i} className="news-item">· {n.headline}</div>
              ))}
            </div>
          )}
        </>
      ) : (
        <span className="subtitle">No stock data</span>
      )}
    </div>
  );
}

function TechnicalsPanel({ sources, symbol }: { sources: AiOpinionResponse['sources']; symbol: string | null }) {
  const t = sources.technicals;
  return (
    <div className="data-panel">
      <h4>Technicals</h4>
      {t ? (
        <div className="item-list">
          {t.rsi !== null && (
            <div className="item-row">
              <span className="item-label">RSI (14)</span>
              <span className="item-value">{t.rsi.toFixed(1)}</span>
            </div>
          )}
          {t.macd !== null && (
            <div className="item-row">
              <span className="item-label">MACD</span>
              <span className="item-value">{t.macd.toFixed(3)}</span>
            </div>
          )}
          {t.sma50 !== null && (
            <div className="item-row">
              <span className="item-label">SMA 50</span>
              <span className="item-value">${t.sma50.toFixed(0)}</span>
            </div>
          )}
          {t.sma200 !== null && (
            <div className="item-row">
              <span className="item-label">SMA 200</span>
              <span className="item-value">${t.sma200.toFixed(0)}</span>
            </div>
          )}
        </div>
      ) : (
        <span className="subtitle">{symbol ? 'Unavailable' : 'Stocks only'}</span>
      )}
    </div>
  );
}

function CryptoPanel({ sources }: { sources: AiOpinionResponse['sources'] }) {
  const c = sources.coingecko;
  return (
    <div className="data-panel">
      <h4>Crypto</h4>
      {c ? (
        <>
          <span className="value">${c.price?.toLocaleString() ?? '—'}</span>
          <span className={`change ${(c.change24h ?? 0) >= 0 ? 'positive' : 'negative'}`}>
            {(c.change24h ?? 0) >= 0 ? '▲' : '▼'} {c.change24h?.toFixed(2)}% 24h
          </span>
          <div className="item-list" style={{ marginTop: 6 }}>
            {c.change7d !== null && (
              <div className="item-row">
                <span className="item-label">7d</span>
                <span className="item-value">{c.change7d.toFixed(2)}%</span>
              </div>
            )}
            {c.marketCap !== null && (
              <div className="item-row">
                <span className="item-label">MCap</span>
                <span className="item-value">${(c.marketCap / 1e9).toFixed(1)}B</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <span className="subtitle">No crypto detected</span>
      )}
    </div>
  );
}

function FearGreedPanel({ sources }: { sources: AiOpinionResponse['sources'] }) {
  const fg = sources.fearGreed;
  return (
    <div className="data-panel">
      <h4>Fear & Greed</h4>
      {fg ? (
        <>
          <span className="value">{fg.value}</span>
          <span className="subtitle">{fg.label}</span>
          <div style={{ marginTop: 8, height: 4, background: '#222', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: -2,
                left: `${fg.value}%`,
                width: 3,
                height: 8,
                background: '#fff',
              }}
            />
          </div>
        </>
      ) : (
        <span className="subtitle">Unavailable</span>
      )}
    </div>
  );
}

function PolymarketPanel({ sources }: { sources: AiOpinionResponse['sources'] }) {
  const pm = sources.polymarket;
  return (
    <div className="data-panel">
      <h4>Predictions</h4>
      {pm && pm.length > 0 ? (
        <div className="item-list">
          {pm.slice(0, 2).map((m, i) => {
            const yesP = m.yes_price ? (parseFloat(m.yes_price) * 100).toFixed(0) : null;
            const noP = m.no_price ? (parseFloat(m.no_price) * 100).toFixed(0) : null;
            return (
              <div key={i} style={{ marginBottom: 6 }}>
                <div className="news-item" style={{ fontSize: 10, marginBottom: 4 }}>{m.question}</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                  {yesP && <span>YES {yesP}¢</span>}
                  {noP && <span style={{ color: '#666' }}>NO {noP}¢</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <span className="subtitle">No markets found</span>
      )}
    </div>
  );
}

function RedditPanel({ sources }: { sources: AiOpinionResponse['sources'] }) {
  const rdt = sources.reddit;
  return (
    <div className="data-panel">
      <h4>Reddit</h4>
      {rdt && rdt.length > 0 ? (
        <div className="item-list">
          {rdt.slice(0, 3).map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noreferrer" className="news-item" style={{ display: 'block' }}>
              <span style={{ color: '#666', fontSize: 9 }}>r/{r.subreddit} · ▲{r.score}</span>
              <br />
              {r.title.length > 60 ? r.title.slice(0, 57) + '...' : r.title}
            </a>
          ))}
        </div>
      ) : (
        <span className="subtitle">No posts found</span>
      )}
    </div>
  );
}

function TrendsPanel({ sources }: { sources: AiOpinionResponse['sources'] }) {
  const gt = sources.googleTrends;
  return (
    <div className="data-panel">
      <h4>Trends</h4>
      {gt ? (
        <>
          <span className="value" style={{ fontSize: 14 }}>"{gt.keyword}"</span>
          <span className="subtitle">{gt.interest}</span>
          {gt.relatedQueries && gt.relatedQueries.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {gt.relatedQueries.slice(0, 4).map((q, i) => (
                <span key={i} style={{
                  fontSize: 9,
                  padding: '2px 6px',
                  border: '1px solid #333',
                  color: '#aaa',
                }}>
                  {q}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <span className="subtitle">Unavailable</span>
      )}
    </div>
  );
}

function MacroPanel({ sources }: { sources: AiOpinionResponse['sources'] }) {
  const fred = sources.fred;
  return (
    <div className="data-panel">
      <h4>Macro</h4>
      {fred && fred.length > 0 ? (
        <div className="item-list">
          {fred.slice(0, 4).map((f, i) => (
            <div key={i} className="item-row">
              <span className="item-label">{f.label}</span>
              <span className="item-value">{f.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <span className="subtitle">No macro data</span>
      )}
    </div>
  );
}
