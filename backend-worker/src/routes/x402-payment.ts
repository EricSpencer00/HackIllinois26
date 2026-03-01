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
import { handleGenerateMeme } from './generate-meme';

// ── In-memory session store (lives for the Worker isolate lifetime) ──────────
// For production, use KV or Durable Objects. For a hackathon demo this is fine
// since Stripe redirects back within the same datacenter isolate most of the time.
const sessions = new Map<string, {
  id: string;
  question?: string;
  status: 'pending' | 'paid' | 'settled';
  createdAt: number;
}>();

function createSession(question?: string): string {
  const id = crypto.randomUUID();
  sessions.set(id, { id, question, status: 'pending', createdAt: Date.now() });
  return id;
}

// ── Rickroll HTML (kept for reference, but not used) ────────────────────────────
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
    <h1>You just got Rick Rolled</h1>
    <img src="https://media1.giphy.com/media/Vuw9m5wXviFIQ/giphy.gif" alt="Rick Astley - Never Gonna Give You Up" />
    <p>Never gonna give you up, never gonna let you down 🎵</p>
    <p style="margin-top: 0.5rem; color: #666;">Paid via x402 + Stripe</p>
  </div>
</body>
</html>`;

/**
 * Generate HTML page to display the AI-generated meme - Brutalist ASCII design
 */
function generateMemeHtml(question: string, imageData: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI MEME // BRIGHTBET</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --white: #ffffff;
      --gray-300: #aaaaaa;
      --gray-500: #666666;
      --gray-700: #333333;
      --gray-900: #111111;
      --black: #000000;
      --font-mono: 'Space Mono', 'SF Mono', 'Fira Code', monospace;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: var(--black);
      min-height: 100vh; 
      font-family: var(--font-mono);
      color: var(--white);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .header {
      width: 100%;
      max-width: 800px;
      margin-bottom: 40px;
    }
    .logo {
      text-decoration: none;
      color: var(--white);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-shadow: 0 0 12px rgba(255,255,255,0.5);
    }
    .container { 
      width: 100%;
      max-width: 800px;
    }
    .ascii-border {
      border: 1px solid var(--gray-700);
      padding: 32px;
      position: relative;
    }
    .ascii-corner {
      position: absolute;
      color: var(--gray-500);
      font-size: 10px;
    }
    .ascii-corner.tl { top: 8px; left: 8px; }
    .ascii-corner.tr { top: 8px; right: 8px; }
    .ascii-corner.bl { bottom: 8px; left: 8px; }
    .ascii-corner.br { bottom: 8px; right: 8px; }
    h1 { 
      color: var(--white);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.15em;
      margin-bottom: 24px;
      text-transform: uppercase;
    }
    .question {
      color: var(--gray-300);
      font-size: 13px;
      margin-bottom: 32px;
      padding: 16px;
      border-left: 2px solid var(--gray-700);
      font-style: italic;
    }
    .meme-container {
      margin: 24px 0;
      border: 1px solid var(--gray-700);
      background: var(--gray-900);
    }
    img { 
      width: 100%;
      height: auto;
      display: block;
    }
    .meta {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--gray-700);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .badge {
      display: inline-block;
      border: 1px solid var(--gray-500);
      color: var(--gray-300);
      padding: 8px 16px;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .powered {
      color: var(--gray-500);
      font-size: 10px;
      letter-spacing: 0.05em;
    }
    .back-link {
      display: inline-block;
      margin-top: 32px;
      color: var(--gray-300);
      text-decoration: none;
      font-size: 12px;
      letter-spacing: 0.1em;
      border-bottom: 1px solid var(--gray-700);
      padding-bottom: 4px;
      transition: color 0.2s, border-color 0.2s;
    }
    .back-link:hover {
      color: var(--white);
      border-color: var(--white);
    }
    .ascii-art {
      color: var(--gray-700);
      font-size: 8px;
      line-height: 1.2;
      white-space: pre;
      margin-top: 40px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <a href="/" class="logo">BRIGHTBET</a>
  </div>
  
  <div class="container">
    <div class="ascii-border">
      <span class="ascii-corner tl">+--</span>
      <span class="ascii-corner tr">--+</span>
      <span class="ascii-corner bl">+--</span>
      <span class="ascii-corner br">--+</span>
      
      <h1>// AI MEME GENERATED</h1>
      <div class="question">"${escapeHtml(question)}"</div>
      
      <div class="meme-container">
        <img src="${imageData}" alt="AI Generated Meme" />
      </div>
      
      <div class="meta">
        <span class="badge">PAID VIA X402</span>
        <span class="powered">CLOUDFLARE AI // STABLE DIFFUSION</span>
      </div>
    </div>
    
    <a href="/" class="back-link">&lt;-- BACK TO BRIGHTBET</a>
  </div>
  
  <pre class="ascii-art">
    *    .  *       .             *
                         *
     *   .        *          .        .   *
              .      .  *        *
         *                 .        .
  .          *       .
        .        .            .  *
      *     *          .
           .     *            *       .
  </pre>
</body>
</html>`;
}

