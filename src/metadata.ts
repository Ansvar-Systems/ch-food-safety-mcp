export interface Meta {
  disclaimer: string;
  data_age: string;
  source_url: string;
  copyright: string;
  server: string;
  version: string;
}

const DISCLAIMER =
  'Diese Daten dienen ausschliesslich der Information und stellen keine rechtlich verbindliche Auskunft ' +
  'zur Lebensmittelsicherheit dar. Vor der Umsetzung von Hygienemassnahmen, Selbstkontrollkonzepten oder ' +
  'Etikettierungsentscheidungen ist stets die zustaendige kantonale Lebensmittelkontrolle oder das ' +
  'Bundesamt fuer Lebensmittelsicherheit und Veterinärwesen (BLV) zu konsultieren. Die Daten basieren auf ' +
  'dem Lebensmittelgesetz (LMG, SR 817.0), der Lebensmittel- und Gebrauchsgegenstaendeverordnung (LGV), ' +
  'der Hygieneverordnung (HyV) und den GHP-Leitlinien der Branchenorganisationen. Kantonale Unterschiede ' +
  'und betriebsspezifische Anforderungen sind eigenstaendig abzuklaeren. / ' +
  'This data is for informational purposes only and does not constitute legally binding food safety guidance. ' +
  'Always consult the responsible cantonal food safety authority or BLV before implementation. Data sourced ' +
  'from Swiss food law (LMG), Hygiene Ordinance (HyV), and industry GHP guidelines.';

export function buildMeta(overrides?: Partial<Meta>): Meta {
  return {
    disclaimer: DISCLAIMER,
    data_age: overrides?.data_age ?? 'unknown',
    source_url: overrides?.source_url ?? 'https://www.blv.admin.ch/blv/de/home/lebensmittel-und-ernaehrung.html',
    copyright: 'Data: BLV, kantonale Lebensmittelkontrolle, AOC/AOP/IGP Schweiz — used under public-sector information principles. Server: Apache-2.0 Ansvar Systems.',
    server: 'ch-food-safety-mcp',
    version: '0.1.0',
    ...overrides,
  };
}
