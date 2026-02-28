/**
 * MAIN WORKER ENTRY POINT
 * Routes incoming HTTP requests and handles CORS.
 */

import { handleHealth } from './routes/health';
import { handleGetAiOpinion } from './routes/get-ai-opinion';
import { handleVisualize } from './routes/visualize';
import { handlePlanetCategories } from './routes/planet-categories';

export interface Env {
  GROQ_API_KEY: string;
  FINNHUB_API_KEY: string;
  PYTHON_API_URL: string;
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    let response: Response;

    try {
      if (path === '/api/health' || path === '/health') {
        response = await handleHealth();
      } else if (path === '/api/get-ai-opinion') {
        response = await handleGetAiOpinion(request, env);
      } else if (path === '/api/visualize') {
        response = await handleVisualize(request, env);
      } else if (path === '/api/planet-categories') {
        response = await handlePlanetCategories();
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err: any) {
      response = new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add CORS headers to every response
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders())) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};