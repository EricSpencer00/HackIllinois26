/**
 * /health ENDPOINT (GET)
 * Simple heartbeat check.
 */

export async function handleHealth(): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'BrightBet API',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}