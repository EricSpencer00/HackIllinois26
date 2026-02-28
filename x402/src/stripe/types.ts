// ── Stripe-related types ─────────────────────────────────────────────────────

import type Stripe from "stripe";

/** Metadata stored on a Stripe PaymentIntent to link it back to an x402 session */
export interface X402PaymentMetadata {
  /** Unique session identifier tying the 402 challenge to a Stripe payment */
  x402SessionId: string;
  /** The protected resource URL the client originally requested */
  resourceUrl: string;
  /** Price in human-readable form, e.g. "$0.10" */
  price: string;
  /** ISO-8601 timestamp when the 402 was issued */
  issuedAt: string;
}

/** Shape returned to clients when offering Stripe as a payment option */
export interface StripePaymentOption {
  type: "stripe";
  /** Stripe Checkout Session URL — redirect the user here */
  checkoutUrl: string;
  /** Unique session ID (also stored in Stripe metadata) */
  sessionId: string;
  /** When this payment offer expires */
  expiresAt: string;
}

/** Internal record of a payment session */
export interface PaymentSession {
  id: string;
  resourceUrl: string;
  price: string;
  currency: string;
  status: "pending" | "paid" | "settled" | "expired" | "failed";
  /** Which rail fulfilled the payment */
  paidVia?: "stripe" | "crypto";
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  cryptoTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

/** Webhook event we care about from Stripe */
export type RelevantStripeEvent =
  | Stripe.CheckoutSessionCompletedEvent
  | Stripe.PaymentIntentSucceededEvent
  | Stripe.PaymentIntentPaymentFailedEvent;
