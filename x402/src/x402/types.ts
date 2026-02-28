// ── x402 bridge types ────────────────────────────────────────────────────────

/** Route configuration for a protected endpoint */
export interface RoutePaymentConfig {
  /** Human-readable price, e.g. "$0.10" */
  price: string;
  /** Description of the protected resource */
  description: string;
  /** MIME type of the response */
  mimeType?: string;
  /** Whether to also offer a Stripe fiat payment option */
  enableStripe?: boolean;
  /** EVM network CAIP-2 identifier (e.g. "eip155:84532") */
  evmNetwork?: string;
  /** SVM network CAIP-2 identifier */
  svmNetwork?: string;
  /** Currency code for Stripe payments (default "usd") */
  currency?: string;
}

/** Map of "METHOD /path" → payment configuration */
export type PaymentRoutes = Record<string, RoutePaymentConfig>;

/** Combined 402 response body that offers both crypto and Stripe options */
export interface HybridPaymentRequired {
  x402Version: number;
  error: string;
  resource: {
    url: string;
    description: string;
    mimeType?: string;
  };
  /** Standard x402 crypto payment requirements */
  accepts: Array<{
    scheme: string;
    network: string;
    amount: string;
    asset: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra?: Record<string, unknown>;
  }>;
  /** Stripe fiat payment option (when enabled) */
  stripe?: {
    checkoutUrl: string;
    sessionId: string;
    expiresAt: string;
  };
}
