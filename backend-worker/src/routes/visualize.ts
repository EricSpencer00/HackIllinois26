/**
 * /visualize ENDPOINT (GET/POST)
 * - Interacts with: The React Frontend and `pythonClient.ts`.
 * - Action: Fetches all the raw scraped data/context from Python.
 * - Returns: Formatted JSON tailored for the React UI. Groups the data into "planets" 
 * (e.g., separating Wikipedia info from Polymarket odds) so the frontend can easily render it.
 */