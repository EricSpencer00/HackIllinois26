import { Router } from "express";

const router = Router();

/**
 * GET /health
 * Basic health check — useful for load balancers & uptime monitors.
 */
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
