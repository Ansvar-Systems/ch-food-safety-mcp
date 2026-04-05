import { buildMeta } from '../metadata.js';
import type { Database } from '../db.js';

interface Source {
  name: string;
  authority: string;
  official_url: string;
  retrieval_method: string;
  update_frequency: string;
  license: string;
  coverage: string;
  last_retrieved?: string;
}

export function handleListSources(db: Database): { sources: Source[]; _meta: ReturnType<typeof buildMeta> } {
  const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

  const sources: Source[] = [
    {
      name: 'Lebensmittelgesetz (LMG, SR 817.0)',
      authority: 'Bundesamt fuer Lebensmittelsicherheit und Veterinärwesen (BLV)',
      official_url: 'https://www.fedlex.admin.ch/eli/cc/2017/249/de',
      retrieval_method: 'LEGAL_TEXT_EXTRACT',
      update_frequency: 'as amended (major revision 2017)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Food law framework: Selbstkontrolle, registration, labelling, traceability',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Hygieneverordnung (HyV, SR 817.024.1)',
      authority: 'BLV',
      official_url: 'https://www.fedlex.admin.ch/eli/cc/2017/155/de',
      retrieval_method: 'LEGAL_TEXT_EXTRACT',
      update_frequency: 'as amended',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'HACCP, temperature rules, GHP requirements, microbiological criteria',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Lebensmittel- und Gebrauchsgegenstaendeverordnung (LGV, SR 817.02)',
      authority: 'BLV',
      official_url: 'https://www.fedlex.admin.ch/eli/cc/2017/153/de',
      retrieval_method: 'LEGAL_TEXT_EXTRACT',
      update_frequency: 'as amended',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Product-specific rules, labelling, allergens, Naehrwertdeklaration',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Verordnung ueber den Schutz von Ursprungsbezeichnungen und geografischen Angaben (GUB/GGA-Verordnung, SR 910.12)',
      authority: 'BLW / BLV',
      official_url: 'https://www.blw.admin.ch/blw/de/home/instrumente/kennzeichnung/ursprungsbezeichnungen-und-geografische-angaben.html',
      retrieval_method: 'REGISTER_EXTRACT',
      update_frequency: 'as registered',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'AOC/AOP/IGP protected designations register',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Swissness-Gesetzgebung (MSchG Revision 2017)',
      authority: 'Eidgenoessisches Institut fuer Geistiges Eigentum (IGE)',
      official_url: 'https://www.ige.ch/de/etwas-schuetzen/herkunftsangaben/swissness.html',
      retrieval_method: 'LEGAL_TEXT_EXTRACT',
      update_frequency: 'as amended (in force since 2017)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Swissness origin marking: 80% Rohstoff rule (food), 100% Milch rule',
      last_retrieved: lastIngest?.value,
    },
  ];

  return {
    sources,
    _meta: buildMeta(),
  };
}
