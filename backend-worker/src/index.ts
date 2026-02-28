/**
 * MAIN WORKER ENTRY POINT
 * Intercepts incoming HTTP requests and routes them to the correct handler.
 * - Sets up CORS headers so the React frontend can talk to it.
 * - Routes to /health, /get-ai-opinion, /visualize, and /planet-categories.
 * - (Optional) Integrates Cloudflare Queues if the request takes too long.
 */