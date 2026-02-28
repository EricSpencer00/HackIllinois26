var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-XZlpr1/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-XZlpr1/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/routes/health.ts
async function handleHealth() {
  return new Response(
    JSON.stringify({
      status: "healthy",
      service: "BrightBet API",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
__name(handleHealth, "handleHealth");

// src/services/pythonClient.ts
async function callGroqAI(question, context, env) {
  const systemPrompt = `You are an expert quantitative analyst working for a prediction market platform called BrightBet.
Analyze the user's trade/bet question using the provided context from multiple data sources.
You MUST respond with ONLY a valid JSON object in this exact format:
{"confidence_score": 75, "sentiment": "bullish", "reasoning": "Keep it under 3 sentences."}
confidence_score should be 0-100 representing how likely the event is to happen.
sentiment should be "bullish", "bearish", or "neutral".
Do not include any markdown formatting.`;
  const userPrompt = `Question: ${question}

Context from data sources:
${context}`;
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 300
    })
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Groq API error: ${resp.status} ${errText}`);
  }
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  try {
    return JSON.parse(text);
  } catch {
    return { confidence_score: 50, sentiment: "neutral", reasoning: text.slice(0, 200) };
  }
}
__name(callGroqAI, "callGroqAI");
async function fetchWikipedia(query) {
  const headers = { "User-Agent": "BrightBet/1.0 (hackathon project; contact@brightbet.tech)", "Accept": "application/json" };
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json`;
    const searchResp = await fetch(searchUrl, { headers });
    const searchData = await searchResp.json();
    const results = searchData?.query?.search || [];
    const summaries = [];
    for (const r of results.slice(0, 3)) {
      const title = r.title;
      const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=true&explaintext=true&format=json`;
      const summaryResp = await fetch(summaryUrl, { headers });
      const summaryData = await summaryResp.json();
      const pages = summaryData?.query?.pages || {};
      for (const page of Object.values(pages)) {
        const extract = page.extract || "";
        summaries.push({
          title,
          summary: extract.length > 1e3 ? extract.slice(0, 1e3) + "..." : extract
        });
      }
    }
    return summaries;
  } catch (e) {
    return [{ title: "Error", summary: `Wikipedia fetch failed: ${e.message}` }];
  }
}
__name(fetchWikipedia, "fetchWikipedia");
async function fetchFinnhubQuote(symbol, env) {
  try {
    const resp = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${env.FINNHUB_API_KEY}`
    );
    const data = await resp.json();
    return {
      symbol: symbol.toUpperCase(),
      price: data.c ?? null,
      change: data.d ?? null,
      changePercent: data.dp ?? null,
      high: data.h ?? null,
      low: data.l ?? null
    };
  } catch {
    return { symbol: symbol.toUpperCase(), price: null, change: null, changePercent: null, high: null, low: null };
  }
}
__name(fetchFinnhubQuote, "fetchFinnhubQuote");
async function fetchFinnhubNews(symbol, env) {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const past = new Date(Date.now() - 7 * 864e5).toISOString().split("T")[0];
    const resp = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${past}&to=${today}&token=${env.FINNHUB_API_KEY}`
    );
    const data = await resp.json();
    return (data || []).slice(0, 5).map((a) => ({
      headline: a.headline || "",
      summary: (a.summary || "").slice(0, 300),
      source: a.source || "",
      url: a.url || ""
    }));
  } catch {
    return [];
  }
}
__name(fetchFinnhubNews, "fetchFinnhubNews");
async function fetchPolymarketData(query) {
  try {
    const resp = await fetch(`https://gamma-api.polymarket.com/markets?closed=false&limit=10`);
    const markets = await resp.json();
    const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    let relevant = markets.filter((m) => {
      const text = ((m.question || m.title || "") + " " + (m.description || "")).toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
    if (relevant.length === 0)
      relevant = markets.slice(0, 3);
    return relevant.slice(0, 5).map((m) => {
      const prices = m.outcomePrices;
      let yes_price = null;
      let no_price = null;
      if (Array.isArray(prices) && prices.length >= 2) {
        yes_price = prices[0];
        no_price = prices[1];
      }
      return {
        question: m.question || m.title || "Unknown",
        yes_price,
        no_price,
        volume: m.volume || null
      };
    });
  } catch {
    return [];
  }
}
__name(fetchPolymarketData, "fetchPolymarketData");
function extractTicker(question) {
  const tickerMatch = question.match(/\$([A-Z]{1,5})/i);
  if (tickerMatch)
    return tickerMatch[1].toUpperCase();
  const mappings = {
    tesla: "TSLA",
    apple: "AAPL",
    google: "GOOGL",
    alphabet: "GOOGL",
    amazon: "AMZN",
    microsoft: "MSFT",
    nvidia: "NVDA",
    meta: "META",
    spacex: "TSLA",
    elon: "TSLA",
    musk: "TSLA",
    bitcoin: "COIN",
    crypto: "COIN"
  };
  const lower = question.toLowerCase();
  for (const [kw, ticker] of Object.entries(mappings)) {
    if (lower.includes(kw))
      return ticker;
  }
  return null;
}
__name(extractTicker, "extractTicker");

// src/routes/get-ai-opinion.ts
async function handleGetAiOpinion(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!body.question) {
    return new Response(JSON.stringify({ error: 'Missing "question" field' }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const question = body.question;
  const symbol = body.symbol || extractTicker(question);
  const [wikiResults, polyResults, finnQuote, finnNews] = await Promise.all([
    fetchWikipedia(question),
    fetchPolymarketData(question),
    symbol ? fetchFinnhubQuote(symbol, env) : Promise.resolve(null),
    symbol ? fetchFinnhubNews(symbol, env) : Promise.resolve([])
  ]);
  const contextParts = [];
  if (body.context)
    contextParts.push(body.context);
  if (wikiResults.length > 0) {
    contextParts.push(
      "Wikipedia Context:\n" + wikiResults.map((w) => `${w.title}: ${w.summary}`).join("\n")
    );
  }
  if (polyResults.length > 0) {
    contextParts.push(
      "Polymarket Predictions:\n" + polyResults.map((p) => `${p.question} \u2014 YES: ${p.yes_price || "?"}, NO: ${p.no_price || "?"}`).join("\n")
    );
  }
  if (finnQuote) {
    contextParts.push(
      `Finnhub Stock Data for ${finnQuote.symbol}: Price $${finnQuote.price}, Change ${finnQuote.changePercent}%`
    );
  }
  if (finnNews && finnNews.length > 0) {
    contextParts.push(
      "Recent News:\n" + finnNews.map((n) => `- ${n.headline}`).join("\n")
    );
  }
  const fullContext = contextParts.join("\n\n");
  const aiResult = await callGroqAI(question, fullContext, env);
  const result = {
    ...aiResult,
    question,
    symbol,
    sources: {
      wikipedia: wikiResults,
      polymarket: polyResults,
      finnhub: finnQuote ? { quote: finnQuote, news: finnNews } : null
    }
  };
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleGetAiOpinion, "handleGetAiOpinion");

// src/routes/visualize.ts
async function handleVisualize(request, env) {
  let question;
  if (request.method === "POST") {
    try {
      const body = await request.json();
      question = body.question;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } else {
    const url = new URL(request.url);
    question = url.searchParams.get("question") || "";
  }
  if (!question) {
    return new Response(JSON.stringify({ error: 'Missing "question" parameter' }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const symbol = extractTicker(question);
  const [wikiResults, polyResults, finnQuote, finnNews] = await Promise.all([
    fetchWikipedia(question),
    fetchPolymarketData(question),
    symbol ? fetchFinnhubQuote(symbol, env) : Promise.resolve(null),
    symbol ? fetchFinnhubNews(symbol, env) : Promise.resolve([])
  ]);
  const visualization = {
    question,
    symbol,
    planets: [
      {
        id: "finnhub",
        name: "Market Data",
        color: "#22c55e",
        icon: "\u{1F4C8}",
        orbitRadius: 1,
        data: finnQuote ? {
          quote: finnQuote,
          news: finnNews,
          available: true
        } : { available: false, reason: "No stock symbol detected" }
      },
      {
        id: "polymarket",
        name: "Prediction Markets",
        color: "#3b82f6",
        icon: "\u{1F3AF}",
        orbitRadius: 2,
        data: {
          markets: polyResults,
          available: polyResults.length > 0
        }
      },
      {
        id: "wikipedia",
        name: "Knowledge Base",
        color: "#f59e0b",
        icon: "\u{1F4DA}",
        orbitRadius: 3,
        data: {
          articles: wikiResults,
          available: wikiResults.length > 0
        }
      }
    ]
  };
  return new Response(JSON.stringify(visualization), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleVisualize, "handleVisualize");

// src/routes/planet-categories.ts
async function handlePlanetCategories() {
  const categories = [
    {
      id: "ai",
      name: "AI Analysis",
      icon: "\u{1F9E0}",
      color: "#a855f7",
      description: "Groq LLM-powered analysis with confidence scoring",
      orbitRadius: 0
    },
    {
      id: "finnhub",
      name: "Market Data",
      icon: "\u{1F4C8}",
      color: "#22c55e",
      description: "Real-time stock quotes and financial news from Finnhub",
      orbitRadius: 1
    },
    {
      id: "polymarket",
      name: "Prediction Markets",
      icon: "\u{1F3AF}",
      color: "#3b82f6",
      description: "Live prediction market odds from Polymarket",
      orbitRadius: 2
    },
    {
      id: "wikipedia",
      name: "Knowledge Base",
      icon: "\u{1F4DA}",
      color: "#f59e0b",
      description: "Background context and historical data from Wikipedia",
      orbitRadius: 3
    }
  ];
  return new Response(JSON.stringify({ categories }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(handlePlanetCategories, "handlePlanetCategories");

// src/index.ts
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
__name(corsHeaders, "corsHeaders");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    let response;
    try {
      if (path === "/api/health" || path === "/health") {
        response = await handleHealth();
      } else if (path === "/api/get-ai-opinion") {
        response = await handleGetAiOpinion(request, env);
      } else if (path === "/api/visualize") {
        response = await handleVisualize(request, env);
      } else if (path === "/api/planet-categories") {
        response = await handlePlanetCategories();
      } else {
        response = new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (err) {
      response = new Response(JSON.stringify({ error: err.message || "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders())) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-XZlpr1/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-XZlpr1/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
