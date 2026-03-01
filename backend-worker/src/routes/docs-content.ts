// Auto-generated file - do not edit
// Run: node scripts/generate-docs-templates.js to regenerate

export const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BRIGHTBET // API DOCS</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/docs/styles.css">
</head>
<body>
  <div class="ascii-bg" aria-hidden="true"></div>
  
  <header class="header">
    <a href="/" class="logo">BRIGHTBET</a>
    <nav class="nav">
      <a href="/docs" class="nav-link active">HOME</a>
      <a href="/docs/api-reference.html" class="nav-link">API</a>
      <a href="/docs/architecture.html" class="nav-link">ARCH</a>
      <a href="/docs/x402.html" class="nav-link">X402</a>
    </nav>
  </header>

  <main class="main">
    <section class="hero">
      <pre class="ascii-art hero-ascii" aria-hidden="true">
░████████            ░██           ░██           ░██    ░████████                 ░██           ░██                          ░██           
░██    ░██                         ░██           ░██    ░██    ░██                ░██           ░██                          ░██           
░██    ░██  ░██░████ ░██ ░████████ ░████████  ░████████ ░██    ░██   ░███████  ░████████     ░████████  ░███████   ░███████  ░████████     
░████████   ░███     ░██░██    ░██ ░██    ░██    ░██    ░████████   ░██    ░██    ░██           ░██    ░██    ░██ ░██    ░██ ░██    ░██    
░██     ░██ ░██      ░██░██    ░██ ░██    ░██    ░██    ░██     ░██ ░█████████    ░██           ░██    ░█████████ ░██        ░██    ░██    
░██     ░██ ░██      ░██░██   ░███ ░██    ░██    ░██    ░██     ░██ ░██           ░██           ░██    ░██        ░██    ░██ ░██    ░██    
░█████████  ░██      ░██ ░█████░██ ░██    ░██     ░████ ░█████████   ░███████      ░████ ░██     ░████  ░███████   ░███████  ░██    ░██    
                               ░██                                                                                                         
                         ░███████                                                                                                          
                                                                                                                                           
      </pre>
      <h1 class="hero-title">API DOCUMENTATION</h1>
      <p class="hero-subtitle">Real-time predictive markets &amp; AI-powered analysis</p>
    </section>

    <section class="grid">
      <article class="card">
        <div class="card-header">
          <span class="card-icon">01</span>
          <h2 class="card-title">CLOUDFLARE WORKER</h2>
        </div>
        <p class="card-desc">Primary API gateway handling all public endpoints. Built on Cloudflare Workers for edge deployment.</p>
        <code class="card-code">brightbet.tech/api/*</code>
        <a href="/docs/api-reference.html" class="card-link">VIEW ENDPOINTS →</a>
      </article>

      <article class="card">
        <div class="card-header">
          <span class="card-icon">02</span>
          <h2 class="card-title">QUANT ENGINE</h2>
        </div>
        <p class="card-desc">Python FastAPI backend for data aggregation. Scrapes Polymarket, Finnhub, Wikipedia, and computes confidence scores.</p>
        <code class="card-code">localhost:8000/api/*</code>
        <a href="/docs/architecture.html#quant" class="card-link">VIEW ARCHITECTURE →</a>
      </article>

      <article class="card">
        <div class="card-header">
          <span class="card-icon">03</span>
          <h2 class="card-title">X402 PAYMENTS</h2>
        </div>
        <p class="card-desc">Stripe-based payment gateway implementing the x402 protocol for micropayments and paywalled content.</p>
        <code class="card-code">/api/rickroll (paywalled)</code>
        <a href="/docs/x402.html" class="card-link">VIEW PROTOCOL →</a>
      </article>

      <article class="card">
        <div class="card-header">
          <span class="card-icon">04</span>
          <h2 class="card-title">AI GENERATION</h2>
        </div>
        <p class="card-desc">Cloudflare Workers AI for cinematic image builds and meme synthesis using Stable Diffusion XL.</p>
        <code class="card-code">/api/generate-image</code>
        <a href="/docs/api-reference.html#ai" class="card-link">VIEW AI ENDPOINTS →</a>
      </article>
    </section>

    <section class="quick-start">
      <h2 class="section-title">// QUICK START</h2>
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">CURL</span>
          <span class="code-file">get-ai-opinion</span>
        </div>
        <pre class="code-content">curl -X POST https://brightbet.tech/api/get-ai-opinion \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Will Tesla hit \$500 by 2026?"}'</pre>
      </div>
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">JSON</span>
        </div>
        <pre class="code-content">{
  "confidence_score": 72,
  "sentiment": "bullish",
  "reasoning": "Based on current trajectory...",
  "sources": { ... }
}</pre>
      </div>
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">CURL</span>
          <span class="code-file">generate-image</span>
        </div>
        <pre class="code-content">curl -X POST https://brightbet.tech/api/generate-image \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Visualize a neon planet surrounded by auroras", "sentiment": "neutral", "confidence": 64}'</pre>
      </div>
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">JSON</span>
        </div>
        <pre class="code-content">{
  "type": "image",
  "prompt": "A glowing planet floating in deep space...",
  "sentiment": "neutral",
  "confidence": 64,
  "imageData": "data:image/png;base64,...."
}</pre>
      </div>
    </section>

    <section class="endpoints-overview">
      <h2 class="section-title">// SYSTEM ARCHITECTURE</h2>
      <div class="tech-stack-grid">
        <div class="tech-card">
          <h3>FRONTEND</h3>
          <ul>
            <li>React 18 / Vite</li>
            <li>TypeScript</li>
            <li>Three.js Visuals</li>
          </ul>
        </div>
        <div class="tech-card">
          <h3>BACKEND</h3>
          <ul>
            <li>Cloudflare Workers</li>
            <li>Workers AI (SDXL)</li>
            <li>KV Asset Store</li>
          </ul>
        </div>
        <div class="tech-card">
          <h3>QUANT ENGINE</h3>
          <ul>
            <li>FastAPI / Python 3</li>
            <li>Llama 3.3 70B</li>
            <li>Multi-Source Scraping</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="data-sources">
      <h2 class="section-title">// DATA SOURCES (PLANETS)</h2>
      <div class="source-list">
        <p>The solar-system metaphor maps each planet to a unique data provider:</p>
        <div class="source-grid">
          <span>STOCKS: Finnhub</span>
          <span>CRYPTO: CoinGecko</span>
          <span>MARKETS: Polymarket</span>
          <span>SENTIMENT: Reddit</span>
          <span>MACRO: FRED</span>
          <span>KNOWLEDGE: Wikipedia</span>
        </div>
      </div>
    </section>

    <section class="endpoints-overview">
      <h2 class="section-title">// ENDPOINT OVERVIEW</h2>
      <table class="endpoint-table">
        <thead>
          <tr>
            <th>METHOD</th>
            <th>ENDPOINT</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="method get">GET</span></td>
            <td>/api/health</td>
            <td>Health check with status metadata.</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td>/api/get-ai-opinion</td>
            <td>Multi-source AI market reasoning.</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td>/api/visualize</td>
            <td>Build planet visualization payload (GET with <code>?question=</code> supported).</td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td>/api/planet-categories</td>
            <td>Retrieve UI category metadata.</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td>/api/generate-image</td>
            <td>AI visualization image (alias: <code>/api/generate-video</code>).</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td>/api/generate-meme</td>
            <td>Premium AI meme generator after x402 payment.</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td>/api/candles</td>
            <td>OHLC + prediction series for charting.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-content">
      <pre class="footer-ascii">
  *    .  *       .             *
                       *
   *   .        *          .        .   *
      </pre>
      <p class="footer-text">BRIGHTBET // HACKILLINOIS 2026</p>
      <p class="footer-links">
        <a href="https://github.com/EricSpencer00/HackIllinois26">GITHUB</a>
        <span class="separator">|</span>
        <a href="https://brightbet.tech">LIVE DEMO</a>
      </p>
    </div>
  </footer>
      <!-- Add copy buttons to code blocks -->
      <script>
        (function () {
          const LABEL = 'COPY';
          const blocks = document.querySelectorAll('.code-block');
          if (!blocks.length) return;

          function copyText(text) {
            const trimmed = text.replace(/\\u00A0/g, ' ').trim();
            if (navigator.clipboard?.writeText) {
              return navigator.clipboard.writeText(trimmed);
            }
            return new Promise((resolve, reject) => {
              const textarea = document.createElement('textarea');
              textarea.value = trimmed;
              textarea.style.position = 'fixed';
              textarea.style.left = '-9999px';
              textarea.style.opacity = '0';
              document.body.appendChild(textarea);
              textarea.select();
              const success = document.execCommand('copy');
              document.body.removeChild(textarea);
              success ? resolve() : reject(new Error('execCommand failed'));
            });
          }

          blocks.forEach((block) => {
            const pre = block.querySelector('.code-content');
            if (!pre) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'copy-btn';
            button.textContent = LABEL;
            block.appendChild(button);
            button.addEventListener('click', () => {
              copyText(pre.innerText || pre.textContent || '')
                .then(() => {
                  button.textContent = 'COPIED';
                  button.classList.add('copied');
                  setTimeout(() => {
                    button.textContent = LABEL;
                    button.classList.remove('copied');
                  }, 1500);
                })
                .catch((err) => {
                  console.error('Copy failed', err);
                  button.textContent = 'FAILED';
                  button.classList.remove('copied');
                  setTimeout(() => {
                    button.textContent = LABEL;
                  }, 1500);
                });
            });
          });
        })();
      </script>
</body>
</html>
`;

export const apiReferenceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API REFERENCE // BRIGHTBET</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/docs/styles.css">
</head>
<body>
  <div class="ascii-bg" aria-hidden="true"></div>
  
  <header class="header">
    <a href="/" class="logo">BRIGHTBET</a>
    <nav class="nav">
      <a href="/docs" class="nav-link">HOME</a>
      <a href="/docs/api-reference.html" class="nav-link active">API</a>
      <a href="/docs/architecture.html" class="nav-link">ARCH</a>
      <a href="/docs/x402.html" class="nav-link">X402</a>
    </nav>
  </header>

  <main class="main">
    <section class="hero">
      <h1 class="hero-title">// API REFERENCE</h1>
      <p class="hero-subtitle">Complete endpoint documentation for BrightBet APIs</p>
    </section>

    <!-- Health Check -->
    <section class="endpoint-section" id="health">
      <div class="endpoint-header">
        <span class="endpoint-method method get">GET</span>
        <code class="endpoint-path">/api/health</code>
      </div>
      <p class="endpoint-desc">Health check endpoint to verify the API is running. Returns status information.</p>
      
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">200 OK</span>
        </div>
        <pre class="code-content">{
  "status": "ok",
  "version": "1.0.0"
}</pre>
      </div>
    </section>

    <!-- Get AI Opinion -->
    <section class="endpoint-section" id="ai-opinion">
      <div class="endpoint-header">
        <span class="endpoint-method method post">POST</span>
        <code class="endpoint-path">/api/get-ai-opinion</code>
      </div>
      <p class="endpoint-desc">
        Primary endpoint for AI-powered market analysis. Aggregates data from Polymarket, Finnhub, 
        Wikipedia, Reddit, and more to generate a confidence score and sentiment analysis.
      </p>
      
      <h4 class="params-title">REQUEST BODY</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>PARAMETER</th>
            <th>TYPE</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">question</span><span class="param-required">REQUIRED</span></td>
            <td><span class="param-type">string</span></td>
            <td>The prediction question to analyze (e.g., "Will Tesla hit \$500?")</td>
          </tr>
          <tr>
            <td><span class="param-name">context</span></td>
            <td><span class="param-type">string</span></td>
            <td>Additional context to inform the analysis</td>
          </tr>
          <tr>
            <td><span class="param-name">symbol</span></td>
            <td><span class="param-type">string</span></td>
            <td>Stock ticker symbol (auto-detected if not provided)</td>
          </tr>
        </tbody>
      </table>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">CURL</span>
          <span class="code-file">Example Request</span>
        </div>
        <pre class="code-content">curl -X POST https://brightbet.tech/api/get-ai-opinion \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "Will Bitcoin hit \$200k by December 2026?"
  }'</pre>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">200 OK</span>
        </div>
        <pre class="code-content">{
  "confidence_score": 68,
  "sentiment": "bullish",
  "reasoning": "Based on current market trends, halving cycle analysis...",
  "question": "Will Bitcoin hit \$200k by December 2026?",
  "symbol": null,
  "cryptoId": "bitcoin",
  "sources": {
    "wikipedia": [...],
    "polymarket": [...],
    "finnhub": null,
    "coingecko": { "price": 95420, "change24h": 2.3 },
    "fearGreed": { "value": 72, "label": "Greed" },
    "reddit": [...],
    "fred": [...]
  }
}</pre>
      </div>
    </section>

    <!-- Planet Categories -->
    <section class="endpoint-section" id="categories">
      <div class="endpoint-header">
        <span class="endpoint-method method get">GET</span>
        <code class="endpoint-path">/api/planet-categories</code>
      </div>
      <p class="endpoint-desc">Returns the list of prediction categories used for visualization and classification.</p>
      
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">200 OK</span>
        </div>
        <pre class="code-content">{
  "categories": [
    { "id": "stocks", "name": "Stocks", "icon": "📈", "color": "#4ade80" },
    { "id": "crypto", "name": "Crypto", "icon": "₿", "color": "#f59e0b" },
    { "id": "politics", "name": "Politics", "icon": "🏛️", "color": "#3b82f6" },
    ...
  ]
}</pre>
      </div>
    </section>

    <!-- Candles -->
    <section class="endpoint-section" id="candles">
      <div class="endpoint-header">
        <span class="endpoint-method method post">POST</span>
        <code class="endpoint-path">/api/candles</code>
      </div>
      <p class="endpoint-desc">
        Fetches candlestick chart data for stocks, cryptocurrencies, or Polymarket prediction markets.
      </p>
      
      <h4 class="params-title">REQUEST BODY</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>PARAMETER</th>
            <th>TYPE</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">symbol</span></td>
            <td><span class="param-type">string</span></td>
            <td>Stock ticker symbol (e.g., "TSLA")</td>
          </tr>
          <tr>
            <td><span class="param-name">cryptoId</span></td>
            <td><span class="param-type">string</span></td>
            <td>CoinGecko crypto ID (e.g., "bitcoin")</td>
          </tr>
          <tr>
            <td><span class="param-name">polymarketSlug</span></td>
            <td><span class="param-type">string</span></td>
            <td>Polymarket market slug</td>
          </tr>
        </tbody>
      </table>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">200 OK</span>
        </div>
        <pre class="code-content">{
  "series": [
    {
      "id": "TSLA",
      "label": "TSLA",
      "type": "candlestick",
      "color": "#4ade80",
      "data": [
        { "time": "2026-02-01", "open": 280, "high": 295, "low": 275, "close": 290 },
        ...
      ]
    }
  ]
}</pre>
      </div>
    </section>

    <!-- AI Generation Section -->
    <section id="ai">
      <h2 class="section-title">// AI GENERATION ENDPOINTS</h2>
    </section>

    <!-- Generate Image -->
    <section class="endpoint-section" id="generate-image">
      <div class="endpoint-header">
        <span class="endpoint-method method post">POST</span>
        <code class="endpoint-path">/api/generate-image</code>
      </div>
      <p class="endpoint-desc">
        Generates an AI visualization image using Cloudflare Workers AI (Stable Diffusion XL).
        Creates cinematic planet/nebula imagery based on sentiment and confidence.
        <br />
        <small>Legacy alias: <code>/api/generate-video</code></small>
      </p>
      
      <h4 class="params-title">REQUEST BODY</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>PARAMETER</th>
            <th>TYPE</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">question</span><span class="param-required">REQUIRED</span></td>
            <td><span class="param-type">string</span></td>
            <td>The query to visualize</td>
          </tr>
          <tr>
            <td><span class="param-name">sentiment</span></td>
            <td><span class="param-type">string</span></td>
            <td>One of: "bullish", "bearish", "neutral"</td>
          </tr>
          <tr>
            <td><span class="param-name">confidence</span></td>
            <td><span class="param-type">number</span></td>
            <td>Confidence score (0-100)</td>
          </tr>
        </tbody>
      </table>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">200 OK</span>
        </div>
        <pre class="code-content">{
  "type": "image",
  "imageData": "data:image/png;base64,iVBORw0KGgo...",
  "prompt": "A glowing planet floating in deep space...",
  "sentiment": "bullish",
  "confidence": 72
}</pre>
      </div>
    </section>

    <!-- Generate Meme -->
    <section class="endpoint-section" id="generate-meme">
      <div class="endpoint-header">
        <span class="endpoint-method method post">POST</span>
        <code class="endpoint-path">/api/generate-meme</code>
      </div>
      <p class="endpoint-desc">
        Generates a humorous AI meme image using Stable Diffusion XL. Creates meme-style 
        imagery based on the input question with random meme formats.
      </p>
      
      <h4 class="params-title">REQUEST BODY</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>PARAMETER</th>
            <th>TYPE</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">question</span><span class="param-required">REQUIRED</span></td>
            <td><span class="param-type">string</span></td>
            <td>The topic for the meme (e.g., "chance of god coming to earth")</td>
          </tr>
        </tbody>
      </table>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">CURL</span>
          <span class="code-file">Example Request</span>
        </div>
        <pre class="code-content">curl -X POST https://brightbet.tech/api/generate-meme \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Will Elon buy Twitter again?"}'</pre>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">200 OK</span>
        </div>
        <pre class="code-content">{
  "type": "meme",
  "imageData": "data:image/png;base64,iVBORw0KGgo...",
  "question": "Will Elon buy Twitter again?",
  "prompt": "A hilarious internet meme image..."
}</pre>
      </div>
    </section>

    <!-- Rickroll / Paywalled Content -->
    <section class="endpoint-section" id="rickroll">
      <div class="endpoint-header">
        <span class="endpoint-method method get">GET</span>
        <code class="endpoint-path">/api/rickroll</code>
      </div>
      <p class="endpoint-desc">
        Paywalled endpoint demonstrating the x402 payment protocol. Returns a 402 Payment Required 
        response with Stripe checkout URL. After payment, generates a custom AI meme.
      </p>
      
      <h4 class="params-title">QUERY PARAMETERS</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>PARAMETER</th>
            <th>TYPE</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">question</span></td>
            <td><span class="param-type">string</span></td>
            <td>Topic for AI meme generation after payment</td>
          </tr>
          <tr>
            <td><span class="param-name">paid_session</span></td>
            <td><span class="param-type">string</span></td>
            <td>Session ID from completed payment</td>
          </tr>
        </tbody>
      </table>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">402 Payment Required</span>
        </div>
        <pre class="code-content">{
  "error": "Payment required",
  "resource": {
    "url": "https://brightbet.tech/api/rickroll?question=...",
    "description": "Free AI meme generator: ...",
    "mimeType": "text/html"
  },
  "paymentOptions": {
    "stripe": {
      "checkoutUrl": "https://checkout.stripe.com/c/pay/...",
      "sessionId": "a091a45b-1865-4b92-...",
      "expiresAt": "2026-03-01T02:00:00.000Z"
    }
  },
  "message": "Pay \$0.50 via Stripe to generate your free AI meme!"
}</pre>
      </div>
    </section>

    <!-- Visualize -->
    <section class="endpoint-section" id="visualize">
      <div class="endpoint-header">
        <span class="endpoint-method method post">POST</span>
        <code class="endpoint-path">/api/visualize</code>
      </div>
      <p class="endpoint-desc">
        Returns visualization configuration data for the frontend 3D scene based on sentiment and category.
      </p>
      
      <h4 class="params-title">REQUEST BODY</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>PARAMETER</th>
            <th>TYPE</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">sentiment</span></td>
            <td><span class="param-type">string</span></td>
            <td>Market sentiment (bullish/bearish/neutral)</td>
          </tr>
          <tr>
            <td><span class="param-name">confidence</span></td>
            <td><span class="param-type">number</span></td>
            <td>Confidence percentage (0-100)</td>
          </tr>
          <tr>
            <td><span class="param-name">category</span></td>
            <td><span class="param-type">string</span></td>
            <td>Prediction category ID</td>
          </tr>
        </tbody>
      </table>
    </section>

  </main>

  <footer class="footer">
    <div class="footer-content">
      <pre class="footer-ascii">
  *    .  *       .             *
                       *
   *   .        *          .        .   *
      </pre>
      <p class="footer-text">BRIGHTBET // HACKILLINOIS 2026</p>
      <p class="footer-links">
        <a href="https://github.com/EricSpencer00/HackIllinois26">GITHUB</a>
        <span class="separator">|</span>
        <a href="https://brightbet.tech">LIVE DEMO</a>
      </p>
    </div>
  </footer>
  <script>
    (function () {
      const LABEL = 'COPY';
      const blocks = document.querySelectorAll('.code-block');
      if (!blocks.length) return;

      function copyText(text) {
        const trimmed = text.replace(/\\u00A0/g, ' ').trim();
        if (navigator.clipboard?.writeText) {
          return navigator.clipboard.writeText(trimmed);
        }
        return new Promise((resolve, reject) => {
          const textarea = document.createElement('textarea');
          textarea.value = trimmed;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textarea);
          success ? resolve() : reject(new Error('execCommand failed'));
        });
      }

      blocks.forEach((block) => {
        const pre = block.querySelector('.code-content');
        if (!pre) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-btn';
        button.textContent = LABEL;
        block.appendChild(button);
        button.addEventListener('click', () => {
          copyText(pre.innerText || pre.textContent || '')
            .then(() => {
              button.textContent = 'COPIED';
              button.classList.add('copied');
              setTimeout(() => {
                button.textContent = LABEL;
                button.classList.remove('copied');
              }, 1500);
            })
            .catch((err) => {
              console.error('Copy failed', err);
              button.textContent = 'FAILED';
              button.classList.remove('copied');
              setTimeout(() => {
                button.textContent = LABEL;
              }, 1500);
            });
        });
      });
    })();
  </script>
</body>
</html>
`;

export const architectureHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARCHITECTURE // BRIGHTBET</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/docs/styles.css">
</head>
<body>
  <div class="ascii-bg" aria-hidden="true"></div>
  
  <header class="header">
    <a href="/" class="logo">BRIGHTBET</a>
    <nav class="nav">
      <a href="/docs" class="nav-link">HOME</a>
      <a href="/docs/api-reference.html" class="nav-link">API</a>
      <a href="/docs/architecture.html" class="nav-link active">ARCH</a>
      <a href="/docs/x402.html" class="nav-link">X402</a>
    </nav>
  </header>

  <main class="main">
    <section class="hero">
      <h1 class="hero-title">// SYSTEM ARCHITECTURE</h1>
      <p class="hero-subtitle">Four-layer microservices architecture for real-time predictions</p>
    </section>

    <!-- System Diagram -->
    <section class="mb-40">
      <h2 class="section-title">// SYSTEM OVERVIEW</h2>
      <div class="arch-diagram">
        <pre>
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  React + Three.js Frontend                                          │    │
│  │  ├── ASCII Effect Renderer (WebGL)                                  │    │
│  │  ├── Real-time 3D Planet Visualizations                             │    │
│  │  └── Brutalist UI Components                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE GATEWAY LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Cloudflare Worker (brightbet.tech)                                 │    │
│  │  ├── API Router & CORS                                              │    │
│  │  ├── Static Asset Serving (KV)                                      │    │
│  │  ├── Workers AI Integration (Stable Diffusion)                      │    │
│  │  └── x402 Payment Middleware                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────────┐  ┌───────────────────────────────────────────┐
│       QUANT ENGINE            │  │           x402 PAYMENT SERVICE            │
│  ┌─────────────────────────┐  │  │  ┌─────────────────────────────────────┐  │
│  │  Python FastAPI         │  │  │  │  Stripe Integration                 │  │
│  │  ├── Data Aggregation   │  │  │  │  ├── Checkout Sessions              │  │
│  │  ├── Groq LLM Inference │  │  │  │  ├── Webhook Handlers               │  │
│  │  └── Scoring Engine     │  │  │  │  └── Session Management             │  │
│  └─────────────────────────┘  │  │  └─────────────────────────────────────┘  │
└───────────────────────────────┘  └───────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA SOURCE LAYER                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Polymarket│ │ Finnhub  │ │Wikipedia │ │CoinGecko │ │  Reddit  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                     │
│  │  FRED    │ │ Google   │ │Fear/Greed│                                     │
│  │(Macro)   │ │ Trends   │ │  Index   │                                     │
│  └──────────┘ └──────────┘ └──────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
        </pre>
      </div>
    </section>

    <!-- Request Flow -->
    <section class="mb-40">
      <h2 class="section-title">// USER REQUEST FLOW</h2>
      <div class="arch-diagram">
        <pre>
USER BROWSER            BACKEND WORKER          QUANT ENGINE          DATA SOURCES
    │                        │                        │                     │
    │  1. Submit Question    │                        │                     │
    │ ────────────────────>  │                        │                     │
    │                        │  2. Analyze Symbols    │                     │
    │                        │ ────────────────────>  │                     │
    │                        │                        │  3. Multi-Source    │
    │                        │                        │     Scraping        │
    │                        │                        │ ─────────────────>  │
    │                        │                        │                     │
    │                        │                        │  4. Technical       │
    │                        │                        │     Indicators      │
    │                        │                        │ <─────────────────  │
    │                        │                        │                     │
    │                        │  5. Aggregated Context │                     │
    │                        │ <────────────────────  │                     │
    │                        │                        │                     │
    │                        │  6. Groq Llama 3.3     │                     │
    │                        │     70B Inference      │                     │
    │                        │ ────────────────────>  │                     │
    │                        │                        │                     │
    │                        │  7. Sentiment &        │                     │
    │                        │     Confidence Score   │                     │
    │                        │ <────────────────────  │                     │
    │                        │                        │                     │
    │  8. Render Solar       │                        │                     │
    │     System Visuals     │                        │                     │
    │ <────────────────────  │                        │                     │
    ▼                        ▼                        ▼                     ▼
        </pre>
      </div>
    </section>

    <!-- Components -->
    <section class="mb-40" id="frontend">
      <h2 class="section-title">// FRONTEND</h2>
      <div class="grid">
        <article class="card">
          <div class="card-header">
            <span class="card-icon">⚛</span>
            <h2 class="card-title">REACT 18</h2>
          </div>
          <p class="card-desc">SPA with hooks-based architecture. Vite for lightning-fast HMR and optimized builds.</p>
          <code class="card-code">frontend/src/</code>
        </article>

        <article class="card">
          <div class="card-header">
            <span class="card-icon">△</span>
            <h2 class="card-title">THREE.JS</h2>
          </div>
          <p class="card-desc">WebGL-powered 3D scene with custom ASCII effect renderer. Real-time planet animations.</p>
          <code class="card-code">AsciiScene.tsx</code>
        </article>

        <article class="card">
          <div class="card-header">
            <span class="card-icon">▪</span>
            <h2 class="card-title">BRUTALIST UI</h2>
          </div>
          <p class="card-desc">Monospace typography, black/white palette, minimal borders, no rounded corners.</p>
          <code class="card-code">styles/global.css</code>
        </article>
      </div>
    </section>

    <!-- Backend Worker -->
    <section class="mb-40" id="worker">
      <h2 class="section-title">// CLOUDFLARE WORKER</h2>
      
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">STRUCTURE</span>
          <span class="code-file">backend-worker/</span>
        </div>
        <pre class="code-content">backend-worker/
├── src/
│   ├── index.ts           # Main router, CORS, static serving
│   ├── routes/
│   │   ├── health.ts      # Health check endpoint
│   │   ├── get-ai-opinion.ts    # AI inference orchestration
│   │   ├── visualize.ts   # Visualization data
│   │   ├── planet-categories.ts # Category definitions
│   │   ├── generate-image.ts    # AI image generation
│   │   ├── generate-meme.ts     # AI meme generation
│   │   ├── candles.ts     # Chart data endpoint
│   │   └── x402-payment.ts      # Payment flow handlers
│   └── services/
│       ├── stripe.ts      # Stripe checkout integration
│       └── pythonClient.ts      # Quant engine client
├── wrangler.toml          # Worker configuration
└── tests/                 # Vitest test suite</pre>
      </div>

      <div class="tech-stack">
        <div class="tech-item">
          <h3 class="tech-name">WORKERS AI</h3>
          <p class="tech-desc">Stable Diffusion XL Base 1.0 for image generation. No API key needed.</p>
        </div>
        <div class="tech-item">
          <h3 class="tech-name">KV STORAGE</h3>
          <p class="tech-desc">Static asset serving with __STATIC_CONTENT namespace. SPA fallback routing.</p>
        </div>
        <div class="tech-item">
          <h3 class="tech-name">EDGE DEPLOYMENT</h3>
          <p class="tech-desc">Global edge network with sub-50ms cold starts. Auto-scaling.</p>
        </div>
      </div>
    </section>

    <!-- Quant Engine -->
    <section class="mb-40" id="quant">
      <h2 class="section-title">// QUANT ENGINE</h2>
      
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">STRUCTURE</span>
          <span class="code-file">quant-engine/</span>
        </div>
        <pre class="code-content">quant-engine/
├── app.py                 # FastAPI server, main routes
├── scoring.py             # Confidence score calculation
├── scraping/
│   ├── __init__.py
│   ├── polymarket.py      # Polymarket API scraping
│   ├── finnHub.py         # Finnhub stock data
│   └── wikipedia.py       # Wikipedia context
├── requirements.txt       # Python dependencies
└── tests/                 # Pytest test suite</pre>
      </div>

      <h3 class="params-title mt-40">DATA AGGREGATION FLOW</h3>
      <div class="arch-diagram">
        <pre>
┌─────────────┐    ┌─────────────────────────────────────────────┐
│  /api/      │    │              CONCURRENT FETCH               │
│  analyze    │───▶│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│             │    │  │Polymarket | Finnhub │ │Wikipedia│        │
└─────────────┘    │  └────┬────┘ └────┬────┘ └────┬────┘        │
                   │       │           │           │             │
                   │       └───────────┼───────────┘             │
                   │                   ▼                         │
                   │         ┌─────────────────┐                 │
                   │         │ Context Builder │                 │
                   │         └────────┬────────┘                 │
                   │                  ▼                          │
                   │         ┌─────────────────┐                 │
                   │         │   Groq LLM      │                 │
                   │         │   (Llama 3)     │                 │
                   │         └────────┬────────┘                 │
                   │                  ▼                          │
                   │         ┌─────────────────┐                 │
                   │         │ Scoring Engine  │                 │
                   │         └────────┬────────┘                 │
                   └──────────────────┼──────────────────────────┘
                                      ▼
                              { confidence_score,
                                sentiment,
                                reasoning,
                                sources }
        </pre>
      </div>

      <div class="tech-stack">
        <div class="tech-item">
          <h3 class="tech-name">GROQ</h3>
          <p class="tech-desc">Llama 3 70B inference with ~100ms latency. JSON mode for structured output.</p>
        </div>
        <div class="tech-item">
          <h3 class="tech-name">CONCURRENT.FUTURES</h3>
          <p class="tech-desc">ThreadPoolExecutor for parallel API calls. ~500ms total latency.</p>
        </div>
        <div class="tech-item">
          <h3 class="tech-name">PYDANTIC</h3>
          <p class="tech-desc">Request/response validation. Type-safe API contracts.</p>
        </div>
      </div>
    </section>

    <!-- Data Sources -->
    <section class="mb-40" id="sources">
      <h2 class="section-title">// DATA SOURCES</h2>
      
      <table class="endpoint-table">
        <thead>
          <tr>
            <th>SOURCE</th>
            <th>DATA TYPE</th>
            <th>USAGE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Polymarket</td>
            <td>Prediction markets</td>
            <td>Market sentiment, yes/no prices, volume</td>
          </tr>
          <tr>
            <td>Finnhub</td>
            <td>Stock data</td>
            <td>Quotes, news, company sentiment</td>
          </tr>
          <tr>
            <td>CoinGecko</td>
            <td>Crypto data</td>
            <td>Prices, 24h/7d changes, market cap</td>
          </tr>
          <tr>
            <td>Wikipedia</td>
            <td>Background info</td>
            <td>Entity context, historical data</td>
          </tr>
          <tr>
            <td>Reddit</td>
            <td>Social sentiment</td>
            <td>Popular posts, community sentiment</td>
          </tr>
          <tr>
            <td>FRED</td>
            <td>Macro data</td>
            <td>GDP, unemployment, interest rates</td>
          </tr>
          <tr>
            <td>Fear & Greed</td>
            <td>Market index</td>
            <td>Overall market sentiment (0-100)</td>
          </tr>
          <tr>
            <td>Google Trends</td>
            <td>Search interest</td>
            <td>Popularity trends, related queries</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Deployment -->
    <section class="mb-40" id="deployment">
      <h2 class="section-title">// DEPLOYMENT</h2>
      
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">COMMANDS</span>
          <span class="code-file">deploy</span>
        </div>
        <pre class="code-content"># Deploy Cloudflare Worker (includes frontend build)
cd backend-worker && wrangler deploy

# Start Quant Engine locally
cd quant-engine && uvicorn app:app --reload --port 8000

# Run frontend dev server
cd frontend && npm run dev

# Run all tests
cd backend-worker && npm test
cd quant-engine && pytest
cd frontend && npm test</pre>
      </div>
    </section>

  </main>

  <footer class="footer">
    <div class="footer-content">
      <pre class="footer-ascii">
  *    .  *       .             *
                       *
   *   .        *          .        .   *
      </pre>
      <p class="footer-text">BRIGHTBET // HACKILLINOIS 2026</p>
      <p class="footer-links">
        <a href="https://github.com/EricSpencer00/HackIllinois26">GITHUB</a>
        <span class="separator">|</span>
        <a href="https://brightbet.tech">LIVE DEMO</a>
      </p>
    </div>
  </footer>
  <script>
    (function () {
      const LABEL = 'COPY';
      const blocks = document.querySelectorAll('.code-block');
      if (!blocks.length) return;

      function copyText(text) {
        const trimmed = text.replace(/\\u00A0/g, ' ').trim();
        if (navigator.clipboard?.writeText) {
          return navigator.clipboard.writeText(trimmed);
        }
        return new Promise((resolve, reject) => {
          const textarea = document.createElement('textarea');
          textarea.value = trimmed;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textarea);
          success ? resolve() : reject(new Error('execCommand failed'));
        });
      }

      blocks.forEach((block) => {
        const pre = block.querySelector('.code-content');
        if (!pre) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-btn';
        button.textContent = LABEL;
        block.appendChild(button);
        button.addEventListener('click', () => {
          copyText(pre.innerText || pre.textContent || '')
            .then(() => {
              button.textContent = 'COPIED';
              button.classList.add('copied');
              setTimeout(() => {
                button.textContent = LABEL;
                button.classList.remove('copied');
              }, 1500);
            })
            .catch((err) => {
              console.error('Copy failed', err);
              button.textContent = 'FAILED';
              button.classList.remove('copied');
              setTimeout(() => {
                button.textContent = LABEL;
              }, 1500);
            });
        });
      });
    })();
  </script>
</body>
</html>
`;

export const x402Html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>X402 PROTOCOL // BRIGHTBET</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/docs/styles.css">
</head>
<body>
  <div class="ascii-bg" aria-hidden="true"></div>
  
  <header class="header">
    <a href="/" class="logo">BRIGHTBET</a>
    <nav class="nav">
      <a href="/docs" class="nav-link">HOME</a>
      <a href="/docs/api-reference.html" class="nav-link">API</a>
      <a href="/docs/architecture.html" class="nav-link">ARCH</a>
      <a href="/docs/x402.html" class="nav-link active">X402</a>
    </nav>
  </header>

  <main class="main">
    <section class="hero">
      <h1 class="hero-title">// X402 PAYMENT PROTOCOL</h1>
      <p class="hero-subtitle">HTTP 402 Payment Required implementation with Stripe</p>
    </section>

    <!-- What is x402 -->
    <section class="mb-40">
      <h2 class="section-title">// WHAT IS X402?</h2>
      <p class="endpoint-desc">
        The x402 protocol is an implementation of the HTTP 402 "Payment Required" status code. 
        Originally reserved in HTTP/1.1 for future use, it enables machine-readable payment 
        requirements for API endpoints. Our implementation uses Stripe for payment processing.
      </p>
      
      <div class="arch-diagram">
        <pre>
┌──────────────────────────────────────────────────────────────────────────┐
│                         X402 PAYMENT FLOW                                │
│                                                                          │
│   Client                    Server                      Stripe           │
│     │                         │                           │              │
│     │──── GET /api/resource ──▶│                          │              │
│     │                         │                           │              │
│     │◀─── 402 Payment Required │                          │              │
│     │     + checkoutUrl       │                           │              │
│     │     + sessionId         │                           │              │
│     │                         │                           │              │
│     │────────────── Redirect to Stripe checkout ─────────▶│              │
│     │                         │                           │              │
│     │◀────────────── Payment complete, redirect ──────────│              │
│     │                         │                           │              │
│     │──── GET /payment/success?session_id=xxx ───────────▶│              │
│     │                         │────── Verify session ────▶│              │
│     │                         │◀───── Session valid ──────│              │
│     │◀─── 302 Redirect to resource ──│                    │              │
│     │                         │                           │              │
│     │──── GET /api/resource?paid_session=xxx ────────────▶│              │
│     │                         │                           │              │
│     │◀─── 200 OK + content ───│                           │              │
│     │                         │                           │              │
└──────────────────────────────────────────────────────────────────────────┘
        </pre>
      </div>
    </section>

    <!-- Payment Flow Steps -->
    <section class="mb-40">
      <h2 class="section-title">// PAYMENT FLOW</h2>
      
      <div class="flow-step">
        <span class="flow-number">01</span>
        <div class="flow-content">
          <h3>REQUEST PAYWALLED RESOURCE</h3>
          <p>
            Client makes a request to a protected endpoint. The server checks for a valid 
            payment session via the <code>X-Payment-Session</code> header or <code>paid_session</code> 
            query parameter.
          </p>
        </div>
      </div>

      <div class="flow-step">
        <span class="flow-number">02</span>
        <div class="flow-content">
          <h3>402 PAYMENT REQUIRED</h3>
          <p>
            Without valid payment, the server returns a 402 response with payment options.
            The response includes a Stripe checkout URL, session ID, and expiration time.
          </p>
        </div>
      </div>

      <div class="flow-step">
        <span class="flow-number">03</span>
        <div class="flow-content">
          <h3>STRIPE CHECKOUT</h3>
          <p>
            Client redirects to Stripe's hosted checkout page. User completes payment 
            using card, Apple Pay, Google Pay, or other supported methods.
          </p>
        </div>
      </div>

      <div class="flow-step">
        <span class="flow-number">04</span>
        <div class="flow-content">
          <h3>PAYMENT CONFIRMATION</h3>
          <p>
            Stripe redirects to <code>/payment/success</code> with the session ID. 
            Server marks the session as paid (webhook also confirms asynchronously).
          </p>
        </div>
      </div>

      <div class="flow-step">
        <span class="flow-number">05</span>
        <div class="flow-content">
          <h3>ACCESS GRANTED</h3>
          <p>
            Server redirects to the original resource with the paid session token.
            Client receives the protected content (AI-generated meme, premium data, etc.).
          </p>
        </div>
      </div>
    </section>

    <!-- Implementation -->
    <section class="mb-40">
      <h2 class="section-title">// IMPLEMENTATION</h2>
      
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">REQUEST</span>
          <span class="code-file">Initial request (no payment)</span>
        </div>
        <pre class="code-content">curl https://brightbet.tech/api/rickroll?question=Will%20BTC%20hit%20200k</pre>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">402 Payment Required</span>
        </div>
        <pre class="code-content">{
  "error": "Payment required",
  "resource": {
    "url": "https://brightbet.tech/api/rickroll?question=Will%20BTC%20hit%20200k",
    "description": "Free AI meme generator: Will BTC hit 200k",
    "mimeType": "text/html"
  },
  "paymentOptions": {
    "stripe": {
      "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
      "sessionId": "a091a45b-1865-4b92-9a46-bc07ada424f9",
      "expiresAt": "2026-03-01T02:00:00.000Z"
    }
  },
  "message": "Pay \$0.50 via Stripe to generate your free AI meme!"
}</pre>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">REQUEST</span>
          <span class="code-file">After payment (with session)</span>
        </div>
        <pre class="code-content">curl "https://brightbet.tech/api/rickroll?paid_session=a091a45b-1865-4b92-9a46-bc07ada424f9"

# Or with header:
curl -H "X-Payment-Session: a091a45b-1865-4b92-9a46-bc07ada424f9" \\
  https://brightbet.tech/api/rickroll</pre>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">RESPONSE</span>
          <span class="code-file">200 OK (HTML page with AI meme)</span>
        </div>
        <pre class="code-content">&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
  &lt;title&gt;AI MEME // BRIGHTBET&lt;/title&gt;
  ...
&lt;/head&gt;
&lt;body&gt;
  &lt;h1&gt;// AI MEME GENERATED&lt;/h1&gt;
  &lt;img src="data:image/png;base64,..." /&gt;
&lt;/body&gt;
&lt;/html&gt;</pre>
      </div>
    </section>

    <!-- Session Management -->
    <section class="mb-40">
      <h2 class="section-title">// SESSION MANAGEMENT</h2>
      
      <table class="endpoint-table">
        <thead>
          <tr>
            <th>ENDPOINT</th>
            <th>METHOD</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>/payment/success</td>
            <td><span class="method get">GET</span></td>
            <td>Stripe redirect after successful payment. Marks session paid.</td>
          </tr>
          <tr>
            <td>/payment/cancel</td>
            <td><span class="method get">GET</span></td>
            <td>Stripe redirect on payment cancellation.</td>
          </tr>
          <tr>
            <td>/payment/status/:id</td>
            <td><span class="method get">GET</span></td>
            <td>Poll session status (pending/paid/settled).</td>
          </tr>
          <tr>
            <td>/stripe/webhooks</td>
            <td><span class="method post">POST</span></td>
            <td>Stripe webhook for async payment confirmation.</td>
          </tr>
        </tbody>
      </table>

      <h3 class="params-title mt-40">SESSION STATES</h3>
      <div class="arch-diagram">
        <pre>
┌──────────┐     Payment      ┌──────────┐     Resource      ┌──────────┐
│ PENDING  │───completed────▶│   PAID   │────accessed─────▶│ SETTLED  │
└──────────┘                  └──────────┘                   └──────────┘
     │                              │                              │
     │                              │                              │
     ▼                              ▼                              ▼
  Created when              Valid for accessing             Final state,
  checkout URL is           protected resource              resource was
  requested                                                 delivered
        </pre>
      </div>
    </section>

    <!-- Pricing Configuration -->
    <section class="mb-40">
      <h2 class="section-title">// PRICING CONFIGURATION</h2>
      
      <p class="endpoint-desc">
        Protected routes are configured with pricing and payment options in the worker:
      </p>

      <div class="code-block">
        <div class="code-header">
          <span class="code-label">CONFIG</span>
          <span class="code-file">backend-worker/src/routes/x402-payment.ts</span>
        </div>
        <pre class="code-content">// Route configuration (conceptual)
const paymentConfig = {
  "GET /api/rickroll": {
    price: "\$0.50",
    description: "AI Meme Generator",
    mimeType: "text/html",
    enableStripe: true
  },
  "GET /api/premium-data": {
    price: "\$0.10",
    description: "Premium market analysis",
    mimeType: "application/json",
    enableStripe: true
  }
};</pre>
      </div>
    </section>

    <!-- Environment Variables -->
    <section class="mb-40">
      <h2 class="section-title">// ENVIRONMENT VARIABLES</h2>
      
      <table class="params-table">
        <thead>
          <tr>
            <th>VARIABLE</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">STRIPE_SECRET_KEY</span></td>
            <td>Stripe secret key for server-side API calls</td>
          </tr>
          <tr>
            <td><span class="param-name">STRIPE_WEBHOOK_SECRET</span></td>
            <td>Webhook signing secret for verifying Stripe events</td>
          </tr>
          <tr>
            <td><span class="param-name">STRIPE_PUBLISHABLE_KEY</span></td>
            <td>Public key for client-side Stripe.js (if needed)</td>
          </tr>
          <tr>
            <td><span class="param-name">APP_BASE_URL</span></td>
            <td>Base URL for redirect URLs (e.g., https://brightbet.tech)</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Testing -->
    <section class="mb-40">
      <h2 class="section-title">// TESTING</h2>
      
      <div class="code-block">
        <div class="code-header">
          <span class="code-label">TEST CARDS</span>
          <span class="code-file">Stripe Test Mode</span>
        </div>
        <pre class="code-content"># Successful payment
Card: 4242 4242 4242 4242
Exp:  Any future date
CVC:  Any 3 digits

# Declined payment
Card: 4000 0000 0000 0002

# Requires authentication
Card: 4000 0025 0000 3155</pre>
      </div>
    </section>

  </main>

  <footer class="footer">
    <div class="footer-content">
      <pre class="footer-ascii">
  *    .  *       .             *
                       *
   *   .        *          .        .   *
      </pre>
      <p class="footer-text">BRIGHTBET // HACKILLINOIS 2026</p>
      <p class="footer-links">
        <a href="https://github.com/EricSpencer00/HackIllinois26">GITHUB</a>
        <span class="separator">|</span>
        <a href="https://brightbet.tech">LIVE DEMO</a>
      </p>
    </div>
  </footer>
  <script>
    (function () {
      const LABEL = 'COPY';
      const blocks = document.querySelectorAll('.code-block');
      if (!blocks.length) return;

      function copyText(text) {
        const trimmed = text.replace(/\\u00A0/g, ' ').trim();
        if (navigator.clipboard?.writeText) {
          return navigator.clipboard.writeText(trimmed);
        }
        return new Promise((resolve, reject) => {
          const textarea = document.createElement('textarea');
          textarea.value = trimmed;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textarea);
          success ? resolve() : reject(new Error('execCommand failed'));
        });
      }

      blocks.forEach((block) => {
        const pre = block.querySelector('.code-content');
        if (!pre) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-btn';
        button.textContent = LABEL;
        block.appendChild(button);
        button.addEventListener('click', () => {
          copyText(pre.innerText || pre.textContent || '')
            .then(() => {
              button.textContent = 'COPIED';
              button.classList.add('copied');
              setTimeout(() => {
                button.textContent = LABEL;
                button.classList.remove('copied');
              }, 1500);
            })
            .catch((err) => {
              console.error('Copy failed', err);
              button.textContent = 'FAILED';
              button.classList.remove('copied');
              setTimeout(() => {
                button.textContent = LABEL;
              }, 1500);
            });
        });
      });
    })();
  </script>
</body>
</html>
`;

export const stylesCss = `/* ═══════════════════════════════════════════════════════════
   BRIGHTBET API DOCS — Brutalist ASCII Design
   ═══════════════════════════════════════════════════════════ */

