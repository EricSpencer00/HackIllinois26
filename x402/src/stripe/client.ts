import Stripe from "stripe";
import { env } from "../config.js";

/** Singleton Stripe client configured from environment */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  appInfo: {
    name: "x402-stripe",
    version: "0.1.0",
    url: "https://github.com/your-org/x402-stripe",
  },
});
