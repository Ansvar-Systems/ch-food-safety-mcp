import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface LabellingArgs {
  product_type?: string;
  jurisdiction?: string;
}

export function handleGetLabellingRules(db: Database, args: LabellingArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM labelling_rules WHERE jurisdiction = ?`;
  const params: unknown[] = [jv.jurisdiction];

  if (args.product_type) {
    sql += ` AND LOWER(product_type) LIKE LOWER(?)`;
    params.push(`%${args.product_type}%`);
  }

  const results = db.all<{
    id: number; product_type: string; mandatory_info: string;
    allergen_rules: string; swissness_rule: string;
  }>(sql, params);

  if (results.length === 0) {
    const allTypes = db.all<{ product_type: string }>(
      'SELECT DISTINCT product_type FROM labelling_rules WHERE jurisdiction = ?',
      [jv.jurisdiction]
    );
    return {
      error: 'not_found',
      message: `Keine Etikettierungsregeln fuer '${args.product_type ?? 'alle'}' gefunden.`,
      available_types: allTypes.map(t => t.product_type),
    };
  }

  return {
    product_type: args.product_type ?? 'alle',
    jurisdiction: jv.jurisdiction,
    results_count: results.length,
    rules: results.map(r => ({
      product_type: r.product_type,
      mandatory_info: r.mandatory_info,
      allergen_rules: r.allergen_rules,
      swissness_rule: r.swissness_rule,
    })),
    _meta: buildMeta(),
  };
}
