import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleCheckFreshness } from '../../src/tools/check-freshness.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-check-freshness.db';

describe('check_data_freshness tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns fresh status for recently ingested data', () => {
    const result = handleCheckFreshness(db);
    expect(result.status).toBe('fresh');
    expect(result.days_since_ingest).toBe(0);
  });

  test('includes schema_version', () => {
    const result = handleCheckFreshness(db);
    expect(result.schema_version).toBe('1.0');
  });

  test('includes refresh_command', () => {
    const result = handleCheckFreshness(db);
    expect(result.refresh_command).toContain('ingest.yml');
  });

  test('includes staleness_threshold_days', () => {
    const result = handleCheckFreshness(db);
    expect(result.staleness_threshold_days).toBe(90);
  });

  test('includes _meta with disclaimer', () => {
    const result = handleCheckFreshness(db);
    expect(result._meta).toHaveProperty('disclaimer');
    expect(result._meta.disclaimer).toContain('BLV');
  });
});
