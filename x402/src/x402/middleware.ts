import type { Request, Response, NextFunction } from "express";
import { paymentBridge } from "../bridge/payment-bridge.js";
import { sessionManager } from "../bridge/session-manager.js";
import type { PaymentRoutes } from "./types.js";

/**
 * Express middleware that adds Stripe as a fiat payment rail alongside the
 * standard x402 crypto flow.
 *
 * ## How it works
 *
 * 1. Incoming request hits a protected route.
 * 2. If the request carries a valid `X-Payment-Session` header whose session
 *    is marked as paid, the request is allowed through (Stripe path).
 * 3. If the request carries a `PAYMENT-SIGNATURE` header, it falls through to
 *    the standard x402 express middleware for crypto verification.
 * 4. Otherwise, the middleware returns 402 with both crypto `accepts` and a
 *    Stripe `checkoutUrl`, letting the client choose their payment rail.
 *
 * ### Usage
 *
 * ```ts
 * import { stripePaymentMiddleware } from "./x402/middleware.js";
 *
 * app.use(stripePaymentMiddleware({
 *   "GET /api/data": {
 *     price: "$0.10",
 *     description: "Premium data endpoint",
 *     enableStripe: true,
 *   },
 * }));
 * ```
 */
export function stripePaymentMiddleware(routes: PaymentRoutes) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const routeKey = `${req.method} ${req.path}`;
    const config = routes[routeKey];

    // Not a protected route — pass through
    if (!config || !config.enableStripe) {
      next();
      return;
    }

    // ── Check for a paid Stripe session ────────────────────────────────
    const sessionId =
      (req.headers["x-payment-session"] as string | undefined) ||
      (req.query.paid_session as string | undefined);
    if (sessionId) {
      const session = sessionManager.get(sessionId);
      if (session && (session.status === "paid" || session.status === "settled")) {
        // Payment confirmed — allow access and mark as settled
        await paymentBridge.settleSession(sessionId);
        res.setHeader("X-Payment-Settled", "true");
        res.setHeader("X-Payment-Session", sessionId);
        next();
        return;
      }

      if (session && session.status === "pending") {
        // Payment started but not yet confirmed — tell client to wait
        res.status(402).json({
          error: "Payment pending",
          message: "Your Stripe payment has not been confirmed yet. Please wait or retry.",
          sessionId,
          status: session.status,
        });
        return;
      }
    }

    // ── Check for standard x402 crypto payment header ──────────────────
    if (req.headers["payment-signature"]) {
      // Let the x402 express middleware handle crypto verification
      next();
      return;
    }

    // ── No payment — return 402 with Stripe option ─────────────────────
    try {
      const stripeOption = await paymentBridge.createStripeOption({
        resourceUrl: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
        price: config.price,
        currency: config.currency,
        description: config.description,
      });

      const body = {
        error: "Payment required",
        resource: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          description: config.description,
          mimeType: config.mimeType,
        },
        paymentOptions: {
          stripe: {
            checkoutUrl: stripeOption.checkoutUrl,
            sessionId: stripeOption.sessionId,
            expiresAt: stripeOption.expiresAt,
          },
        },
        message:
          "Pay via Stripe checkout or include a PAYMENT-SIGNATURE header for crypto payment.",
      };

      res.status(402).json(body);
    } catch (err) {
      console.error("Failed to create Stripe payment option:", err);
      // Fall through to standard x402 middleware
      next();
    }
  };
}