:root {
  --white: #ffffff;
  --gray-100: #e5e5e5;
  --gray-300: #aaaaaa;
  --gray-500: #666666;
  --gray-700: #333333;
  --gray-800: #1a1a1a;
  --gray-900: #111111;
  --black: #000000;
  --font-mono: 'Space Mono', 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
}

/* ─── Reset ─── */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-mono);
  background: var(--black);
  color: var(--white);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  line-height: 1.6;
}

::selection {
  background: var(--white);
  color: var(--black);
}

a {
  color: inherit;
  text-decoration: none;
}

/* ─── ASCII Background ─── */
.ascii-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0.03;
  overflow: hidden;
  pointer-events: none;
}

.ascii-bg::before {
  content: "·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.·.";
  display: block;
  white-space: nowrap;
  font-size: 12px;
  animation: scroll 20s linear infinite;
}

@keyframes scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* ─── Header ─── */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 40px;
  background: var(--black);
  border-bottom: 1px solid var(--gray-700);
}

.logo {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-shadow: 0 0 12px rgba(255,255,255,0.5);
}

.nav {
  display: flex;
  gap: 32px;
}

.nav-link {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--gray-300);
  padding-bottom: 4px;
  border-bottom: 1px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
  color: var(--white);
  border-bottom-color: var(--white);
}

