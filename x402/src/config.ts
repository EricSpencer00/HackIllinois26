import { z } from "zod";
import { config as loadEnv } from "dotenv";

loadEnv();

const envSchema = z.object({
  PORT: z.coerce.number().default(4402),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // x402 / Crypto
  FACILITATOR_URL: z.string().url("FACILITATOR_URL must be a valid URL").optional().default("https://brightbet.tech/api/x402/facilitator"),
  EVM_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "EVM_ADDRESS must be a valid Ethereum address")
    .optional()
    .default("0x0000000000000000000000000000000000000000"),
  SVM_ADDRESS: z.string().optional(),

  // App
  APP_BASE_URL: z.string().url().default("http://localhost:4402"),
  SESSION_SECRET: z.string().min(8).default("change-me-in-production"),
});

export type Env = z.infer<typeof envSchema>;

function loadConfig(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadConfig();
