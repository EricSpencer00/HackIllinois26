/**
 * Tests for src/routes/planet-categories.ts
 */

import { describe, it, expect } from 'vitest';
import { handlePlanetCategories } from '../../src/routes/planet-categories';
import { jsonBody } from '../helpers';

describe('handlePlanetCategories', () => {
  it('returns 200 with categories array', async () => {
    const res = await handlePlanetCategories();
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    expect(body.categories).toBeDefined();
    expect(Array.isArray(body.categories)).toBe(true);
    expect(body.categories.length).toBeGreaterThan(0);
  });

  it('each category has required fields', async () => {
    const res = await handlePlanetCategories();
    const { categories } = await jsonBody(res);

    for (const cat of categories) {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('icon');
      expect(cat).toHaveProperty('color');
      expect(cat).toHaveProperty('description');
      expect(cat).toHaveProperty('orbitRadius');
      expect(typeof cat.id).toBe('string');
      expect(typeof cat.name).toBe('string');
      expect(typeof cat.color).toBe('string');
      expect(typeof cat.orbitRadius).toBe('number');
    }
  });

  it('includes expected data sources', async () => {
    const res = await handlePlanetCategories();
    const { categories } = await jsonBody(res);
    const ids = categories.map((c: any) => c.id);
    expect(ids).toContain('ai');
    expect(ids).toContain('finnhub');
    expect(ids).toContain('polymarket');
    expect(ids).toContain('wikipedia');
  });

  it('colors are valid hex codes', async () => {
    const res = await handlePlanetCategories();
    const { categories } = await jsonBody(res);
    for (const cat of categories) {
      expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