/* ─── Main Content ─── */
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 40px;
}

/* ─── Hero Section ─── */
.hero {
  text-align: center;
  margin-bottom: 80px;
}

.hero-ascii {
  font-size: 8px;
  line-height: 1; /* Tighter line height for ASCII */
  color: var(--gray-500);
  margin-bottom: 32px;
  overflow: hidden;
  height: 220px; /* Fixed height to prevent downward shift */
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: pre;
  position: relative;
}

/* typing caret and blink animation removed */

@media (max-width: 768px) {
  .hero-ascii {
    font-size: 5px;
  }
}

.hero-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2em;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 13px;
  color: var(--gray-300);
  letter-spacing: 0.05em;
}

/* ─── Grid Layout ─── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 80px;
}

/* ─── Cards ─── */
.card {
  border: 1px solid var(--gray-700);
  padding: 32px;
  position: relative;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--gray-500);
}

.card-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 16px;
}

.card-icon {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-700);
}

.card-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.card-desc {
  font-size: 12px;
  color: var(--gray-300);
  line-height: 1.8;
  margin-bottom: 16px;
}

.card-code {
  display: block;
  font-size: 11px;
  color: var(--gray-500);
  margin-bottom: 24px;
  padding: 8px 12px;
  background: var(--gray-900);
  border-left: 2px solid var(--gray-700);
}

