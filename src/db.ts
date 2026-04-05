import BetterSqlite3 from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface Database {
  get<T>(sql: string, params?: unknown[]): T | undefined;
  all<T>(sql: string, params?: unknown[]): T[];
  run(sql: string, params?: unknown[]): void;
  close(): void;
  readonly instance: BetterSqlite3.Database;
}

export function createDatabase(dbPath?: string): Database {
  const resolvedPath =
    dbPath ??
    join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'database.db');
  const db = new BetterSqlite3(resolvedPath);

  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  return {
    get<T>(sql: string, params: unknown[] = []): T | undefined {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    all<T>(sql: string, params: unknown[] = []): T[] {
      return db.prepare(sql).all(...params) as T[];
    },
    run(sql: string, params: unknown[] = []): void {
      db.prepare(sql).run(...params);
    },
    close(): void {
      db.close();
    },
    get instance() {
      return db;
    },
  };
}

function initSchema(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS self_monitoring_requirements (
      id INTEGER PRIMARY KEY,
      business_type TEXT NOT NULL,
      requirement TEXT NOT NULL,
      haccp_level TEXT NOT NULL,
      documentation TEXT,
      legal_basis TEXT,
      language TEXT DEFAULT 'DE',
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE TABLE IF NOT EXISTS registration_requirements (
      id INTEGER PRIMARY KEY,
      business_type TEXT NOT NULL,
      activity TEXT NOT NULL,
      authority TEXT NOT NULL,
      requirement TEXT NOT NULL,
      language TEXT DEFAULT 'DE',
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE TABLE IF NOT EXISTS labelling_rules (
      id INTEGER PRIMARY KEY,
      product_type TEXT NOT NULL,
      mandatory_info TEXT NOT NULL,
      allergen_rules TEXT,
      swissness_rule TEXT,
      language TEXT DEFAULT 'DE',
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE TABLE IF NOT EXISTS temperature_requirements (
      id INTEGER PRIMARY KEY,
      food_category TEXT NOT NULL,
      max_temp_c REAL NOT NULL,
      transport_temp_c REAL,
      notes TEXT,
      language TEXT DEFAULT 'DE',
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE TABLE IF NOT EXISTS direct_sales_rules (
      id INTEGER PRIMARY KEY,
      product_type TEXT NOT NULL,
      rule TEXT NOT NULL,
      exemptions TEXT,
      conditions TEXT,
      language TEXT DEFAULT 'DE',
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE TABLE IF NOT EXISTS origin_protection (
      id INTEGER PRIMARY KEY,
      product_name TEXT NOT NULL,
      protection_type TEXT NOT NULL,
      region TEXT,
      description TEXT,
      language TEXT DEFAULT 'DE',
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      title, body, topic, jurisdiction
    );

    CREATE TABLE IF NOT EXISTS db_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('schema_version', '1.0');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('mcp_name', 'Switzerland Food Safety MCP');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('jurisdiction', 'CH');
  `);
}

const FTS_COLUMNS = ['title', 'body', 'topic', 'jurisdiction'];

export function ftsSearch(
  db: Database,
  query: string,
  limit: number = 20
): { title: string; body: string; topic: string; jurisdiction: string; rank: number }[] {
  const { results } = tieredFtsSearch(db, 'search_index', FTS_COLUMNS, query, limit);
  return results as { title: string; body: string; topic: string; jurisdiction: string; rank: number }[];
}

/**
 * Tiered FTS5 search with automatic fallback.
 * Tiers: exact phrase -> AND -> prefix -> stemmed prefix -> OR -> LIKE
 */
export function tieredFtsSearch(
  db: Database,
  table: string,
  columns: string[],
  query: string,
  limit: number = 20
): { tier: string; results: Record<string, unknown>[] } {
  const sanitized = sanitizeFtsInput(query);
  if (!sanitized.trim()) return { tier: 'empty', results: [] };

  const columnList = columns.join(', ');
  const select = `SELECT ${columnList}, rank FROM ${table}`;
  const order = `ORDER BY rank LIMIT ?`;

  // Tier 1: Exact phrase
  const phrase = `"${sanitized}"`;
  let results = tryFts(db, select, table, order, phrase, limit);
  if (results.length > 0) return { tier: 'phrase', results };

  // Tier 2: AND
  const words = sanitized.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    const andQuery = words.join(' AND ');
    results = tryFts(db, select, table, order, andQuery, limit);
    if (results.length > 0) return { tier: 'and', results };
  }

  // Tier 3: Prefix
  const prefixQuery = words.map(w => `${w}*`).join(' AND ');
  results = tryFts(db, select, table, order, prefixQuery, limit);
  if (results.length > 0) return { tier: 'prefix', results };

  // Tier 4: Stemmed prefix
  const stemmed = words.map(w => stemWord(w) + '*');
  const stemmedQuery = stemmed.join(' AND ');
  if (stemmedQuery !== prefixQuery) {
    results = tryFts(db, select, table, order, stemmedQuery, limit);
    if (results.length > 0) return { tier: 'stemmed', results };
  }

  // Tier 5: OR
  if (words.length > 1) {
    const orQuery = words.join(' OR ');
    results = tryFts(db, select, table, order, orQuery, limit);
    if (results.length > 0) return { tier: 'or', results };
  }

  // Tier 6: LIKE fallback across all domain tables
  const likeTables = [
    { table: 'self_monitoring_requirements', cols: ['business_type', 'requirement'], titleCol: 'business_type', bodyCol: 'requirement', topic: 'selbstkontrolle' },
    { table: 'registration_requirements', cols: ['business_type', 'requirement'], titleCol: 'business_type', bodyCol: 'requirement', topic: 'registrierung' },
    { table: 'labelling_rules', cols: ['product_type', 'mandatory_info'], titleCol: 'product_type', bodyCol: 'mandatory_info', topic: 'etikettierung' },
    { table: 'temperature_requirements', cols: ['food_category', 'notes'], titleCol: 'food_category', bodyCol: 'notes', topic: 'temperatur' },
    { table: 'direct_sales_rules', cols: ['product_type', 'rule'], titleCol: 'product_type', bodyCol: 'rule', topic: 'direktvermarktung' },
    { table: 'origin_protection', cols: ['product_name', 'description'], titleCol: 'product_name', bodyCol: 'description', topic: 'ursprungsschutz' },
  ];

  for (const lt of likeTables) {
    const likeConditions = words.map(() =>
      `(${lt.cols.map(c => `${c} LIKE ?`).join(' OR ')})`
    ).join(' AND ');
    const likeParams = words.flatMap(w =>
      lt.cols.map(() => `%${w}%`)
    );
    try {
      const likeResults = db.all<Record<string, unknown>>(
        `SELECT ${lt.titleCol} as title, COALESCE(${lt.bodyCol}, '') as body, '${lt.topic}' as topic, jurisdiction FROM ${lt.table} WHERE ${likeConditions} LIMIT ?`,
        [...likeParams, limit]
      );
      if (likeResults.length > 0) return { tier: 'like', results: likeResults };
    } catch {
      // LIKE fallback failed for this table
    }
  }

  return { tier: 'none', results: [] };
}

function tryFts(
  db: Database, select: string, table: string,
  order: string, matchExpr: string, limit: number
): Record<string, unknown>[] {
  try {
    return db.all(
      `${select} WHERE ${table} MATCH ? ${order}`,
      [matchExpr, limit]
    );
  } catch {
    return [];
  }
}

function sanitizeFtsInput(query: string): string {
  return query
    .replace(/["""'',,,,]/g, '"')
    .replace(/[^a-zA-Z0-9\s*"_\u00C0-\u024F-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(word: string): string {
  return word
    .replace(/(ung|heit|keit|lich|isch|ieren|tion|ment|ness|able|ible|ous|ive|ing|ers|ed|es|er|en|ly|s)$/i, '');
}
