import type { AiOpinionResponse } from '../api/client';

interface Props {
  result: AiOpinionResponse | null;
}

interface PlanetDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  orbitRadius: number;
  size: number;
  speed: number;
  startAngle: number;
  hasData: boolean;
}

export default function PlanetView({ result }: Props) {
  const planets: PlanetDef[] = [
    {
      id: 'finnhub',
      name: 'Market Data',
      icon: '📈',
      color: '#22c55e',
      orbitRadius: 80,
      size: 36,
      speed: 22,
      startAngle: 0,
      hasData: !!result?.sources?.finnhub,
    },
    {
      id: 'technicals',
      name: 'Technicals',
      icon: '📊',
      color: '#00ced1',
      orbitRadius: 105,
      size: 32,
      speed: 28,
      startAngle: 40,
      hasData: !!result?.sources?.technicals,
    },
    {
      id: 'coingecko',
      name: 'Crypto',
      icon: '🪙',
      color: '#f7931a',
      orbitRadius: 130,
      size: 34,
      speed: 32,
      startAngle: 80,
      hasData: !!result?.sources?.coingecko,
    },
    {
      id: 'feargreed',
      name: 'Fear/Greed',
      icon: '🧭',
      color: '#a855f7',
      orbitRadius: 155,
      size: 30,
      speed: 36,
      startAngle: 120,
      hasData: !!result?.sources?.fearGreed,
    },
    {
      id: 'polymarket',
      name: 'Predictions',
      icon: '🎯',
      color: '#3b82f6',
      orbitRadius: 180,
      size: 34,
      speed: 40,
      startAngle: 160,
      hasData: (result?.sources?.polymarket?.length ?? 0) > 0,
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: '💬',
      color: '#ff4500',
      orbitRadius: 205,
      size: 30,
      speed: 45,
      startAngle: 200,
      hasData: (result?.sources?.reddit?.length ?? 0) > 0,
    },
    {
      id: 'trends',
      name: 'Trends',
      icon: '🔍',
      color: '#4285f4',
      orbitRadius: 225,
      size: 28,
      speed: 50,
      startAngle: 240,
      hasData: !!result?.sources?.googleTrends,
    },
    {
      id: 'fred',
      name: 'Macro',
      icon: '🏛️',
      color: '#1a5276',
      orbitRadius: 245,
      size: 28,
      speed: 55,
      startAngle: 280,
      hasData: (result?.sources?.fred?.length ?? 0) > 0,
    },
    {
      id: 'wikipedia',
      name: 'Knowledge',
      icon: '📚',
      color: '#f59e0b',
      orbitRadius: 260,
      size: 30,
      speed: 60,
      startAngle: 320,
      hasData: (result?.sources?.wikipedia?.length ?? 0) > 0,
    },
  ];

  const centerColor = result
    ? result.confidence_score >= 70
      ? '#22c55e'
      : result.confidence_score >= 40
        ? '#f59e0b'
        : '#ef4444'
    : '#a855f7';

  return (
    <div className="planet-view">
      <div className="planet-container">
        {/* Orbit rings */}
        {planets.map((p) => (
          <div
            key={`orbit-${p.id}`}
            className="orbit-ring"
            style={{
              width: p.orbitRadius * 2,
              height: p.orbitRadius * 2,
              borderColor: `${p.color}22`,
            }}
          />
        ))}

        {/* Center "sun" — AI brain */}
        <div className="center-sun" style={{ boxShadow: `0 0 60px ${centerColor}44, 0 0 120px ${centerColor}22` }}>
          <div className="sun-glow" style={{ background: `radial-gradient(circle, ${centerColor}33, transparent 70%)` }} />
          <span className="sun-icon">✦</span>
          {result && (
            <span className="sun-score" style={{ color: centerColor }}>
              {result.confidence_score}%
            </span>
          )}
        </div>

        {/* Orbiting planets */}
        {planets.map((p) => (
          <div
            key={p.id}
            className={`orbiting-planet ${p.hasData ? 'has-data' : 'no-data'}`}
            style={{
              '--orbit-radius': `${p.orbitRadius}px`,
              '--speed': `${p.speed}s`,
              '--start-angle': `${p.startAngle}deg`,
              '--planet-size': `${p.size}px`,
              '--planet-color': p.color,
            } as React.CSSProperties}
          >
            <div className="planet-body" style={{ width: p.size, height: p.size }}>
              <span className="planet-icon">{p.icon}</span>
            </div>
            <span className="planet-label" style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 4px', borderRadius: '4px' }}>{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