.card-link {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--gray-300);
  border-bottom: 1px solid var(--gray-700);
  padding-bottom: 4px;
  transition: all 0.2s;
}

.card-link:hover {
  color: var(--white);
  border-bottom-color: var(--white);
}

/* ─── Sections ─── */
.section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.15em;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--gray-700);
}

/* ─── Code Blocks ─── */
.code-block {
  margin-bottom: 24px;
  border: 1px solid var(--gray-700);
  position: relative;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--gray-900);
  border-bottom: 1px solid var(--gray-700);
}

.code-label {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--gray-500);
}

.code-file {
  font-size: 10px;
  color: var(--gray-500);
}

.code-content {
  padding: 20px;
  font-size: 12px;
  line-height: 1.8;
  overflow-x: auto;
  background: var(--black);
  color: var(--gray-300);
}

.copy-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  border: 1px solid var(--gray-600);
  background: rgba(0, 0, 0, 0.6);
  color: var(--gray-100);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.2s ease, color 0.2s ease;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.copy-btn.copied {
  background: var(--white);
  color: var(--black);
  border-color: var(--white);
}

/* ─── Tables ─── */
.endpoint-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.endpoint-table th,
.endpoint-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid var(--gray-700);
}

.endpoint-table th {
  font-size: 10px;
  letter-spacing: 0.15em;
  color: var(--gray-500);
  font-weight: 400;
}

