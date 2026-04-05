import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface DirectSalesArgs {
  query: string;
  product_type?: string;
  jurisdiction?: string;
}

export function handleSearchDirectSalesRules(db: Database, args: DirectSalesArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM direct_sales_rules WHERE jurisdiction = ? AND (LOWER(product_type) LIKE LOWER(?) OR LOWER(rule) LIKE LOWER(?) OR LOWER(conditions) LIKE LOWER(?))`;
  const params: unknown[] = [jv.jurisdiction, `%${args.query}%`, `%${args.query}%`, `%${args.query}%`];

  if (args.product_type) {
    sql += ` AND LOWER(product_type) LIKE LOWER(?)`;
    params.push(`%${args.product_type}%`);
  }

  const results = db.all<{
    id: number; product_type: string; rule: string;
    exemptions: string; conditions: string;
  }>(sql, params);

  return {
    query: args.query,
    product_type: args.product_type,
    jurisdiction: jv.jurisdiction,
    results_count: results.length,
    rules: results.map(r => ({
      product_type: r.product_type,
      rule: r.rule,
      exemptions: r.exemptions,
      conditions: r.conditions,
    })),
    _meta: buildMeta(),
  };
}
