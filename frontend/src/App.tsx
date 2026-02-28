import { useState } from 'react';
import type { AiOpinionResponse } from './api/client';
import { getAiOpinion } from './api/client';
import SearchBar from './components/SearchBar';
import PlanetView from './components/PlanetView';
import ConfidenceDisplay from './components/ConfidenceDisplay';
import SourceCards from './components/SourceCards';
import Header from './components/Header';

function App() {
  const [result, setResult] = useState<AiOpinionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (question: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getAiOpinion({ question });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  let tradeUrl = undefined;
  if (result) {
    if (result.sources?.polymarket?.[0]?.slug) {
      tradeUrl = `https://polymarket.com/event/${result.sources.polymarket[0].slug}`;
    } else if (result.symbol) {
      tradeUrl = `https://robinhood.com/stocks/${result.symbol}`;
    }
  }

  return (
    <div className="app">
      <div className="stars-bg" />
      <Header />
      <main className="main-content">
        <SearchBar onSearch={handleSearch} loading={loading} />

        {error && <div className="error-banner">{error}</div>}

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Analyzing across data sources...</p>
          </div>
        )}

        {result && (
          <div className="results-container">
            <ConfidenceDisplay
              score={result.confidence_score}
              sentiment={result.sentiment}
              reasoning={result.reasoning}
              question={result.question}
              tradeUrl={tradeUrl}
            />
            <PlanetView result={result} />
            <SourceCards sources={result.sources} symbol={result.symbol} />
          </div>
        )}

        {!result && !loading && (
          <div className="hero-section">
            <PlanetView result={null} />
            <h1 className="hero-title">BRIGHTBET.TECH</h1>
            <p className="hero-subtitle">
              Ask any trade or prediction question. Brightbet.tech analyzes live market signals,
              prediction-market odds, and reference context to deliver a clear confidence score.
            </p>
            <div className="example-questions">
              <button className="example-btn" onClick={() => handleSearch('Will Tesla stock reach $500 by end of 2026?')}>
                TESLA TO $500??
              </button>
              <button className="example-btn" onClick={() => handleSearch('Will Bitcoin hit $200k by December 2026?')}>
                BITCOIN TO $200K??
              </button>
              <button className="example-btn" onClick={() => handleSearch('Will Nvidia remain the most valuable company?')}>
                NVIDIA DOMINATION??
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