.endpoint-table td {
  color: var(--gray-300);
}

.endpoint-table tr:hover td {
  background: var(--gray-900);
}

.method {
  display: inline-block;
  padding: 4px 8px;
  font-size: 10px;
  letter-spacing: 0.1em;
  border: 1px solid;
}

.method.get {
  color: #4ade80;
  border-color: #4ade80;
}

.method.post {
  color: #60a5fa;
  border-color: #60a5fa;
}

.method.delete {
  color: #f87171;
  border-color: #f87171;
}

/* ─── Quick Start ─── */
.quick-start {
  margin-bottom: 80px;
}

/* ─── Footer ─── */
.footer {
  border-top: 1px solid var(--gray-700);
  padding: 60px 40px;
  text-align: center;
}

.footer-ascii {
  font-size: 8px;
  line-height: 1.2;
  color: var(--gray-700);
  margin-bottom: 24px;
}

.footer-text {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--gray-500);
  margin-bottom: 16px;
}

.footer-links {
  font-size: 11px;
  color: var(--gray-500);
}

.footer-links a {
  color: var(--gray-300);
  letter-spacing: 0.1em;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: var(--white);
}

.separator {
  margin: 0 16px;
  color: var(--gray-700);
}

/* ─── API Reference Page ─── */
.endpoint-section {
  margin-bottom: 60px;
  padding-bottom: 60px;
  border-bottom: 1px solid var(--gray-700);
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.endpoint-method {
  padding: 8px 16px;
  font-size: 11px;
  letter-spacing: 0.1em;
  border: 1px solid;
}

.endpoint-path {
  font-size: 14px;
  color: var(--gray-300);
}

.endpoint-desc {
  font-size: 13px;
  color: var(--gray-300);
  line-height: 1.8;
  margin-bottom: 24px;
  max-width: 700px;
}

.params-title {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--gray-500);
  margin-bottom: 16px;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-bottom: 24px;
}

