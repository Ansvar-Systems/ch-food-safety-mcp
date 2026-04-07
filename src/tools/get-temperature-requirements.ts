import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface TemperatureArgs {
  food_category?: string;
  jurisdiction?: string;
}

export function handleGetTemperatureRequirements(db: Database, args: TemperatureArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM temperature_requirements WHERE jurisdiction = ?`;
  const params: unknown[] = [jv.jurisdiction];

  if (args.food_category) {
    sql += ` AND LOWER(food_category) LIKE LOWER(?)`;
    params.push(`%${args.food_category}%`);
  }

  const results = db.all<{
    id: number; food_category: string; max_temp_c: number;
    transport_temp_c: number; notes: string;
  }>(sql, params);

  if (results.length === 0 && args.food_category) {
    const allCategories = db.all<{ food_category: string }>(
      'SELECT DISTINCT food_category FROM temperature_requirements WHERE jurisdiction = ?',
      [jv.jurisdiction]
    );
    return {
      error: 'not_found',
      message: `Keine Temperaturvorschriften fuer '${args.food_category}' gefunden.`,
      available_categories: allCategories.map(c => c.food_category),
    };
  }

  return {
    food_category: args.food_category ?? 'alle',
    jurisdiction: jv.jurisdiction,
    results_count: results.length,
    requirements: results.map(r => ({
      food_category: r.food_category,
      max_storage_temp_c: r.max_temp_c,
      transport_temp_c: r.transport_temp_c,
      notes: r.notes,
    })),
    _citation: buildCitation(
      'CH Temperature Requirements',
      `Temperaturvorschriften ${args.food_category ?? 'alle'}`,
      'get_temperature_requirements',
      { ...(args.food_category ? { food_category: args.food_category } : {}) },
    ),
    _meta: buildMeta(),
  };
}
