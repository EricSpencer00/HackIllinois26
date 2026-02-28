import type { Request, Response } from "express";
import { stripe } from "./client.js";
import { env } from "../config.js";
import { sessionManager } from "../bridge/session-manager.js";
import type { X402PaymentMetadata } from "./types.js";

/**
 * Express handler for Stripe webhook events.
 *
 * Mount at POST /stripe/webhooks with `express.raw()` body parser.
 * Forward events locally during development:
 *   stripe listen --forward-to localhost:4402/stripe/webhooks
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`⚠️  Webhook signature verification failed: ${message}`);
    res.status(400).json({ error: `Webhook Error: ${message}` });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata as unknown as X402PaymentMetadata | undefined;
        if (metadata?.x402SessionId) {
          await sessionManager.markPaid(metadata.x402SessionId, {
            paidVia: "stripe",
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id,
          });
          console.log(`✅ Stripe checkout completed for session ${metadata.x402SessionId}`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const metadata = intent.metadata as unknown as X402PaymentMetadata | undefined;
        if (metadata?.x402SessionId) {
          await sessionManager.markPaid(metadata.x402SessionId, {
            paidVia: "stripe",
            stripePaymentIntentId: intent.id,
          });
          console.log(`✅ Stripe payment succeeded for session ${metadata.x402SessionId}`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const metadata = intent.metadata as unknown as X402PaymentMetadata | undefined;
        if (metadata?.x402SessionId) {
          await sessionManager.markFailed(metadata.x402SessionId);
          console.warn(`❌ Stripe payment failed for session ${metadata.x402SessionId}`);
        }
        break;
      }

      default:
        // Unhandled event type — safe to ignore
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