.params-table th,
.params-table td {
  padding: 12px 16px;
  text-align: left;
  border: 1px solid var(--gray-700);
}

.params-table th {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--gray-500);
  background: var(--gray-900);
}

.param-name {
  color: var(--white);
}

.param-type {
  color: var(--gray-500);
  font-size: 10px;
}

.param-required {
  color: #f87171;
  font-size: 9px;
  margin-left: 8px;
}

/* ─── Architecture Page ─── */
.arch-diagram {
  padding: 32px;
  border: 1px solid var(--gray-700);
  margin-bottom: 40px;
  overflow-x: auto;
}

.arch-diagram pre {
  font-size: 10px;
  line-height: 1.4;
  color: var(--gray-300);
  white-space: pre;
}

.tech-stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.tech-item {
  padding: 20px;
  border: 1px solid var(--gray-700);
}

.tech-name {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.tech-desc {
  font-size: 11px;
  color: var(--gray-500);
}

/* ─── X402 Page ─── */
.flow-step {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
  border: 1px solid var(--gray-700);
}

.flow-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-700);
  flex-shrink: 0;
}

.flow-content h3 {
  font-size: 12px;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.flow-content p {
  font-size: 12px;
  color: var(--gray-300);
  line-height: 1.8;
}

.tech-stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 40px 0;
}

