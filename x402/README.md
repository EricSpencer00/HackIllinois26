# x402-stripe

An integration scaffold that bridges the [x402 protocol](https://x402.org) (HTTP 402 Payment Required) with [Stripe](https://stripe.com), enabling servers to accept **both crypto and fiat payments** on any HTTP endpoint.

## Quick start

```bash
npm install
cp .env.example .env   # fill in Stripe keys
npm run dev
```

## Test the rickroll flow

```bash
# 1. Hit the paid endpoint — get a 402 with Stripe checkout URL
curl -s http://localhost:4402/api/rickroll | jq

# 2. Open the checkoutUrl in a browser, pay with test card 4242 4242 4242 4242

# 3. You get redirected to the Rick Roll reveal page 🎤
```
