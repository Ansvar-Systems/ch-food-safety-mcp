import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface RegistrationArgs {
  business_type: string;
  activity?: string;
  jurisdiction?: string;
}

export function handleGetRegistrationRequirements(db: Database, args: RegistrationArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM registration_requirements WHERE LOWER(business_type) LIKE LOWER(?) AND jurisdiction = ?`;
  const params: unknown[] = [`%${args.business_type}%`, jv.jurisdiction];

  if (args.activity) {
    sql += ` AND LOWER(activity) LIKE LOWER(?)`;
    params.push(`%${args.activity}%`);
  }

  const results = db.all<{
    id: number; business_type: string; activity: string;
    authority: string; requirement: string;
  }>(sql, params);

  if (results.length === 0) {
    const allTypes = db.all<{ business_type: string }>(
      'SELECT DISTINCT business_type FROM registration_requirements WHERE jurisdiction = ?',
      [jv.jurisdiction]
    );
    return {
      error: 'not_found',
      message: `Keine Registrierungsanforderungen fuer '${args.business_type}' gefunden.`,
      available_types: allTypes.map(t => t.business_type),
    };
  }

  return {
    business_type: args.business_type,
    jurisdiction: jv.jurisdiction,
    results_count: results.length,
    requirements: results.map(r => ({
      business_type: r.business_type,
      activity: r.activity,
      authority: r.authority,
      requirement: r.requirement,
    })),
    _meta: buildMeta(),
  };
}