.tech-card {
  border: 1px solid var(--gray-700);
  padding: 24px;
  transition: border-color 0.2s;
}

.tech-card:hover {
  border-color: var(--white);
}

.tech-card h3 {
  font-size: 14px;
  letter-spacing: 0.2em;
  margin-bottom: 20px;
  color: var(--gray-100);
}

.tech-card ul {
  list-style: none;
  font-size: 12px;
  color: var(--gray-500);
}

.tech-card li {
  margin-bottom: 8px;
  padding-left: 14px;
  position: relative;
}

.tech-card li::before {
  content: "»";
  position: absolute;
  left: 0;
  color: var(--gray-700);
}

.data-sources {
  margin: 80px 0;
  padding: 40px;
  background: var(--gray-900);
  border: 1px dashed var(--gray-700);
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 30px;
}

.source-grid span {
  font-size: 11px;
  background: var(--black);
  padding: 8px 12px;
  border: 1px solid var(--gray-800);
  color: var(--gray-300);
}

.endpoints-overview {
  margin-top: 80px;
}

/* ─── Utilities ─── */
.mt-40 { margin-top: 40px; }
.mb-40 { margin-bottom: 40px; }
.text-muted { color: var(--gray-500); }

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
  
  .nav {
    gap: 16px;
  }
  
  .main {
    padding: 40px 20px;
  }
  
  .endpoint-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