/**
 * Generate fallback HTML if meme generation fails - Brutalist ASCII design
 */
function generateFallbackHtml(question: string, error: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GENERATING // BRIGHTBET</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --white: #ffffff;
      --gray-300: #aaaaaa;
      --gray-500: #666666;
      --gray-700: #333333;
      --gray-900: #111111;
      --black: #000000;
      --font-mono: 'Space Mono', 'SF Mono', 'Fira Code', monospace;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: var(--black);
      min-height: 100vh; 
      font-family: var(--font-mono);
      color: var(--white);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .header {
      width: 100%;
      max-width: 600px;
      margin-bottom: 40px;
    }
    .logo {
      text-decoration: none;
      color: var(--white);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-shadow: 0 0 12px rgba(255,255,255,0.5);
    }
    .container { 
      width: 100%;
      max-width: 600px;
    }
    .ascii-border {
      border: 1px solid var(--gray-700);
      padding: 32px;
      position: relative;
    }
    .ascii-corner {
      position: absolute;
      color: var(--gray-500);
      font-size: 10px;
    }
    .ascii-corner.tl { top: 8px; left: 8px; }
    .ascii-corner.tr { top: 8px; right: 8px; }
    .ascii-corner.bl { bottom: 8px; left: 8px; }
    .ascii-corner.br { bottom: 8px; right: 8px; }
    h1 { 
      color: var(--white);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.15em;
      margin-bottom: 24px;
      text-transform: uppercase;
    }
    .message {
      color: var(--gray-300);
      font-size: 13px;
      line-height: 1.8;
      margin-bottom: 24px;
    }
    .question-box {
      padding: 16px;
      border-left: 2px solid var(--gray-700);
      color: var(--white);
      font-style: italic;
      margin: 24px 0;
    }
    .error-box {
      border: 1px solid var(--gray-700);
      background: var(--gray-900);
      padding: 16px;
      margin: 24px 0;
      font-size: 11px;
      color: var(--gray-500);
    }
    .error-label {
      color: var(--gray-300);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 8px;
      display: block;
    }
    .loading {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--gray-300);
      font-size: 12px;
      letter-spacing: 0.05em;
    }
    .loading-dots::after {
      content: '...';
      animation: dots 1.5s infinite;
    }
    @keyframes dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60%, 100% { content: '...'; }
    }
    .back-link {
      display: inline-block;
      margin-top: 32px;
      color: var(--gray-300);
      text-decoration: none;
      font-size: 12px;
      letter-spacing: 0.1em;
      border-bottom: 1px solid var(--gray-700);
      padding-bottom: 4px;
    }
    .back-link:hover {
      color: var(--white);
      border-color: var(--white);
    }
  </style>
