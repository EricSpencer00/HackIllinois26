/**
 * /planet-categories ENDPOINT (GET)
 * Returns the available data sources and their metadata for the planet UI.
 */

export async function handlePlanetCategories(): Promise<Response> {
  const categories = [
    {
      id: 'ai',
      name: 'AI Analysis',
      icon: '🧠',
      color: '#a855f7',
      description: 'Groq LLM-powered analysis with confidence scoring',
      orbitRadius: 0,
    },
    {
      id: 'finnhub',
      name: 'Market Data',
      icon: '📈',
      color: '#22c55e',
      description: 'Real-time stock quotes and financial news from Finnhub',
      orbitRadius: 1,
    },
    {
      id: 'polymarket',
      name: 'Prediction Markets',
      icon: '🎯',
      color: '#3b82f6',
      description: 'Live prediction market odds from Polymarket',
      orbitRadius: 2,
    },
    {
      id: 'wikipedia',
      name: 'Knowledge Base',
      icon: '📚',
      color: '#f59e0b',
      description: 'Background context and historical data from Wikipedia',
      orbitRadius: 3,
    },
  ];

  return new Response(JSON.stringify({ categories }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}