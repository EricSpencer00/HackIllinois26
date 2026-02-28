import { Router } from "express";
import { sessionManager } from "../bridge/session-manager.js";

const router = Router();

/**
 * GET /payment/success
 * Stripe redirects here after a successful checkout.
 */
router.get("/payment/success", (req, res) => {
  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    res.status(400).json({ error: "Missing session_id" });
    return;
  }

  const session = sessionManager.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // If the paid resource is the rickroll endpoint, redirect directly to reveal it
  if (session.resourceUrl.includes("/api/rickroll")) {
    // Mark as settled so the session token works if they visit again
    session.status = "settled";
    session.updatedAt = new Date();
    res.redirect(`/api/rickroll?paid_session=${sessionId}`);
    return;
  }

  res.json({
    message: "Payment received! You can now access the protected resource.",
    sessionId,
    status: session.status,
    instructions: {
      header: "X-Payment-Session",
      value: sessionId,
      description:
        "Include this header in your next request to the protected endpoint to gain access.",
    },
  });
});

/**
 * GET /payment/cancel
 * Stripe redirects here when the user cancels checkout.
 */
router.get("/payment/cancel", (req, res) => {
  const sessionId = req.query.session_id as string;
  res.json({
    message: "Payment was cancelled. You can retry by requesting the protected resource again.",
    sessionId,
  });
});

/**
 * GET /payment/status/:sessionId
 * Poll payment status (useful for clients waiting on webhook confirmation).
 */
router.get("/payment/status/:sessionId", (req, res) => {
  const session = sessionManager.get(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json({
    sessionId: session.id,
    status: session.status,
    paidVia: session.paidVia,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  });
});

export default router;
