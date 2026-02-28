export { createServer, startServer } from "./server.js";
export { stripePaymentMiddleware } from "./x402/middleware.js";
export { PaymentBridge, paymentBridge } from "./bridge/payment-bridge.js";
export { sessionManager } from "./bridge/session-manager.js";
export {
  stripe,
  createCheckoutSession,
  createPaymentIntent,
  handleStripeWebhook,
} from "./stripe/index.js";
export type {
  PaymentRoutes,
  RoutePaymentConfig,
  HybridPaymentRequired,
} from "./x402/types.js";
export type {
  PaymentSession,
  StripePaymentOption,
  X402PaymentMetadata,
} from "./stripe/types.js";

// ── Start the server when run directly ───────────────────────────────────────
import { startServer } from "./server.js";
startServer();
