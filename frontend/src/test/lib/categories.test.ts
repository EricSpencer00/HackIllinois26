import { describe, it, expect } from 'vitest';
import { CATEGORIES, SUBCATEGORIES } from '../../lib/categories';
import type { Category } from '../../lib/categories';

describe('categories', () => {
  describe('CATEGORIES', () => {
    it('exports an array of 13 categories', () => {
      expect(CATEGORIES).toHaveLength(13);
    });

    it('each category has required fields', () => {
      for (const cat of CATEGORIES) {
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('geometry');
        expect(cat).toHaveProperty('label');
        expect(typeof cat.name).toBe('string');
        expect(typeof cat.geometry).toBe('string');
        expect(typeof cat.label).toBe('string');
      }
    });

    it('labels are 3 characters long', () => {
      for (const cat of CATEGORIES) {
        expect(cat.label).toHaveLength(3);
      }
    });

    it('has unique names', () => {
      const names = CATEGORIES.map((c: Category) => c.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('has unique labels', () => {
      const labels = CATEGORIES.map((c: Category) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('last category is "Other"', () => {
      expect(CATEGORIES[CATEGORIES.length - 1].name).toBe('Other');
    });

    it('includes expected core categories', () => {
      const names = CATEGORIES.map((c: Category) => c.name);
      expect(names).toContain('Politics');
      expect(names).toContain('Sports');
      expect(names).toContain('Crypto');
      expect(names).toContain('Finance');
      expect(names).toContain('Tech');
    });
  });

  describe('SUBCATEGORIES', () => {
    it('exports an array of 9 subcategories', () => {
      expect(SUBCATEGORIES).toHaveLength(9);
    });

    it('each subcategory has required fields', () => {
      for (const sub of SUBCATEGORIES) {
        expect(sub).toHaveProperty('key');
        expect(sub).toHaveProperty('label');
        expect(sub).toHaveProperty('geometry');
      }
    });

    it('has unique keys', () => {
      const keys = SUBCATEGORIES.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('includes confidence subcategory', () => {
      const keys = SUBCATEGORIES.map((s) => s.key);
      expect(keys).toContain('confidence');
    });

    it('includes data source subcategories', () => {
      const keys = SUBCATEGORIES.map((s) => s.key);
      expect(keys).toContain('finnhub');
      expect(keys).toContain('coingecko');
      expect(keys).toContain('polymarket');
      expect(keys).toContain('reddit');
      expect(keys).toContain('googleTrends');
      expect(keys).toContain('fred');
      expect(keys).toContain('technicals');
      expect(keys).toContain('fearGreed');
    });
  });
});