</head>
<body>
  <div class="header">
    <a href="/" class="logo">BRIGHTBET</a>
  </div>
  
  <div class="container">
    <div class="ascii-border">
      <span class="ascii-corner tl">+--</span>
      <span class="ascii-corner tr">--+</span>
      <span class="ascii-corner bl">+--</span>
      <span class="ascii-corner br">--+</span>
      
      <h1>// PAYMENT RECEIVED</h1>
      <p class="message">Thank you for your payment. Your AI meme is being generated.</p>
      
      <div class="question-box">"${escapeHtml(question)}"</div>
      
      ${error ? `
      <div class="error-box">
        <span class="error-label">SYSTEM_NOTE:</span>
        ${escapeHtml(error)}
      </div>
      ` : `
      <div class="loading">
        <span>PROCESSING</span><span class="loading-dots"></span>
      </div>
      `}
    </div>
    
    <a href="/" class="back-link">&lt;-- BACK TO BRIGHTBET</a>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ── Route handlers ───────────────────────────────────────────────────────────

/** GET /api/rickroll — returns 402 with Stripe checkout, or generates free AI meme if paid */
export async function handleRickroll(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Get question from query parameter
  const question = url.searchParams.get('question') || 'This is really funny';

  // Check for paid session via header or query param
  const sessionId =
    request.headers.get('x-payment-session') ||
    url.searchParams.get('paid_session');

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session && (session.status === 'paid' || session.status === 'settled')) {
      session.status = 'settled';
      
      // Generate the free AI meme for the user's question
      const questionToUse = session.question || question;
      const memeRequest = new Request('https://placeholder.local/api/generate-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionToUse }),
      });
      
      try {
        const memeResponse = await handleGenerateMeme(memeRequest, env);
        const memeData = (await memeResponse.json()) as any;
        
        // Return HTML page displaying the generated meme
        const memeHtml = generateMemeHtml(questionToUse, memeData.imageData || '');
        return new Response(memeHtml, {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });
      } catch (err: any) {
        // Fallback if meme generation fails
        const fallbackHtml = generateFallbackHtml(questionToUse, err.message);
        return new Response(fallbackHtml, {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }
  }

  // Store question in session for later use
  const newSessionId = createSession(question);
  const baseUrl = env.APP_BASE_URL || `${url.protocol}//${url.host}`;

  try {
    const { checkoutUrl } = await createCheckoutSession({
      env,
      sessionId: newSessionId,
      price: '$0.50',
      description: `Free AI meme generator: ${question}`,
      successUrl: `${baseUrl}/payment/success?session_id=${newSessionId}&question=${encodeURIComponent(question)}`,
      cancelUrl: `${baseUrl}/payment/cancel?session_id=${newSessionId}`,
    });

    return new Response(
      JSON.stringify({
        error: 'Payment required',
        resource: {
          url: `${baseUrl}/api/rickroll?question=${encodeURIComponent(question)}`,
          description: `Free AI meme generator: ${question}`,
          mimeType: 'text/html',
        },
        paymentOptions: {
          stripe: {
            checkoutUrl,
            sessionId: newSessionId,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        },
        message: 'Pay $0.50 via Stripe to generate your free AI meme!',
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
  const question = url.searchParams.get('question');

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
    if (question) session.question = decodeURIComponent(question);
  } else {
    // Session may have been lost (different isolate) — trust Stripe redirect and create it
    sessions.set(sessionId, { id: sessionId, question: question ? decodeURIComponent(question) : undefined, status: 'paid', createdAt: Date.now() });
  }

  // Redirect to the meme reveal with the stored question
  const baseUrl = env.APP_BASE_URL || `${url.protocol}//${url.host}`;
  const questionParam = question ? `&question=${question}` : '';
  return Response.redirect(`${baseUrl}/api/rickroll?paid_session=${sessionId}${questionParam}`, 302);
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
