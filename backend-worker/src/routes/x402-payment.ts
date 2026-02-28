/**
 * x402 PAYMENT ROUTES FOR CLOUDFLARE WORKER
 *
 * Implements the x402 Stripe checkout flow:
 *   GET  /api/rickroll          → 402 with Stripe checkout URL (or rickroll HTML if paid)
 *   GET  /payment/success       → Handles Stripe redirect, shows rickroll
 *   GET  /payment/cancel        → Handles cancelled payments
 *   POST /stripe/webhooks       → Stripe webhook to mark sessions paid
 *   GET  /payment/status/:id    → Poll session status
 */

import type { Env } from '../index';
import { createCheckoutSession, verifyWebhookSignature } from '../services/stripe';

// ── In-memory session store (lives for the Worker isolate lifetime) ──────────
// For production, use KV or Durable Objects. For a hackathon demo this is fine
// since Stripe redirects back within the same datacenter isolate most of the time.
const sessions = new Map<string, {
  id: string;
  status: 'pending' | 'paid' | 'settled';
  createdAt: number;
}>();

function createSession(): string {
  const id = crypto.randomUUID();
  sessions.set(id, { id, status: 'pending', createdAt: Date.now() });
  return id;
}

// ── Rickroll HTML ────────────────────────────────────────────────────────────
const RICKROLL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusive Premium Content</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; }
    .container { text-align: center; }
    h1 { color: #fff; margin-bottom: 1rem; font-size: 2rem; }
    img { max-width: 90vw; max-height: 70vh; border-radius: 12px; box-shadow: 0 0 40px rgba(255,100,100,0.4); }
    p { color: #aaa; margin-top: 1rem; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎤 You just got Rick Rolled 🎤</h1>
    <img src="https://media1.giphy.com/media/Vuw9m5wXviFIQ/giphy.gif" alt="Rick Astley - Never Gonna Give You Up" />
    <p>Never gonna give you up, never gonna let you down 🎵</p>
    <p style="margin-top: 0.5rem; color: #666;">Paid via x402 + Stripe</p>
  </div>
</body>
</html>`;

// ── Route handlers ───────────────────────────────────────────────────────────

/** GET /api/rickroll — returns 402 with Stripe checkout, or rickroll if paid */
export async function handleRickroll(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Check for paid session via header or query param
  const sessionId =
    request.headers.get('x-payment-session') ||
    url.searchParams.get('paid_session');

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session && (session.status === 'paid' || session.status === 'settled')) {
      session.status = 'settled';
      return new Response(RICKROLL_HTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }

  // No valid payment — create session and return 402 with Stripe checkout
  const newSessionId = createSession();
  const baseUrl = env.APP_BASE_URL || `${url.protocol}//${url.host}`;

  try {
    const { checkoutUrl } = await createCheckoutSession({
      env,
      sessionId: newSessionId,
      price: '$0.50',
      description: 'Exclusive premium content — pay to reveal',
      successUrl: `${baseUrl}/payment/success?session_id=${newSessionId}`,
      cancelUrl: `${baseUrl}/payment/cancel?session_id=${newSessionId}`,
    });

    return new Response(
      JSON.stringify({
        error: 'Payment required',
        resource: {
          url: `${baseUrl}/api/rickroll`,
          description: 'Exclusive premium content — pay to reveal',
          mimeType: 'text/html',
        },
        paymentOptions: {
          stripe: {
            checkoutUrl,
            sessionId: newSessionId,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        },
        message: 'Pay via Stripe checkout to access this resource.',
      }),
      {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to create payment session', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/** GET /payment/success — Stripe redirects here after payment */
export async function handlePaymentSuccess(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing session_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Mark as paid (webhook may not have arrived yet, but Stripe redirected = payment succeeded)
  const session = sessions.get(sessionId);
  if (session) {
    session.status = 'paid';
  } else {
    // Session may have been lost (different isolate) — trust Stripe redirect and create it
    sessions.set(sessionId, { id: sessionId, status: 'paid', createdAt: Date.now() });
  }

  // Redirect to the rickroll reveal
  const baseUrl = env.APP_BASE_URL || `${url.protocol}//${url.host}`;
  return Response.redirect(`${baseUrl}/api/rickroll?paid_session=${sessionId}`, 302);
}

/** GET /payment/cancel — Stripe redirects here on cancel */
export async function handlePaymentCancel(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  return new Response(
    JSON.stringify({
      message: 'Payment was cancelled. You can retry by requesting the protected resource again.',
      sessionId,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

/** POST /stripe/webhooks — Stripe webhook handler */
export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.text();
  const secret = (env.STRIPE_WEBHOOK_SECRET as string) || '';

  const valid = await verifyWebhookSignature(body, sig, secret);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data?.object?.metadata?.x402SessionId;
      if (sessionId) {
        const session = sessions.get(sessionId);
        if (session) {
          session.status = 'paid';
        } else {
          sessions.set(sessionId, { id: sessionId, status: 'paid', createdAt: Date.now() });
        }
        console.log(`✅ Stripe checkout completed for session ${sessionId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** GET /payment/status/:id — poll session status */
export async function handlePaymentStatus(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.pathname.split('/').pop();

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing session ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      status: session.status,
      createdAt: new Date(session.createdAt).toISOString(),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
