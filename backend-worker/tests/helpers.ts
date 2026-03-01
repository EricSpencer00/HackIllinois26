/**
 * Shared test helpers: mock Env factory, fetch interceptor, and utility functions.
 */
import { vi } from 'vitest';
import type { Env } from '../src/index';

/** Build a minimal mock Env with sensible defaults. Override any field via `overrides`. */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    GROQ_API_KEY: 'test-groq-key',
    GROQ_KEY: undefined,
    GROQ_TOKEN: undefined,
    GROQ_API_KEY_2: undefined,
    GROQ_API_KEY_3: undefined,
    GROQ_API_KEY_4: undefined,
    GROQ_API_KEY_5: undefined,
    FINNHUB_API_KEY: 'test-finnhub-key',
    FINNHUB_KEY: undefined,
    FINNHUB_TOKEN: undefined,
    FRED_API_KEY: 'test-fred-key',
    FRED_KEY: undefined,
    ALPHA_VANTAGE_API_KEY: 'test-av-key',
    ALPHA_VANTAGE_KEY: undefined,
    AV_API_KEY: undefined,
    PYTHON_API_URL: 'http://localhost:8000',
    AI: {
      run: vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71])), // minimal PNG header bytes
    },
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
    APP_BASE_URL: 'https://brightbet.tech',
    __STATIC_CONTENT: {} as KVNamespace,
    ...overrides,
  } as Env;
}

/** Create a mock JSON Request (POST by default). */
export function jsonRequest(
  url: string,
  body?: unknown,
  method: string = 'POST',
): Request {
  if (body !== undefined && method === 'POST') {
    return new Request(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  return new Request(url, { method });
}

/** Parse a Response body as JSON. */
export async function jsonBody<T = any>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

/** Helper to mock global fetch for a single test. Returns a vi.fn() you can assert on. */
export function mockFetch(
  handler: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>,
) {
  const spy = vi.fn(handler);
  // Use direct assignment — vi.stubGlobal + vi.restoreAllMocks can leave stale stubs
  const original = globalThis.fetch;
  globalThis.fetch = spy as any;
  return spy;
}

/** Create a successful JSON response for fetch mocking. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
