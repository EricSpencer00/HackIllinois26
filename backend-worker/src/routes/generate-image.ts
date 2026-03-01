/**
 * /generate-image ENDPOINT (POST)
 * Uses Cloudflare Workers AI (free, built-in) to generate planet visualizations.
 * Returns a base64 image that the frontend animates with CSS effects.
 */

import type { Env } from '../index';

export async function handleGenerateImage(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { question: string; sentiment?: string; confidence?: number };
  try {
    body = (await request.json()) as any;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.question) {
    return new Response(JSON.stringify({ error: 'Missing question' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sentiment = body.sentiment || 'neutral';
  const confidence = body.confidence ?? 50;

  // Build a cinematic prompt based on sentiment
  const moodMap: Record<string, string> = {
    bullish: 'vibrant green aurora, glowing emerald energy, rising golden particles, hopeful cosmic atmosphere, green and gold color palette',
    bearish: 'deep crimson nebula, swirling red energy, descending dark particles, dramatic stormy cosmos, red and orange color palette',
    neutral: 'calm blue-violet nebula, balanced energy, drifting silver stardust, serene cosmic atmosphere, purple and blue color palette',
  };

  const mood = moodMap[sentiment] || moodMap.neutral;

  const prompt = `A glowing planet floating in deep space surrounded by colorful nebula clouds and orbiting light particles, ${mood}, cinematic lighting, futuristic sci-fi, dark starry background, 4K, photorealistic digital art`;

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
        type: 'image',
        imageData: dataUrl,
        prompt,
        sentiment,
        confidence,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    // If AI fails, return a signal for the frontend to use CSS-only fallback
    return new Response(
      JSON.stringify({
        type: 'fallback',
        error: err.message || 'AI generation failed',
        sentiment,
        confidence,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
