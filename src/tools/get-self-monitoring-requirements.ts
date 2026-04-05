import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface SelfMonitoringArgs {
  business_type: string;
  jurisdiction?: string;
}

export function handleGetSelfMonitoringRequirements(db: Database, args: SelfMonitoringArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const results = db.all<{
    id: number; business_type: string; requirement: string;
    haccp_level: string; documentation: string; legal_basis: string;
  }>(
    `SELECT * FROM self_monitoring_requirements
     WHERE LOWER(business_type) LIKE LOWER(?) AND jurisdiction = ?`,
    [`%${args.business_type}%`, jv.jurisdiction]
  );

  if (results.length === 0) {
    // Fall back to listing all types
    const allTypes = db.all<{ business_type: string }>(
      'SELECT DISTINCT business_type FROM self_monitoring_requirements WHERE jurisdiction = ?',
      [jv.jurisdiction]
    );
    return {
      error: 'not_found',
      message: `Kein Betriebstyp '${args.business_type}' gefunden. Verfuegbare Typen: ${allTypes.map(t => t.business_type).join(', ')}`,
      available_types: allTypes.map(t => t.business_type),
    };
  }

  return {
    business_type: args.business_type,
    jurisdiction: jv.jurisdiction,
    results_count: results.length,
    requirements: results.map(r => ({
      business_type: r.business_type,
      requirement: r.requirement,
      haccp_level: r.haccp_level,
      documentation: r.documentation,
      legal_basis: r.legal_basis,
    })),
    _meta: buildMeta(),
  };
}
