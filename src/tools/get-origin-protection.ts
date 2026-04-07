import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface OriginProtectionArgs {
  product_name?: string;
  jurisdiction?: string;
}

export function handleGetOriginProtection(db: Database, args: OriginProtectionArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM origin_protection WHERE jurisdiction = ?`;
  const params: unknown[] = [jv.jurisdiction];

  if (args.product_name) {
    sql += ` AND LOWER(product_name) LIKE LOWER(?)`;
    params.push(`%${args.product_name}%`);
  }

  sql += ` ORDER BY protection_type, product_name`;

  const results = db.all<{
    id: number; product_name: string; protection_type: string;
    region: string; description: string;
  }>(sql, params);

  if (results.length === 0 && args.product_name) {
    const allProducts = db.all<{ product_name: string; protection_type: string }>(
      'SELECT product_name, protection_type FROM origin_protection WHERE jurisdiction = ? ORDER BY protection_type, product_name',
      [jv.jurisdiction]
    );
    return {
      error: 'not_found',
      message: `Kein Produkt '${args.product_name}' im AOC/AOP/IGP-Register gefunden.`,
      available_products: allProducts.map(p => `${p.product_name} (${p.protection_type})`),
    };
  }

  const aocAop = results.filter(r => r.protection_type === 'AOP' || r.protection_type === 'AOC');
  const igp = results.filter(r => r.protection_type === 'IGP');

  return {
    product_name: args.product_name ?? 'alle',
    jurisdiction: jv.jurisdiction,
    total_count: results.length,
    aoc_aop_count: aocAop.length,
    igp_count: igp.length,
    products: results.map(r => ({
      product_name: r.product_name,
      protection_type: r.protection_type,
      region: r.region,
      description: r.description,
    })),
    _citation: buildCitation(
      'CH Origin Protection',
      `AOC/AOP/IGP-Register ${args.product_name ?? 'alle'}`,
      'get_origin_protection',
      { ...(args.product_name ? { product_name: args.product_name } : {}) },
    ),
    _meta: buildMeta(),
  };
}
