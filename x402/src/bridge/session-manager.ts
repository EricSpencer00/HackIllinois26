import { v4 as uuidv4 } from "uuid";
import type { PaymentSession } from "../stripe/types.js";

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * In-memory session store that tracks the lifecycle of an x402 payment.
 *
 * In production, replace with Redis / Postgres / your persistence layer.
 */
class SessionManager {
  private sessions = new Map<string, PaymentSession>();

  /** Create a new pending payment session */
  create(opts: { resourceUrl: string; price: string; currency?: string }): PaymentSession {
    const id = uuidv4();
    const now = new Date();
    const session: PaymentSession = {
      id,
      resourceUrl: opts.resourceUrl,
      price: opts.price,
      currency: opts.currency ?? "usd",
      status: "pending",
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    };
    this.sessions.set(id, session);
    return session;
  }

  /** Retrieve a session by ID, returns undefined if not found or expired */
  get(sessionId: string): PaymentSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (session.expiresAt < new Date() && session.status === "pending") {
      session.status = "expired";
      session.updatedAt = new Date();
    }
    return session;
  }

  /** Mark a session as paid (called from Stripe webhooks or crypto settlement) */
  async markPaid(
    sessionId: string,
    details: {
      paidVia: "stripe" | "crypto";
      stripePaymentIntentId?: string;
      stripeCheckoutSessionId?: string;
      cryptoTxHash?: string;
    },
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found when marking as paid`);
      return;
    }
    session.status = "paid";
    session.paidVia = details.paidVia;
    session.stripePaymentIntentId = details.stripePaymentIntentId;
    session.stripeCheckoutSessionId = details.stripeCheckoutSessionId;
    session.cryptoTxHash = details.cryptoTxHash;
    session.updatedAt = new Date();
  }

  /** Mark a session as settled (resource was served) */
  async markSettled(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = "settled";
    session.updatedAt = new Date();
  }

  /** Mark a session as failed */
  async markFailed(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = "failed";
    session.updatedAt = new Date();
  }

  /** Purge expired sessions (call periodically) */
  cleanup(): number {
    let purged = 0;
    const now = new Date();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now && session.status === "pending") {
        this.sessions.delete(id);
        purged++;
      }
    }
    return purged;
  }
}

/** Singleton session manager */
export const sessionManager = new SessionManager();
