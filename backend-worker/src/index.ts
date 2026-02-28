/**
 * MAIN WORKER ENTRY POINT
 * Routes incoming HTTP requests and handles CORS.
 * Serves static frontend assets for non-API routes.
 */

import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler';
// @ts-ignore — wrangler injects this virtual module at build time
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import { handleHealth } from './routes/health';
import { handleGetAiOpinion } from './routes/get-ai-opinion';
import { handleVisualize } from './routes/visualize';
import { handlePlanetCategories } from './routes/planet-categories';
import { handleGenerateVideo } from './routes/generate-video';
import {
  handleRickroll,
  handlePaymentSuccess,
  handlePaymentCancel,
  handleStripeWebhook,
  handlePaymentStatus,
} from './routes/x402-payment';

const assetManifest = JSON.parse(manifestJSON);

export interface Env {
  GROQ_API_KEY?: string;
  GROQ_KEY?: string;
  GROQ_TOKEN?: string;
  GROQ_API_KEY_2?: string;
  GROQ_API_KEY_3?: string;
  GROQ_API_KEY_4?: string;
  GROQ_API_KEY_5?: string;
  FINNHUB_API_KEY?: string;
  FINNHUB_KEY?: string;
  FINNHUB_TOKEN?: string;
  FRED_API_KEY?: string;
  FRED_KEY?: string;
  ALPHA_VANTAGE_API_KEY?: string;
  ALPHA_VANTAGE_KEY?: string;
  AV_API_KEY?: string;
  PYTHON_API_URL?: string;
  AI: any; // Cloudflare Workers AI binding
  // Stripe / x402
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  APP_BASE_URL?: string;
  [key: string]: unknown;
  __STATIC_CONTENT: KVNamespace;
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // --- Stripe webhook (must receive raw body, handled before JSON parsing) ---
    if (path === '/stripe/webhooks' && request.method === 'POST') {
      return handleStripeWebhook(request, env);
    }

    // --- Payment redirect routes (not under /api, no CORS needed) ---
    if (path === '/payment/success') {
      return handlePaymentSuccess(request, env);
    }
    if (path === '/payment/cancel') {
      return handlePaymentCancel(request);
    }
    if (path.startsWith('/payment/status/')) {
      return handlePaymentStatus(request);
    }

    // --- API Routes ---
    if (path.startsWith('/api') || path === '/health') {
      let response: Response;

      try {
        if (path === '/api/health' || path === '/health') {
          response = await handleHealth();
        } else if (path === '/api/rickroll') {
          response = await handleRickroll(request, env);
        } else if (path === '/api/get-ai-opinion') {
          response = await handleGetAiOpinion(request, env);
        } else if (path === '/api/visualize') {
          response = await handleVisualize(request, env);
        } else if (path === '/api/planet-categories') {
          response = await handlePlanetCategories();
        } else if (path === '/api/generate-video') {
          response = await handleGenerateVideo(request, env);
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

      // Add CORS headers to every API response
      const newHeaders = new Headers(response.headers);
      for (const [k, v] of Object.entries(corsHeaders())) {
        newHeaders.set(k, v);
      }
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    // --- Static Assets (Frontend) ---
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
          mapRequestToAsset: serveSinglePageApp,
        },
      );
    } catch (_e) {
      // SPA fallback: serve index.html for any unmatched route
      try {
        const notFoundRequest = new Request(new URL('/index.html', url.origin).toString(), {
          headers: request.headers,
        });
        return await getAssetFromKV(
          {
            request: notFoundRequest,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          },
        );
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }
  },
};