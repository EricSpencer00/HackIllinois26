/**
 * DataOverlay — Combined chart + data panels with confidence in the center.
 * Fades in during the explosion phase (progress ≥ 0.75).
 */

import { useState } from 'react';
import type { AiOpinionResponse } from '../api/client';
import { generateImage } from '../api/client';
import { CATEGORIES } from '../lib/categories';
import CombinedChart from './CombinedChart';

interface Props {
  result: AiOpinionResponse;
  progress: number;
  selectedCategory: number;
  onBack?: () => void;
}

export default function DataOverlay({ result, progress, selectedCategory, onBack }: Props) {
  const visible = progress >= 0.75;
  const category = CATEGORIES[selectedCategory]?.name ?? 'Other';

  const {
    confidence_score: score,
    sentiment,
    reasoning,
    question,
    sources,
    symbol,
    cryptoId,
  } = result;

  // Build trade URL
  let tradeUrl: string | undefined;
  if ((sources?.polymarket?.length ?? 0) > 0) {
    tradeUrl = `https://polymarket.com/markets?q=${encodeURIComponent(question)}`;
  } else if (symbol) {
    tradeUrl = `https://robinhood.com/stocks/${symbol}`;
  }

  // Get first polymarket slug for chart
  const polymarketSlug = sources?.polymarket?.[0]?.slug ?? null;

  return (
    <div className={`data-overlay ${visible ? 'visible' : ''}`}>
      <div className="data-overlay-inner">
        {/* Category + Question */}
        <span className="data-category-badge">{category}</span>
        <p className="data-question">"{question}"</p>

        {/* Combined Chart — replaces the old top row (Market, Technicals, Crypto) */}
        <CombinedChart
          symbol={symbol}
          cryptoId={cryptoId ?? null}
          polymarketSlug={polymarketSlug}
          question={question}
        />

        {/* 2×3 Data Grid (remaining panels) */}
        <div className="data-grid data-grid-2x3">
          {/* Row 1 */}
          <FearGreedPanel sources={sources} />
          <ConfidencePanel score={score} sentiment={sentiment} />
          <PolymarketPanel sources={sources} />

          {/* Row 2 */}
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

        {/* Combined AI Button — Handles both visual and meme creation via single endpoint */}
        <AiActionButtons 
          question={question} 
          sentiment={sentiment || 'neutral'} 
          confidence={score || 50} 
        />

        {/* Back button */}
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← back
          </button>
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

function AiActionButtons({ 
  question, 
  sentiment, 
  confidence 
}: { 
  question: string; 
  sentiment: string; 
  confidence: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleVisualize = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const result = await generateImage(question, sentiment, confidence);
      if (result?.type === 'image' && result.imageData) {
        setImageUrl(result.imageData);
      } else {
        setError('Generation not available');
      }
    } catch (err: any) {
      setError('Failed to generate visualization');
    } finally {
      setLoading(false);
    }
  };

  const handleMemePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(question);
      const resp = await fetch(`/api/rickroll?question=${q}`);
      const data = await resp.json();
      const checkoutUrl = data?.paymentOptions?.stripe?.checkoutUrl;
      if (checkoutUrl) window.location.href = checkoutUrl;
      else setError('Checkout unavailable');
    } catch (err) {
      setError('Payment setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-actions-container">
      <div className="trade-link-container" style={{ gap: 12, display: 'flex', flexWrap: 'wrap' }}>
        <button className="trade-link" onClick={handleVisualize} disabled={loading} style={{ flex: 1, minWidth: 200 }}>
          {loading ? 'Processing...' : 'Generate Visualization →'}
        </button>
        <button className="trade-link buy-trade-btn" onClick={handleMemePayment} disabled={loading} style={{ flex: 1, minWidth: 200 }}>
          {loading ? 'Processing...' : 'Unlock Premium Meme →'}
        </button>
      </div>
      
      {error && <p style={{ color: '#666', fontSize: 10, marginTop: 8, textAlign: 'center' }}>{error}</p>}
      
      {imageUrl && (
        <div className="ai-result-preview">
          <img src={imageUrl} alt="AI output" style={{ maxWidth: '100%', borderRadius: 4 }} />
          <button onClick={() => setImageUrl(null)} className="close-preview-btn">Close</button>
        </div>
      )}
    </div>
  );
}

function BuyTradeButton({ question = 'This is hilarious' }: { question?: string }) {
  return null; // Combined into AiActionButtons above
}

function GenerateVisualizationButton({ 
  question = 'Market Analysis', 
  sentiment = 'neutral', 
  confidence = 50 
}: { 
  question?: string; 
  sentiment?: string; 
  confidence?: number;
}) {
  return null; // Combined into AiActionButtons above
}
