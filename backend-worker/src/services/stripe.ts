/**
 * STRIPE SERVICE FOR CLOUDFLARE WORKERS
 * Uses raw fetch() calls to the Stripe API — no Node SDK needed.
 */

import type { Env } from '../index';

const STRIPE_API = 'https://api.stripe.com/v1';

/** Build Basic auth header from Stripe secret key */
function stripeAuth(env: Env): string {
  return 'Basic ' + btoa((env.STRIPE_SECRET_KEY || '') + ':');
}

/** URL-encode an object for Stripe's form-encoded API */
function formEncode(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/**
 * Create a Stripe Checkout Session.
 * Returns the checkout URL and session ID.
 */
export async function createCheckoutSession(opts: {
  env: Env;
  sessionId: string;
  price: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string; stripeSessionId: string }> {
  const { env, sessionId, price, description, successUrl, cancelUrl } = opts;

  // Parse "$0.50" → 50 cents
  const cleaned = price.replace(/[^0-9.]/g, '');
  const amountCents = Math.round(parseFloat(cleaned) * 100);
  if (isNaN(amountCents) || amountCents <= 0) {
    throw new Error(`Invalid price: "${price}"`);
  }

  const body = formEncode({
    'mode': 'payment',
    'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][price_data][product_data][name]': description,
    'line_items[0][quantity]': '1',
    'metadata[x402SessionId]': sessionId,
    'success_url': successUrl,
    'cancel_url': cancelUrl,
    'expires_at': String(Math.floor(Date.now() / 1000) + 1800),
  });

  const resp = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': stripeAuth(env),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Stripe API error ${resp.status}: ${err}`);
  }

  const data: any = await resp.json();
  return {
    checkoutUrl: data.url,
    stripeSessionId: data.id,
  };
}

/**
 * Verify a Stripe webhook signature.
 * Stripe uses HMAC-SHA256 with the `v1=...` scheme.
 */
export async function verifyWebhookSignature(
  payload: string,
  sigHeader: string,
  webhookSecret: string,
): Promise<boolean> {
  // Parse the signature header: t=<timestamp>,v1=<signature>
  const parts: Record<string, string> = {};
  for (const part of sigHeader.split(',')) {
    const [key, val] = part.split('=', 2);
    if (key && val) parts[key.trim()] = val.trim();
  }

  const timestamp = parts['t'];
  const expectedSig = parts['v1'];
  if (!timestamp || !expectedSig) return false;

  // Compute HMAC-SHA256(secret, timestamp + '.' + payload)
  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const hexSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hexSig === expectedSig;
}
