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
          <span className="source-icon">📈</span>
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

      {/* Technical Indicators Card */}
      <div className="source-card technicals">
        <div className="source-card-header">
          <span className="source-icon">📊</span>
          <h3>Technical Indicators</h3>
        </div>
        {sources.technicals ? (
          <div className="source-card-body">
            <div className="technicals-grid">
              {sources.technicals.rsi !== null && (
                <div className="tech-item">
                  <span className="tech-label">RSI (14)</span>
                  <span className={`tech-value ${sources.technicals.rsi > 70 ? 'overbought' : sources.technicals.rsi < 30 ? 'oversold' : ''}`}>
                    {sources.technicals.rsi.toFixed(1)}
                  </span>
                  <span className="tech-signal">
                    {sources.technicals.rsi > 70 ? '⚠ Overbought' : sources.technicals.rsi < 30 ? '⚠ Oversold' : '✓ Neutral'}
                  </span>
                </div>
              )}
              {sources.technicals.macd !== null && (
                <div className="tech-item">
                  <span className="tech-label">MACD</span>
                  <span className="tech-value">{sources.technicals.macd.toFixed(3)}</span>
                  {sources.technicals.macdSignal !== null && (
                    <span className="tech-signal">
                      Signal: {sources.technicals.macdSignal.toFixed(3)}
                    </span>
                  )}
                </div>
              )}
              {sources.technicals.sma50 !== null && (
                <div className="tech-item">
                  <span className="tech-label">SMA (50)</span>
                  <span className="tech-value">${sources.technicals.sma50.toFixed(2)}</span>
                </div>
              )}
              {sources.technicals.sma200 !== null && (
                <div className="tech-item">
                  <span className="tech-label">SMA (200)</span>
                  <span className="tech-value">${sources.technicals.sma200.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="source-empty">Technical data unavailable — check API key</p>
        )}
      </div>

      {/* CoinGecko Card */}
      <div className="source-card coingecko">
        <div className="source-card-header">
          <span className="source-icon">🪙</span>
          <h3>Crypto Data</h3>
        </div>
        {sources.coingecko ? (
          <div className="source-card-body">
            <div className="crypto-header">
              <span className="crypto-name">{sources.coingecko.name} ({sources.coingecko.symbol})</span>
            </div>
            <div className="stock-quote">
              <div className="quote-price">${sources.coingecko.price?.toLocaleString() ?? 'N/A'}</div>
              <div className={`quote-change ${(sources.coingecko.change24h ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                {(sources.coingecko.change24h ?? 0) >= 0 ? '▲' : '▼'} {sources.coingecko.change24h?.toFixed(2)}% (24h)
              </div>
            </div>
            <div className="crypto-stats">
              {sources.coingecko.change7d !== null && (
                <span className={`price-tag ${sources.coingecko.change7d >= 0 ? 'yes' : 'no'}`}>
                  7d: {sources.coingecko.change7d.toFixed(2)}%
                </span>
              )}
              {sources.coingecko.marketCap !== null && (
                <span className="price-tag neutral">MCap: ${(sources.coingecko.marketCap / 1e9).toFixed(1)}B</span>
              )}
              {sources.coingecko.ath !== null && (
                <span className="price-tag neutral">ATH: ${sources.coingecko.ath.toLocaleString()}</span>
              )}
            </div>
          </div>
        ) : (
          <p className="source-empty">No cryptocurrency detected in query</p>
        )}
      </div>

      {/* Fear & Greed Index Card */}
      <div className="source-card feargreed">
        <div className="source-card-header">
          <span className="source-icon">🧭</span>
          <h3>Fear & Greed</h3>
        </div>
        {sources.fearGreed ? (
          <div className="source-card-body">
            <div className="fear-greed-display">
              <div className="fg-value" style={{
                color: sources.fearGreed.value <= 25 ? 'var(--accent-red)' :
                       sources.fearGreed.value <= 45 ? '#ff8c00' :
                       sources.fearGreed.value <= 55 ? 'var(--accent-amber)' :
                       sources.fearGreed.value <= 75 ? '#90ee90' : 'var(--accent-green)'
              }}>
                {sources.fearGreed.value}
              </div>
              <div className="fg-label">{sources.fearGreed.label}</div>
              <div className="fg-bar">
                <div className="fg-fill" style={{ width: `${sources.fearGreed.value}%` }} />
              </div>
              <div className="fg-date">{sources.fearGreed.timestamp}</div>
            </div>
          </div>
        ) : (
          <p className="source-empty">Fear & Greed data unavailable</p>
        )}
      </div>

      {/* Polymarket Card */}
      <div className="source-card polymarket">
        <div className="source-card-header">
          <span className="source-icon">🎯</span>
          <h3>Prediction Markets</h3>
        </div>
        {sources.polymarket.length > 0 ? (
          <div className="source-card-body">
            {sources.polymarket.slice(0, 3).map((m, i) => (
              <a
                key={i}
                className="market-item"
                href={`https://polymarket.com/markets?q=${encodeURIComponent(m.question)}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                <span className="market-question">{m.question}</span>
                <div className="market-prices">
                  {m.yes_price && (
                    <span className="price-tag yes">YES {(parseFloat(m.yes_price) * 100).toFixed(0)}¢</span>
                  )}
                  {m.no_price && (
                    <span className="price-tag no">NO {(parseFloat(m.no_price) * 100).toFixed(0)}¢</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="source-empty">No matching prediction markets found</p>
        )}
      </div>

      {/* Reddit Sentiment Card */}
      <div className="source-card reddit">
        <div className="source-card-header">
          <span className="source-icon">💬</span>
          <h3>Reddit Sentiment</h3>
        </div>
        {sources.reddit && sources.reddit.length > 0 ? (
          <div className="source-card-body">
            {sources.reddit.slice(0, 4).map((r, i) => (
              <a key={i} className="reddit-item" href={r.url} target="_blank" rel="noreferrer">
                <span className="reddit-sub">r/{r.subreddit}</span>
                <span className="reddit-title">{r.title}</span>
                <span className="reddit-meta">▲ {r.score} · {r.created}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="source-empty">No relevant Reddit posts found</p>
        )}
      </div>

      {/* Google Trends Card */}
      <div className="source-card trends">
        <div className="source-card-header">
          <span className="source-icon">🔍</span>
          <h3>Search Trends</h3>
        </div>
        {sources.googleTrends ? (
          <div className="source-card-body">
            <div className="trends-display">
              <span className="trends-keyword">"{sources.googleTrends.keyword}"</span>
              <span className="trends-interest">{sources.googleTrends.interest}</span>
            </div>
            {sources.googleTrends.relatedQueries && sources.googleTrends.relatedQueries.length > 0 && (
              <div className="related-queries">
                <span className="rq-label">People also search:</span>
                {sources.googleTrends.relatedQueries.map((q, i) => (
                  <span key={i} className="rq-tag">{q}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="source-empty">Trends data unavailable</p>
        )}
      </div>

      {/* FRED Macro Data Card */}
      <div className="source-card fred">
        <div className="source-card-header">
          <span className="source-icon">🏛️</span>
          <h3>Macro Indicators</h3>
        </div>
        {sources.fred && sources.fred.length > 0 ? (
          <div className="source-card-body">
            <div className="fred-grid">
              {sources.fred.map((f, i) => (
                <div key={i} className="fred-item">
                  <span className="fred-label">{f.label}</span>
                  <span className="fred-value">{f.value}</span>
                  <span className="fred-date">{f.date}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="source-empty">Add FRED API key for macro economic data</p>
        )}
      </div>

      {/* Wikipedia Card */}
      <div className="source-card wikipedia">
        <div className="source-card-header">
          <span className="source-icon">📚</span>
          <h3>Knowledge Base</h3>
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
