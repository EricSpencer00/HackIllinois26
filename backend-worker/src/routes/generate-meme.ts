/**
 * /generate-meme ENDPOINT (POST or GET)
 * Uses Cloudflare Workers AI (Stable Diffusion) to generate a funny meme image
 * based on the user's question/query.
 * This is a free AI generation available after paying the $0.50 charge.
 */

import type { Env } from '../index';

export async function handleGenerateMeme(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'POST or GET required' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let question: string | null = null;

  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as any;
      question = body.question;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // GET request - read from query parameter
    const url = new URL(request.url);
    question = url.searchParams.get('question');
  }

  if (!question || question.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Missing question parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Craft a hilarious meme prompt based on the question
  const memePrompt = generateMemePrompt(question);

  try {
    // Use Cloudflare Workers AI — Stable Diffusion (free)
    const aiResult = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt: memePrompt,
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
        type: 'meme',
        imageData: dataUrl,
        question,
        prompt: memePrompt,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        type: 'error',
        error: err.message || 'AI meme generation failed',
        question,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
    'loss meme style 4 panel comic, dark humor, funny',
    'Drake meme format, pointing up and down, Drake disapproval, funny reaction faces',
    'expanding brain meme format, 4 levels, absurd joke, funny',
    'surprised Pikachu face reaction, shocked expression, funny meme',
    'wojak/doomer meme style, cartoon character reaction, dark humor',
    'stonks meme style, funny investment advice, chart with arrow, humor, caption text',
    'NPC meme format, blank stare, funny dialogue bubble, comedy',
    'galaxy brain meme, enlightened cosmic joke format, absurd humor',
    'pointing gandalf meme, concerned expression, pointing at something silly, funny',
  ];

  // Pick a random meme style
  const style = memeStyles[Math.floor(Math.random() * memeStyles.length)];

  // Create a prompt that combines the question with meme elements
  const prompt = `A hilarious internet meme image about "${cleanQuestion}". ${style}. Comic style illustration. Bold colored text. Funny, relatable, witty jokes. Meme generator quality. Impact font. Comedic visual gag. Absurdist humor. Cartoon style art. Social media trending meme format. High contrast colors. Exaggerated expressions. 4K resolution`;

  return prompt;
}
