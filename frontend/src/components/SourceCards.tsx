import type { Source } from '../api/client';

interface Props {
  sources: Source;
  symbol: string | null;
}

export default function SourceCards({ sources, symbol }: Props) {
  return (
    <div className="source-cards">
      {/* Finnhub Card */}
      <div className="source-card finnhub">
        <div className="source-card-header">
          <span className="source-icon">✦</span>
          <h3>Market Data</h3>
          {symbol && <span className="ticker-badge">${symbol}</span>}
        </div>
        {sources.finnhub ? (
          <div className="source-card-body">
            <div className="stock-quote">
              <div className="quote-price">${sources.finnhub.quote.price ?? 'N/A'}</div>
              <div
                className={`quote-change ${
                  (sources.finnhub.quote.changePercent ?? 0) >= 0 ? 'positive' : 'negative'
                }`}
              >
                {(sources.finnhub.quote.changePercent ?? 0) >= 0 ? '▲' : '▼'}{' '}
                {sources.finnhub.quote.changePercent?.toFixed(2) ?? 0}%
              </div>
            </div>
            {sources.finnhub.news.length > 0 && (
              <div className="news-list">
                {sources.finnhub.news.slice(0, 3).map((n, i) => (
                  <div key={i} className="news-item">
                    <span className="news-dot">•</span>
                    <span>{n.headline}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="source-empty">No stock symbol detected in query</p>
        )}
      </div>

      {/* Polymarket Card */}
      <div className="source-card polymarket">
        <div className="source-card-header">
          <span className="source-icon">✦</span>
          <h3>Prediction Markets</h3>
        </div>
        {sources.polymarket.length > 0 ? (
          <div className="source-card-body">
            {sources.polymarket.slice(0, 3).map((m, i) => (
              <div key={i} className="market-item">
                <span className="market-question">{m.question}</span>
                <div className="market-prices">
                  {m.yes_price && (
                    <span className="price-tag yes">YES {(parseFloat(m.yes_price) * 100).toFixed(0)}¢</span>
                  )}
                  {m.no_price && (
                    <span className="price-tag no">NO {(parseFloat(m.no_price) * 100).toFixed(0)}¢</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="source-empty">No matching prediction markets found</p>
        )}
      </div>

      {/* Wikipedia Card */}
      <div className="source-card wikipedia">
        <div className="source-card-header">
          <span className="source-icon">✦</span>
          <h3>Knowledge Base</h3>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <img src="https://web.archive.org/web/20090902015703im_/http://geocities.com/gateofknowledge/banner1.gif" alt="Knowledge Banner" />
        </div>
        {sources.wikipedia.length > 0 ? (
          <div className="source-card-body">
            {sources.wikipedia.slice(0, 3).map((w, i) => (
              <div key={i} className="wiki-item">
                <h4>{w.title}</h4>
                <p>{w.summary.slice(0, 200)}{w.summary.length > 200 ? '...' : ''}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="source-empty">No Wikipedia results found</p>
        )}
      </div>
    </div>
  );
}
