import { useEffect, useState } from 'react';
import type { AiOpinionResponse } from './api/client';
import { getAiOpinion } from './api/client';
import SearchBar from './components/SearchBar';
import PlanetView from './components/PlanetView';
import ConfidenceDisplay from './components/ConfidenceDisplay';
import SourceCards from './components/SourceCards';
import Header from './components/Header';

const FALLBACK_EXAMPLES = [
  'Will Tesla stock reach $500 by end of 2026?',
  'Will Bitcoin hit $200k by December 2026?',
  'Will Nvidia remain the most valuable company?',
];

function App() {
  const [result, setResult] = useState<AiOpinionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examples, setExamples] = useState<string[]>(FALLBACK_EXAMPLES);

  // Fetch live trending Polymarket questions on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          'https://gamma-api.polymarket.com/markets?closed=false&limit=100&order=volume24hr&ascending=false'
        );
        const markets: any[] = await resp.json();
        const questions = markets
          .filter((m: any) => m.question && m.question.length > 15 && m.question.length < 100)
          .slice(0, 3)
          .map((m: any) => m.question as string);
        if (questions.length >= 2) setExamples(questions);
      } catch {
        // keep fallback
      }
    })();
  }, []);

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
    if ((result.sources?.polymarket?.length ?? 0) > 0) {
      // Link to Polymarket search for the question — always live, slug URLs are often stale
      tradeUrl = `https://polymarket.com/markets?q=${encodeURIComponent(result.question)}`;
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
              {examples.map((q, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => handleSearch(q)}
                >
                  {q.length > 50 ? q.slice(0, 47) + '...' : q}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
