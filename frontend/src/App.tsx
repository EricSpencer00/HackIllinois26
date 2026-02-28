import { useEffect, useState, useRef } from 'react';
import type { AiOpinionResponse } from './api/client';
import { getAiOpinion } from './api/client';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import AsciiScene from './components/AsciiScene';
import type { Phase } from './components/AsciiScene';
import DataOverlay from './components/DataOverlay';
import { CATEGORIES } from './lib/categories';
import { classifyQuestion } from './lib/classify';

const FALLBACK_EXAMPLES = [
  'Will Tesla stock reach $500 by end of 2026?',
  'Will Bitcoin hit $200k by December 2026?',
  'Will Nvidia remain the most valuable company?',
];

/* ── Easing ─── */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function App() {
  const [result, setResult] = useState<AiOpinionResponse | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [examples, setExamples] = useState<string[]>(FALLBACK_EXAMPLES);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const rafRef = useRef<number | null>(null);

  /* ── Fetch trending examples on mount ─── */
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          'https://gamma-api.polymarket.com/markets?closed=false&limit=100&order=volume24hr&ascending=false',
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

  /* ── Wheel handler for interactive phase ─── */
  useEffect(() => {
    if (phase !== 'interactive') return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setProgress((prev) => {
        const delta = e.deltaY / 2000;
        return Math.max(0, Math.min(1, prev + delta));
      });
    };

    // Touch support
    let lastTouchY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = lastTouchY - e.touches[0].clientY;
      lastTouchY = e.touches[0].clientY;
      setProgress((prev) => Math.max(0, Math.min(1, prev + deltaY / 600)));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [phase]);

  /* ── Auto-play animation ─── */
  function autoPlayAnimation() {
    const duration = 4500; // ms
    const start = performance.now();

    function step(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(t);
      setProgress(eased);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setPhase('interactive');
        setShowScrollHint(true);
        // Hide hint after 4 seconds
        setTimeout(() => setShowScrollHint(false), 4000);
      }
    }

    rafRef.current = requestAnimationFrame(step);
  }

  /* ── Search handler ─── */
  const handleSearch = async (question: string) => {
    // Cancel any running auto-play
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setPhase('loading');
    setError(null);
    setResult(null);
    setProgress(0);
    setShowScrollHint(false);

    // Pre-classify by question text alone
    const preIdx = classifyQuestion(question);
    setSelectedCategory(preIdx);

    try {
      const data = await getAiOpinion({ question });
      setResult(data);

      // Refine category with actual response data
      const refinedIdx = classifyQuestion(question, data);
      setSelectedCategory(refinedIdx);

      // Begin auto-play
      setPhase('animating');
      autoPlayAnimation();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setPhase('idle');
    }
  };

  /* When user scrolls all the way back, re-enable search */
  const searchVisible = phase === 'idle' || phase === 'loading' || progress < 0.15;

  return (
    <div className="app">
      {/* Three.js ASCII background */}
      <div className={`ascii-scene-wrapper ${result && progress >= 0.75 ? 'dimmed' : ''}`}>
        <AsciiScene
          progress={progress}
          selectedCategory={selectedCategory}
          phase={phase}
        />
      </div>

      {/* UI layer */}
      <div className="ui-layer">
        <Header />

        <SearchBar
          onSearch={handleSearch}
          loading={phase === 'loading'}
          visible={searchVisible}
        />

        {/* Error */}
        {error && <div className="error-banner">{error}</div>}

        {/* Loading */}
        {phase === 'loading' && (
          <div className="loading-indicator">
            <span className="loading-text">
              analyzing<span className="loading-dots" />
            </span>
          </div>
        )}

        {/* Data overlay (fades in during explosion phase) */}
        {result && (
          <DataOverlay
            result={result}
            progress={progress}
            selectedCategory={selectedCategory}
          />
        )}

        {/* Category ring labels (idle/roulette state) */}
        {(phase === 'idle' || progress < 0.6) && (
          <div className={`category-ring-labels ${progress >= 0.5 ? 'hidden' : ''}`}>
            {CATEGORIES.map((cat, i) => {
              const isIdle = phase === 'idle';
              return (
                <span
                  key={cat.name}
                  className={`cat-label ${
                    !isIdle && i === selectedCategory && progress > 0.3
                      ? 'active'
                      : !isIdle && progress > 0.35 && i !== selectedCategory
                        ? 'dimmed'
                        : ''
                  }`}
                >
                  {cat.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Examples (only in idle) */}
        {phase === 'idle' && (
          <div className="examples">
            <span className="examples-label">try asking</span>
            {examples.map((q, i) => (
              <button key={i} className="example-btn" onClick={() => handleSearch(q)}>
                {q.length > 70 ? q.slice(0, 67) + '...' : q}
              </button>
            ))}
          </div>
        )}

        {/* Scroll hint after animation */}
        {phase === 'interactive' && (
          <div className={`scroll-hint ${showScrollHint ? '' : 'hidden'}`}>
            scroll to explore
            <span className="scroll-arrow">↕</span>
          </div>
        )}
      </div>
    </div>
  );
}
