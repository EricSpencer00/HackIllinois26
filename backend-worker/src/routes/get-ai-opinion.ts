/**
 * /get-ai-opinion ENDPOINT (POST)
 * - Interacts with: The React Frontend (receives the question) and `pythonClient.ts`.
 * - Payload received: { "question": "Will Elon become a trillionaire by Dec?" }
 * - Action: Forwards the question to the Python FastAPI server for scraping and AI inference.
 * - Returns: JSON with the AI's confidence score (e.g., 75%) and reasoning/sentiment.
 */