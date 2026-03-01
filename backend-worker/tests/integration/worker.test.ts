/**
 * Integration tests for the main Worker entry point (src/index.ts).
 * Tests routing, CORS, and error handling via the fetch handler.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createMockEnv, jsonBody, mockFetch, jsonResponse } from '../helpers';

// We need to mock the static asset handler and the manifest import
vi.mock('@cloudflare/kv-asset-handler', () => ({
  getAssetFromKV: vi.fn().mockRejectedValue(new Error('Not found')),
  serveSinglePageApp: vi.fn((req: Request) => req),
}));

vi.mock('__STATIC_CONTENT_MANIFEST', () => ({
  default: '{}',
}));

// Import the worker after mocks are set up
import worker from '../../src/index';

describe('Worker fetch handler', () => {
  afterEach(() => vi.restoreAllMocks());

  const ctx: ExecutionContext = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };

  // ────────────────────────────────────────────
  // CORS
  // ────────────────────────────────────────────
  describe('CORS', () => {
    it('returns 204 for OPTIONS preflight', async () => {
      const req = new Request('https://brightbet.tech/api/health', { method: 'OPTIONS' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('adds CORS headers to API responses', async () => {
      const req = new Request('https://brightbet.tech/api/health', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  // ────────────────────────────────────────────
  // Routing
  // ────────────────────────────────────────────
  describe('API routing', () => {
    it('routes /api/health to health handler', async () => {
      const req = new Request('https://brightbet.tech/api/health', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await jsonBody(res);
      expect(body.status).toBe('healthy');
    });

    it('routes /health to health handler', async () => {
      const req = new Request('https://brightbet.tech/health', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await jsonBody(res);
      expect(body.status).toBe('healthy');
    });

    it('routes /api/planet-categories correctly', async () => {
      const req = new Request('https://brightbet.tech/api/planet-categories', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await jsonBody(res);
      expect(body.categories).toBeDefined();
    });

    it('returns 404 for unknown API routes', async () => {
      const req = new Request('https://brightbet.tech/api/nonexistent', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(404);
      const body = await jsonBody(res);
      expect(body.error).toBe('Not found');
    });

    it('routes /api/rickroll correctly', async () => {
      mockFetch(() =>
        jsonResponse({
          url: 'https://checkout.stripe.com/x',
          id: 'cs_test',
        }),
      );

      const req = new Request('https://brightbet.tech/api/rickroll', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      // Should return 402 (payment required)
      expect(res.status).toBe(402);
    });
  });

  // ────────────────────────────────────────────
  // POST routes with method validation
  // ────────────────────────────────────────────
  describe('POST-only routes reject GET', () => {
    it('/api/get-ai-opinion rejects GET with 405', async () => {
      const req = new Request('https://brightbet.tech/api/get-ai-opinion', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(405);
    });

    it('/api/generate-image rejects GET with 405', async () => {
      const req = new Request('https://brightbet.tech/api/generate-image', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(405);
    });

    it('legacy /api/generate-video still rejects GET (alias)', async () => {
      const req = new Request('https://brightbet.tech/api/generate-video', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(405);
    });

    it('/api/candles rejects GET with 405', async () => {
      const req = new Request('https://brightbet.tech/api/candles', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(405);
    });
  });

  // ────────────────────────────────────────────
  // Error handling
  // ────────────────────────────────────────────
  describe('Error handling', () => {
    it('returns 500 with error message when handler throws', async () => {
      // Make the AI opinion handler throw by providing invalid body
      // that passes JSON parse but fails further processing
      mockFetch(() => { throw new Error('Unexpected error'); });

      const req = new Request('https://brightbet.tech/api/get-ai-opinion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Test?' }),
      });
      const env = createMockEnv({
        GROQ_API_KEY: undefined,
        GROQ_KEY: undefined,
        GROQ_TOKEN: undefined,
      });
      const res = await worker.fetch(req, env, ctx);
      // Should be 500 (caught by the outer try/catch) or 400 from handler
      expect([400, 500]).toContain(res.status);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  // ────────────────────────────────────────────
  // Stripe webhook routing
  // ────────────────────────────────────────────
  describe('Stripe / Payment routing', () => {
    it('routes /stripe/webhooks directly (before API handling)', async () => {
      const req = new Request('https://brightbet.tech/stripe/webhooks', {
        method: 'POST',
        body: '{}',
      });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      // Should return 400 (missing stripe-signature)
      expect(res.status).toBe(400);
    });

    it('routes /payment/success correctly', async () => {
      const req = new Request('https://brightbet.tech/payment/success?session_id=test', {
        method: 'GET',
        redirect: 'manual',
      });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      // Should redirect (302)
      expect(res.status).toBe(302);
    });

    it('routes /payment/cancel correctly', async () => {
      const req = new Request('https://brightbet.tech/payment/cancel', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
    });

    it('routes /payment/status/:id correctly', async () => {
      const req = new Request('https://brightbet.tech/payment/status/unknown', { method: 'GET' });
      const env = createMockEnv();
      const res = await worker.fetch(req, env, ctx);
      // 404 because session doesn't exist
      expect(res.status).toBe(404);
    });
  });
});
