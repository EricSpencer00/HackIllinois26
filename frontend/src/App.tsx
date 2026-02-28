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
            <div className="source-card graph-section" style={{ marginTop: '20px', border: '4px ridge var(--accent-orange)' }}>
              <div className="source-card-header">
                <span className="source-icon">✦</span>
                <h3>Graph Section</h3>
              </div>
              <iframe 
                src="https://web.archive.org/web/20091026165411/http://www.geocities.com/witchesgrave/the_heavens/interactive_page.html"
                width="100%" 
                height="400px" 
                style={{ border: 'none', background: '#000' }}
              />
            </div>
            <SourceCards sources={result.sources} symbol={result.symbol} />
          </div>
        )}

        {!result && !loading && (
          <div className="hero-section">
            <PlanetView result={null} />
            <h1 style={{ color: 'var(--accent-orange)', fontSize: '4rem', marginBottom: '20px', fontStyle: 'italic' }}>SPACE JAM AI</h1>
            <p className="hero-subtitle">
              YOU READY TO RUMBLE? Ask any trade or prediction question. Our AI analyzes data from multiple
              sources to give you a confidence score. IT'S YOUR CHANCE, DO YOUR DANCE!
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
        
        {/* Ads Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '60px', marginBottom: '80px', flexWrap: 'wrap', gap: '20px', padding: '20px', borderTop: '4px ridge var(--accent-orange)' }}>
          <img src="https://web.archive.org/web/20061002101430/http://www.geocities.com/artboook2004/336x280_c.gif" alt="Tasteful Ad 1" />
          <iframe src="https://web.archive.org/web/20090831071934/http://geocities.com/casinotop10/jackpot_nn4.html" width="400" height="200" style={{border:0}}></iframe>
          <img src="https://web.archive.org/web/20020327114437/http://geocities.com:80/alphonso69fr/5star1_250x250.gif" alt="Tasteful Ad 2" />
        </div>

      </main>

      <div style={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 1000, pointerEvents: 'none', backgroundColor: '#000', borderTop: '2px solid var(--accent-orange)' }}>
        {/* @ts-ignore */}
        <marquee direction="right" scrollamount="12" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="https://web.archive.org/web/20090805045048im_/http://geocities.com/TimesSquare/Frontier/3712/warnerbrothers/bugsrun.gif" alt="Bugs Running" height="60" />
        {/* @ts-ignore */}
        </marquee>
      </div>

    </div>
  );
}

export default App;
