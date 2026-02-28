import { stripe } from "./client.js";
import { env } from "../config.js";
import type { X402PaymentMetadata } from "./types.js";

/**
 * Create a Stripe Checkout Session for an x402 payment.
 *
 * The client receives a checkout URL and is redirected to Stripe's hosted page.
 * On success Stripe fires a webhook that marks the session as paid.
 */
export async function createCheckoutSession(opts: {
  sessionId: string;
  resourceUrl: string;
  /** Human-readable price string, e.g. "$0.10" */
  price: string;
  /** ISO currency code, default "usd" */
  currency?: string;
  /** Description shown on the Stripe checkout page */
  description?: string;
}) {
  const { sessionId, resourceUrl, price, currency = "usd", description } = opts;

  // Parse dollar amount → cents (Stripe expects smallest currency unit)
  const amountCents = parsePriceToCents(price);

  const metadata: X402PaymentMetadata = {
    x402SessionId: sessionId,
    resourceUrl,
    price,
    issuedAt: new Date().toISOString(),
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amountCents,
          product_data: {
            name: description ?? `Access: ${resourceUrl}`,
            description: `x402 payment for ${resourceUrl}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: metadata as unknown as Record<string, string>,
    success_url: `${env.APP_BASE_URL}/payment/success?session_id=${sessionId}`,
    cancel_url: `${env.APP_BASE_URL}/payment/cancel?session_id=${sessionId}`,
    expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
  });

  return {
    checkoutUrl: session.url!,
    stripeCheckoutSessionId: session.id,
  };
}

/**
 * Create a Stripe PaymentIntent directly (for server-to-server or
 * custom frontend flows without Checkout).
 */
export async function createPaymentIntent(opts: {
  sessionId: string;
  resourceUrl: string;
  price: string;
  currency?: string;
  description?: string;
}) {
  const { sessionId, resourceUrl, price, currency = "usd", description } = opts;

  const amountCents = parsePriceToCents(price);

  const metadata: X402PaymentMetadata = {
    x402SessionId: sessionId,
    resourceUrl,
    price,
    issuedAt: new Date().toISOString(),
  };

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    metadata: metadata as unknown as Record<string, string>,
    description: description ?? `x402 payment for ${resourceUrl}`,
    automatic_payment_methods: { enabled: true },
  });

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
  };
}

/**
 * Retrieve a Stripe Checkout Session to check its payment status.
 */
export async function getCheckoutSession(stripeSessionId: string) {
  return stripe.checkout.sessions.retrieve(stripeSessionId, {
    expand: ["payment_intent"],
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "$0.10", "0.10", "$1", etc. → integer cents */
function parsePriceToCents(price: string): number {
  const cleaned = price.replace(/[^0-9.]/g, "");
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars) || dollars < 0) {
    throw new Error(`Invalid price format: "${price}"`);
  }
  return Math.round(dollars * 100);
}
