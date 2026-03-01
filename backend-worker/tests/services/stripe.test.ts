/**
 * Tests for src/services/stripe.ts
 * Covers: createCheckoutSession, verifyWebhookSignature
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createCheckoutSession, verifyWebhookSignature } from '../../src/services/stripe';
import { createMockEnv, mockFetch, jsonResponse } from '../helpers';

// ────────────────────────────────────────────────
// createCheckoutSession
// ────────────────────────────────────────────────
describe('createCheckoutSession', () => {
  afterEach(() => vi.restoreAllMocks());

  it('creates a checkout session with correct parameters', async () => {
    const spy = mockFetch((_input, init) => {
      return jsonResponse({
        url: 'https://checkout.stripe.com/session_123',
        id: 'cs_test_abc',
      });
    });

    const env = createMockEnv();
    const result = await createCheckoutSession({
      env,
      sessionId: 'sess_001',
      price: '$0.50',
      description: 'Test item',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(result.checkoutUrl).toBe('https://checkout.stripe.com/session_123');
    expect(result.stripeSessionId).toBe('cs_test_abc');

    // Verify the request was made correctly
    expect(spy).toHaveBeenCalledOnce();
    const [url, opts] = spy.mock.calls[0];
    expect(url).toContain('checkout/sessions');
    expect(opts?.method).toBe('POST');

    // Verify form-encoded body contains right values (body is URL-encoded)
    const body = decodeURIComponent(opts?.body as string);
    expect(body).toContain('unit_amount]=50'); // $0.50 = 50 cents
    expect(body).toContain('x402SessionId');
    expect(body).toContain('sess_001');
  });

  it('parses various price formats', async () => {
    mockFetch(() =>
      jsonResponse({ url: 'https://checkout.stripe.com/x', id: 'cs_x' }),
    );

    const env = createMockEnv();

    // $1.00
    await createCheckoutSession({
      env,
      sessionId: 's1',
      price: '$1.00',
      description: 'Test',
      successUrl: 'https://x.com/s',
      cancelUrl: 'https://x.com/c',
    });

    const rawBody = (vi.mocked(fetch).mock.calls[0][1]?.body as string) || '';
    const body = decodeURIComponent(rawBody);
    expect(body).toContain('unit_amount]=100');
  });

  it('throws on invalid price', async () => {
    const env = createMockEnv();
    await expect(
      createCheckoutSession({
        env,
        sessionId: 's1',
        price: '$0.00',
        description: 'Free',
        successUrl: 'https://x.com/s',
        cancelUrl: 'https://x.com/c',
      }),
    ).rejects.toThrow('Invalid price');
  });

  it('throws on Stripe API error', async () => {
    mockFetch(() => new Response('Unauthorized', { status: 401 }));
    const env = createMockEnv();
    await expect(
      createCheckoutSession({
        env,
        sessionId: 's1',
        price: '$1.00',
        description: 'Test',
        successUrl: 'https://x.com/s',
        cancelUrl: 'https://x.com/c',
      }),
    ).rejects.toThrow('Stripe API error 401');
  });
});

// ────────────────────────────────────────────────
// verifyWebhookSignature
// ────────────────────────────────────────────────
describe('verifyWebhookSignature', () => {
  it('returns true for a valid signature', async () => {
    const secret = 'whsec_test_secret';
    const payload = '{"type":"checkout.session.completed"}';
    const timestamp = '1700000000';

    // Compute the expected signature manually
    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const hexSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const sigHeader = `t=${timestamp},v1=${hexSig}`;
    const valid = await verifyWebhookSignature(payload, sigHeader, secret);
    expect(valid).toBe(true);
  });

  it('returns false for an invalid signature', async () => {
    const valid = await verifyWebhookSignature(
      '{"test":"data"}',
      't=1700000000,v1=invalid_hex_signature',
      'whsec_test',
    );
    expect(valid).toBe(false);
  });

  it('returns false for missing timestamp', async () => {
    const valid = await verifyWebhookSignature('body', 'v1=abc123', 'secret');
    expect(valid).toBe(false);
  });

  it('returns false for missing v1 signature', async () => {
    const valid = await verifyWebhookSignature('body', 't=123456', 'secret');
    expect(valid).toBe(false);
  });
});
