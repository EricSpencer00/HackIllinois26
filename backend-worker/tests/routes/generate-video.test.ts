/**
 * Tests for src/routes/generate-video.ts
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleGenerateVideo } from '../../src/routes/generate-video';
import { createMockEnv, jsonRequest, jsonBody } from '../helpers';

describe('handleGenerateVideo', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects non-POST requests', async () => {
    const req = new Request('https://brightbet.tech/api/generate-video', { method: 'GET' });
    const env = createMockEnv();
    const res = await handleGenerateVideo(req, env);
    expect(res.status).toBe(405);
    const body = await jsonBody(res);
    expect(body.error).toContain('POST required');
  });

  it('rejects invalid JSON body', async () => {
    const req = new Request('https://brightbet.tech/api/generate-video', {
      method: 'POST',
      body: 'not json',
    });
    const env = createMockEnv();
    const res = await handleGenerateVideo(req, env);
    expect(res.status).toBe(400);
  });

  it('rejects missing question', async () => {
    const req = jsonRequest('https://brightbet.tech/api/generate-video', {});
    const env = createMockEnv();
    const res = await handleGenerateVideo(req, env);
    expect(res.status).toBe(400);
    const body = await jsonBody(res);
    expect(body.error).toContain('Missing question');
  });

  it('returns image data on successful AI generation', async () => {
    // Mock AI.run to return some bytes
    const mockAiRun = vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
    const env = createMockEnv({ AI: { run: mockAiRun } });

    const req = jsonRequest('https://brightbet.tech/api/generate-video', {
      question: 'Will Tesla hit $500?',
      sentiment: 'bullish',
      confidence: 80,
    });

    const res = await handleGenerateVideo(req, env);
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    expect(body.type).toBe('image');
    expect(body.imageData).toContain('data:image/png;base64,');
    expect(body.sentiment).toBe('bullish');
    expect(body.confidence).toBe(80);

    // Verify AI was called with correct model
    expect(mockAiRun).toHaveBeenCalledWith(
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      expect.objectContaining({ num_steps: 20 }),
    );
  });

  it('uses correct mood map for bullish sentiment', async () => {
    const mockAiRun = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const env = createMockEnv({ AI: { run: mockAiRun } });

    const req = jsonRequest('https://brightbet.tech/api/generate-video', {
      question: 'Test?',
      sentiment: 'bullish',
    });

    await handleGenerateVideo(req, env);

    const prompt = mockAiRun.mock.calls[0][1].prompt;
    expect(prompt).toContain('green');
    expect(prompt).toContain('golden');
  });

  it('uses correct mood map for bearish sentiment', async () => {
    const mockAiRun = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const env = createMockEnv({ AI: { run: mockAiRun } });

    const req = jsonRequest('https://brightbet.tech/api/generate-video', {
      question: 'Test?',
      sentiment: 'bearish',
    });

    await handleGenerateVideo(req, env);

    const prompt = mockAiRun.mock.calls[0][1].prompt;
    expect(prompt).toContain('crimson');
    expect(prompt).toContain('red');
  });

  it('defaults to neutral mood', async () => {
    const mockAiRun = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const env = createMockEnv({ AI: { run: mockAiRun } });

    const req = jsonRequest('https://brightbet.tech/api/generate-video', {
      question: 'Test?',
    });

    await handleGenerateVideo(req, env);
    const body = await jsonBody(await handleGenerateVideo(
      jsonRequest('https://brightbet.tech/api/generate-video', { question: 'Test?' }),
      env,
    ));
    expect(body.sentiment).toBe('neutral');
  });

  it('returns fallback on AI error', async () => {
    const mockAiRun = vi.fn().mockRejectedValue(new Error('AI model unavailable'));
    const env = createMockEnv({ AI: { run: mockAiRun } });

    const req = jsonRequest('https://brightbet.tech/api/generate-video', {
      question: 'Test?',
      sentiment: 'bullish',
      confidence: 75,
    });

    const res = await handleGenerateVideo(req, env);
    expect(res.status).toBe(200); // Still 200, frontend handles fallback
    const body = await jsonBody(res);
    expect(body.type).toBe('fallback');
    expect(body.error).toBe('AI model unavailable');
    expect(body.sentiment).toBe('bullish');
    expect(body.confidence).toBe(75);
  });

  it('defaults confidence to 50 when not provided', async () => {
    const mockAiRun = vi.fn().mockResolvedValue(new Uint8Array([1]));
    const env = createMockEnv({ AI: { run: mockAiRun } });

    const req = jsonRequest('https://brightbet.tech/api/generate-video', {
      question: 'Test?',
    });

    const res = await handleGenerateVideo(req, env);
    const body = await jsonBody(res);
    expect(body.confidence).toBe(50);
  });
});
