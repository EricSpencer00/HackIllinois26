import { Router } from "express";

const router = Router();

/**
 * GET /api/weather
 *
 * Example protected endpoint — requires payment via x402 crypto or Stripe.
 * The payment middleware intercepts requests without valid payment and
 * returns 402. Once paid, this handler serves the data.
 */
router.get("/api/weather", (_req, res) => {
  res.json({
    report: {
      city: "San Francisco",
      weather: "foggy",
      temperature: 62,
      humidity: 78,
      wind: "12 mph W",
      forecast: "Clearing by afternoon",
    },
  });
});

/**
 * GET /api/premium-data
 *
 * Another example protected endpoint with a higher price point.
 */
router.get("/api/premium-data", (_req, res) => {
  res.json({
    analysis: {
      market: "bullish",
      confidence: 0.87,
      signals: ["momentum", "volume", "trend"],
      generatedAt: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/rickroll
 *
 * Premium paid endpoint — after Stripe payment, reveals the exclusive content.
 */
router.get("/api/rickroll", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusive Premium Content</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; }
    .container { text-align: center; }
    h1 { color: #fff; margin-bottom: 1rem; font-size: 2rem; }
    img { max-width: 90vw; max-height: 70vh; border-radius: 12px; box-shadow: 0 0 40px rgba(255,100,100,0.4); }
    p { color: #aaa; margin-top: 1rem; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>\uD83C\uDFA4 You just got Rick Rolled \uD83C\uDFA4</h1>
    <img src="https://media1.giphy.com/media/Vuw9m5wXviFIQ/giphy.gif" alt="Rick Astley - Never Gonna Give You Up" />
    <p>Never gonna give you up, never gonna let you down \uD83C\uDFB5</p>
    <p style="margin-top: 0.5rem; color: #666;">Paid via x402 + Stripe</p>
  </div>
</body>
</html>`);
});

export default router;
