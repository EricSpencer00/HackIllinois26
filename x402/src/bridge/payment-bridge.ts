import { sessionManager } from "./session-manager.js";
import { createCheckoutSession } from "../stripe/payments.js";
import type { StripePaymentOption } from "../stripe/types.js";

/**
 * The PaymentBridge connects x402's 402 challenge flow with Stripe payments.
 *
 * When a client receives a 402 response, they can choose to pay via:
 *   1. Crypto (standard x402 on-chain flow via facilitator)
 *   2. Stripe (fiat flow via this bridge)
 *
 * This module handles creating a Stripe Checkout session linked to the x402
 * payment session, so the server knows the client has paid once Stripe
 * confirms the payment via webhook.
 */
export class PaymentBridge {
  /**
   * Create a Stripe payment option for a 402 challenge.
   *
   * Returns a `StripePaymentOption` the server can include alongside the
   * standard x402 crypto `accepts` array, giving clients a fiat fallback.
   */
  async createStripeOption(opts: {
    resourceUrl: string;
    price: string;
    currency?: string;
    description?: string;
  }): Promise<StripePaymentOption> {
    // 1. Create an internal payment session
    const session = sessionManager.create({
      resourceUrl: opts.resourceUrl,
      price: opts.price,
      currency: opts.currency,
    });

    // 2. Create a Stripe Checkout Session linked to our session
    const { checkoutUrl, stripeCheckoutSessionId } = await createCheckoutSession({
      sessionId: session.id,
      resourceUrl: opts.resourceUrl,
      price: opts.price,
      currency: opts.currency,
      description: opts.description,
    });

    // Store the Stripe session ID on our session for later lookup
    const stored = sessionManager.get(session.id);
    if (stored) {
      stored.stripeCheckoutSessionId = stripeCheckoutSessionId;
    }

    return {
      type: "stripe",
      checkoutUrl,
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  /**
   * Check whether a payment session has been fulfilled (via any rail).
   *
   * The server calls this before serving the protected resource to confirm
   * the client has actually paid.
   */
  isSessionPaid(sessionId: string): boolean {
    const session = sessionManager.get(sessionId);
    return session?.status === "paid" || session?.status === "settled";
  }

  /**
   * Mark a session as settled after the resource is served.
   */
  async settleSession(sessionId: string): Promise<void> {
    await sessionManager.markSettled(sessionId);
  }
}

/** Singleton bridge instance */
export const paymentBridge = new PaymentBridge();
