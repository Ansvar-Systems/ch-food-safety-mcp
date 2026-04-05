import { buildMeta } from '../metadata.js';
import { SUPPORTED_JURISDICTIONS } from '../jurisdiction.js';

export function handleAbout() {
  return {
    name: 'Switzerland Food Safety MCP',
    description:
      'Swiss food safety regulations based on the Lebensmittelgesetz (LMG), Hygieneverordnung (HyV), and BLV guidance. ' +
      'Covers Selbstkontrolle/HACCP requirements, BLV and cantonal registration, labelling and allergen rules, ' +
      'Swissness origin marking, AOC/AOP/IGP protected designations, temperature requirements, and ' +
      'Direktvermarktung (direct sales) rules for Hofladen and farm-gate sales.',
    version: '0.1.0',
    jurisdiction: [...SUPPORTED_JURISDICTIONS],
    data_sources: [
      'Lebensmittelgesetz (LMG, SR 817.0)',
      'Hygieneverordnung (HyV, SR 817.024.1)',
      'Lebensmittel- und Gebrauchsgegenstaendeverordnung (LGV)',
      'BLV Selbstkontrolle-Leitlinien',
      'AOC/AOP/IGP Register Schweiz',
      'GHP-Leitlinien (Branchenorganisationen)',
    ],
    tools_count: 10,
    links: {
      homepage: 'https://ansvar.eu/open-agriculture',
      repository: 'https://github.com/ansvar-systems/ch-food-safety-mcp',
      mcp_network: 'https://ansvar.ai/mcp',
    },
    _meta: buildMeta(),
  };
}
