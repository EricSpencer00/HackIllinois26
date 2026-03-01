/**
 * Tests for src/routes/health.ts
 */

import { describe, it, expect } from 'vitest';
import { handleHealth } from '../../src/routes/health';
import { jsonBody } from '../helpers';

describe('handleHealth', () => {
  it('returns 200 with healthy status', async () => {
    const res = await handleHealth();
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('BrightBet API');
    expect(body.timestamp).toBeDefined();
  });

  it('returns valid ISO timestamp', async () => {
    const res = await handleHealth();
    const body = await jsonBody(res);
    const date = new Date(body.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });

  it('returns JSON content type', async () => {
    const res = await handleHealth();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });
});
