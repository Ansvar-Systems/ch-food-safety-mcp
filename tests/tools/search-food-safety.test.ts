import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleSearchFoodSafety } from '../../src/tools/search-food-safety.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-search-food-safety.db';

describe('search_food_safety tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns results for HACCP query', () => {
    const result = handleSearchFoodSafety(db, { query: 'HACCP' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('returns results for Temperatur query', () => {
    const result = handleSearchFoodSafety(db, { query: 'Temperatur Frischfleisch' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('filters by topic', () => {
    const result = handleSearchFoodSafety(db, { query: 'HACCP Gastronomiebetrieb', topic: 'selbstkontrolle' });
    if ('results' in result) {
      for (const r of (result as { results: { topic: string }[] }).results) {
        expect(r.topic).toBe('selbstkontrolle');
      }
    }
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleSearchFoodSafety(db, { query: 'HACCP', jurisdiction: 'DE' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });

  test('includes _meta with disclaimer', () => {
    const result = handleSearchFoodSafety(db, { query: 'Gruyere' });
    expect(result).toHaveProperty('_meta');
    if ('_meta' in result) {
      expect((result as { _meta: { disclaimer: string } })._meta.disclaimer).toContain('BLV');
    }
  });
});
