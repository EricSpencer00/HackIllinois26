/**
 * /generate-image ENDPOINT (POST)
 * Uses Cloudflare Workers AI (free, built-in) to generate planet visualizations.
 * Returns a base64 image that the frontend animates with CSS effects.
 */

import type { Env } from '../index';

export async function handleGenerateImage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const isMeme = url.searchParams.get('type') === 'meme';

  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'POST or GET required' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { question?: string; sentiment?: string; confidence?: number };
  if (request.method === 'POST') {
    try {
      body = (await request.json()) as any;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // GET request - read from query parameters
    body = {
      question: url.searchParams.get('question') || undefined,
      sentiment: url.searchParams.get('sentiment') || undefined,
      confidence: Number(url.searchParams.get('confidence')) || undefined,
    };
  }

  if (!body.question) {
    return new Response(JSON.stringify({ error: 'Missing question' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sentiment = body.sentiment || 'neutral';
  const confidence = body.confidence ?? 50;

  let prompt = '';
  if (isMeme) {
    // Premium Meme Generation
    prompt = generateMemePrompt(body.question);
  } else {
    // Standard Planet Visualization
    const moodMap: Record<string, string> = {
      bullish: 'vibrant green aurora, glowing emerald energy, rising golden particles, hopeful cosmic atmosphere, green and gold color palette',
      bearish: 'deep crimson nebula, swirling red energy, descending dark particles, dramatic stormy cosmos, red and orange color palette',
      neutral: 'calm blue-violet nebula, balanced energy, drifting silver stardust, serene cosmic atmosphere, purple and blue color palette',
    };
    const mood = moodMap[sentiment] || moodMap.neutral;
    prompt = `A glowing planet floating in deep space surrounded by colorful nebula clouds and orbiting light particles, ${mood}, cinematic lighting, futuristic sci-fi, dark starry background, 4K, photorealistic digital art`;
  }

  try {
    // Use Cloudflare Workers AI — free, no API key needed
    const aiResult = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt,
      num_steps: 20,
    });

    // aiResult is a ReadableStream of PNG bytes
    const arrayBuffer = await new Response(aiResult).arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:image/png;base64,${base64}`;

    return new Response(
      JSON.stringify({
        type: isMeme ? 'meme' : 'image',
        imageData: dataUrl,
        prompt,
        sentiment,
        confidence,
        question: body.question
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    // If AI fails, return a signal for the frontend to use CSS-only fallback
    return new Response(
      JSON.stringify({
        type: isMeme ? 'error' : 'fallback',
        error: err.message || 'AI generation failed',
        sentiment,
        confidence,
        question: body.question
      }),
      { status: isMeme ? 500 : 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Generate a humorous Stable Diffusion prompt from a user's question
 * to create a funny, meme-like image
 */
function generateMemePrompt(question: string): string {
  // Sanitize and shorten the question
  const cleanQuestion = question.substring(0, 150).trim();

  // Meme style prompts that work well with Stable Diffusion
  const memeStyles = [
    'doge meme format with impact text, comic sans font, comedy, absurdist humor',
    'Drake meme format, Drake disapproval, funny reaction faces',
    'surprised Pikachu face reaction, shocked expression, funny meme',
    'distracted boyfriend meme, pointing, hilarious reaction comic',
  ];

  const randomMeme = memeStyles[Math.floor(Math.random() * memeStyles.length)];

  // Create a structured prompt that describes the meme content based on the question
  return `A hilarious internet meme about "${cleanQuestion}". ${randomMeme}. digital art, meme culture, irony, high quality, 4K, expressive facial expressions`;
}
