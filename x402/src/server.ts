import express from "express";
import { env } from "./config.js";
import { stripePaymentMiddleware } from "./x402/middleware.js";
import { handleStripeWebhook } from "./stripe/webhooks.js";
import healthRoutes from "./routes/health.js";
import paymentRoutes from "./routes/payment.js";
import apiRoutes from "./routes/api.js";
import type { PaymentRoutes } from "./x402/types.js";

export function createServer() {
  const app = express();

  // ── Stripe webhook route (needs raw body, must be registered BEFORE json parser) ─
  app.post("/stripe/webhooks", express.raw({ type: "application/json" }), handleStripeWebhook);

  // ── Standard JSON body parser for everything else ──────────────────────────
  app.use(express.json());

  // ── Health check (no payment required) ─────────────────────────────────────
  app.use(healthRoutes);

  // ── Payment status & redirect routes ───────────────────────────────────────
  app.use(paymentRoutes);

  // ── Define which routes require payment ────────────────────────────────────
  const paymentConfig: PaymentRoutes = {
    "GET /api/weather": {
      price: "$0.001",
      description: "Real-time weather data",
      mimeType: "application/json",
      enableStripe: true,
      evmNetwork: "eip155:84532",
    },
    "GET /api/premium-data": {
      price: "$0.10",
      description: "Premium market analysis",
      mimeType: "application/json",
      enableStripe: true,
      evmNetwork: "eip155:84532",
    },
    "GET /api/rickroll": {
      price: "$0.50",
      description: "Exclusive premium content — pay to reveal",
      mimeType: "text/html",
      enableStripe: true,
    },
  };

  // ── Stripe payment middleware (checks X-Payment-Session header) ────────────
  app.use(stripePaymentMiddleware(paymentConfig));

  // ── x402 crypto payment middleware (optional, requires @x402/express) ──────
  // Uncomment below once @x402/express and a facilitator are configured:
  //
  // import { paymentMiddleware, x402ResourceServer } from "@x402/express";
  // import { ExactEvmScheme } from "@x402/evm/exact/server";
  // import { HTTPFacilitatorClient } from "@x402/core/server";
  //
  // const resourceServer = new x402ResourceServer(
  //   new HTTPFacilitatorClient({ url: env.FACILITATOR_URL })
  // ).register("eip155:84532", new ExactEvmScheme());
  //
  // app.use(
  //   paymentMiddleware(
  //     {
  //       "GET /api/weather": {
  //         accepts: {
  //           scheme: "exact",
  //           price: "$0.001",
  //           network: "eip155:84532",
  //           payTo: env.EVM_ADDRESS as `0x${string}`,
  //         },
  //         description: "Real-time weather data",
  //         mimeType: "application/json",
  //       },
  //       "GET /api/premium-data": {
  //         accepts: {
  //           scheme: "exact",
  //           price: "$0.10",
  //           network: "eip155:84532",
  //           payTo: env.EVM_ADDRESS as `0x${string}`,
  //         },
  //         description: "Premium market analysis",
  //         mimeType: "application/json",
  //       },
  //     },
  //     resourceServer,
  //   ),
  // );

  // ── Protected API routes ───────────────────────────────────────────────────
  app.use(apiRoutes);

  return app;
}

export function startServer() {
  const app = createServer();
  const port = env.PORT;

  app.listen(port, () => {
    console.log(`\n🚀 x402-stripe server running at http://localhost:${port}`);
    console.log(`   Health:   http://localhost:${port}/health`);
    console.log(`   Weather:  http://localhost:${port}/api/weather  (payment required)`);
    console.log(`   Premium:  http://localhost:${port}/api/premium-data  (payment required)`);
    console.log(`   Rickroll: http://localhost:${port}/api/rickroll  (payment required)`);
    console.log(`   Webhook:  POST http://localhost:${port}/stripe/webhooks\n`);
  });

  return app;
}
