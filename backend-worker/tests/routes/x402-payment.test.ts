/**
 * Tests for src/routes/x402-payment.ts
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  handleRickroll,
  handlePaymentSuccess,
  handlePaymentCancel,
  handleStripeWebhook,
  handlePaymentStatus,
} from '../../src/routes/x402-payment';
import { createMockEnv, jsonBody, mockFetch, jsonResponse } from '../helpers';

describe('x402 Payment Routes', () => {
  afterEach(() => vi.restoreAllMocks());

  // ────────────────────────────────────────────────
  // handleRickroll
  // ────────────────────────────────────────────────
  describe('handleRickroll', () => {
    it('returns 402 with checkout URL when not paid', async () => {
      mockFetch(() =>
        jsonResponse({
          url: 'https://checkout.stripe.com/session_abc',
          id: 'cs_test_abc',
        }),
      );

      const req = new Request('https://brightbet.tech/api/rickroll', { method: 'GET' });
      const env = createMockEnv();
      const res = await handleRickroll(req, env);
      expect(res.status).toBe(402);

      const body = await jsonBody(res);
      expect(body.error).toBe('Payment required');
      expect(body.paymentOptions.stripe.checkoutUrl).toBe('https://checkout.stripe.com/session_abc');
      expect(body.paymentOptions.stripe.sessionId).toBeDefined();
      expect(body.resource.url).toContain('/api/rickroll');
    });

    it('returns 500 when Stripe checkout fails', async () => {
      mockFetch(() => new Response('Unauthorized', { status: 401 }));

      const req = new Request('https://brightbet.tech/api/rickroll', { method: 'GET' });
      const env = createMockEnv();
      const res = await handleRickroll(req, env);
      expect(res.status).toBe(500);
      const body = await jsonBody(res);
      expect(body.error).toContain('Failed to create payment session');
    });
  });

  // ────────────────────────────────────────────────
  // handlePaymentSuccess
  // ────────────────────────────────────────────────
  describe('handlePaymentSuccess', () => {
    it('returns 400 when session_id is missing', async () => {
      const req = new Request('https://brightbet.tech/payment/success', { method: 'GET' });
      const env = createMockEnv();
      const res = await handlePaymentSuccess(req, env);
      expect(res.status).toBe(400);
    });

    it('redirects (302) with session_id present', async () => {
      const req = new Request('https://brightbet.tech/payment/success?session_id=sess_123', {
        method: 'GET',
        redirect: 'manual', // don't follow redirects
      });
      const env = createMockEnv();
      const res = await handlePaymentSuccess(req, env);
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('/api/rickroll?paid_session=sess_123');
    });
  });

  // ────────────────────────────────────────────────
  // handlePaymentCancel
  // ────────────────────────────────────────────────
  describe('handlePaymentCancel', () => {
    it('returns 200 with cancel message', async () => {
      const req = new Request('https://brightbet.tech/payment/cancel?session_id=sess_456', {
        method: 'GET',
      });
      const res = await handlePaymentCancel(req);
      expect(res.status).toBe(200);
      const body = await jsonBody(res);
      expect(body.message).toContain('cancelled');
      expect(body.sessionId).toBe('sess_456');
    });

    it('handles missing session_id gracefully', async () => {
      const req = new Request('https://brightbet.tech/payment/cancel', { method: 'GET' });
      const res = await handlePaymentCancel(req);
      expect(res.status).toBe(200);
      const body = await jsonBody(res);
      expect(body.sessionId).toBeNull();
    });
  });

  // ────────────────────────────────────────────────
  // handleStripeWebhook
  // ────────────────────────────────────────────────
  describe('handleStripeWebhook', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = new Request('https://brightbet.tech/stripe/webhooks', {
        method: 'POST',
        body: '{}',
      });
      const env = createMockEnv();
      const res = await handleStripeWebhook(req, env);
      expect(res.status).toBe(400);
      const body = await jsonBody(res);
      expect(body.error).toContain('Missing stripe-signature');
    });

    it('returns 400 for invalid signature', async () => {
      const req = new Request('https://brightbet.tech/stripe/webhooks', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=invalidsig' },
        body: '{"type":"checkout.session.completed"}',
      });
      const env = createMockEnv();
      const res = await handleStripeWebhook(req, env);
      expect(res.status).toBe(400);
      const body = await jsonBody(res);
      expect(body.error).toContain('Invalid signature');
    });

    it('processes valid webhook and returns 200', async () => {
      const secret = 'whsec_test_123';
      const payload = JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: { metadata: { x402SessionId: 'sess_webhook_001' } },
        },
      });
      const timestamp = String(Math.floor(Date.now() / 1000));

      // Compute valid signature
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

      const req = new Request('https://brightbet.tech/stripe/webhooks', {
        method: 'POST',
        headers: { 'stripe-signature': `t=${timestamp},v1=${hexSig}` },
        body: payload,
      });
      const env = createMockEnv({ STRIPE_WEBHOOK_SECRET: secret });
      const res = await handleStripeWebhook(req, env);
      expect(res.status).toBe(200);
      const body = await jsonBody(res);
      expect(body.received).toBe(true);
    });
  });

  // ────────────────────────────────────────────────
  // handlePaymentStatus
  // ────────────────────────────────────────────────
  describe('handlePaymentStatus', () => {
    it('returns 400 when session ID is missing', async () => {
      const req = new Request('https://brightbet.tech/payment/status/', { method: 'GET' });
      const res = await handlePaymentStatus(req);
      // pathname.split('/').pop() on "/payment/status/" returns ""
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown session', async () => {
      const req = new Request('https://brightbet.tech/payment/status/unknown_id', { method: 'GET' });
      const res = await handlePaymentStatus(req);
      expect(res.status).toBe(404);
      const body = await jsonBody(res);
      expect(body.error).toContain('Session not found');
    });
  });
});
