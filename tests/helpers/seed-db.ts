import { createDatabase, type Database } from '../../src/db.js';

export function createSeededDatabase(dbPath: string): Database {
  const db = createDatabase(dbPath);

  // Self-monitoring / HACCP requirements
  db.run(
    `INSERT INTO self_monitoring_requirements (business_type, requirement, haccp_level, documentation, legal_basis, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Gastronomiebetrieb (Restaurant, Hotel, Kantine)',
      'Gefahrenanalyse nach HACCP-Grundsaetzen; CCP fuer Lagerung, Zubereitung, Warmhaltung und Ausgabe; GHP-Leitlinie Gastronomie anwenden',
      'Vereinfachtes HACCP-Konzept (GHP-basiert)',
      'Temperaturkontrollen, Reinigungsprotokoll, Personalschulung, Lieferantenliste, Allergenkarte',
      'LMG Art. 26; HyV Art. 4-8; GHP-Leitlinie GastroSuisse',
      'DE',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO self_monitoring_requirements (business_type, requirement, haccp_level, documentation, legal_basis, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Baeckerei / Konditorei',
      'HACCP-Konzept fuer Mehlverarbeitung, Cremes, Fuellungen; CCP bei Backtemperatur und Kuehlung',
      'Vereinfachtes HACCP-Konzept (GHP-basiert)',
      'Rohstoff-Eingangskontrolle, Backprotokolle, Kuehltemperatur-Aufzeichnungen, Allergen-Deklarationsliste',
      'LMG Art. 26; HyV Art. 4-8; GHP-Leitlinie SBC',
      'DE',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO self_monitoring_requirements (business_type, requirement, haccp_level, documentation, legal_basis, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Kaeserei / Milchverarbeitungsbetrieb',
      'Vollstaendiges HACCP-Konzept; CCP bei Pasteurisierung, Reifung, Salzung; mikrobiologische Kontrollen',
      'Vollstaendiges HACCP-Konzept',
      'Milchqualitaetsprotokoll, Temperatur-Aufzeichnungen, Laborergebnisse, Chargenrueckverfolgbarkeit',
      'LMG Art. 26; HyV Art. 4-8; GHP-Leitlinie Fromarte',
      'DE',
      'CH',
    ]
  );

  // Registration requirements
  db.run(
    `INSERT INTO registration_requirements (business_type, activity, authority, requirement, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Schlachtbetrieb',
      'Schlachtung',
      'BLV (Bundesamt fuer Lebensmittelsicherheit)',
      'BLV-Bewilligungspflicht. Amtliche Fleischkontrolle durch BLV-Tieraerzte.',
      'DE',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO registration_requirements (business_type, activity, authority, requirement, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Hofladen',
      'Direktverkauf',
      'Kanton (kantonale Lebensmittelkontrolle)',
      'Kantonale Meldepflicht. Keine BLV-Bewilligung noetig bei reinem Direktverkauf.',
      'DE',
      'CH',
    ]
  );

  // Labelling rules
  db.run(
    `INSERT INTO labelling_rules (product_type, mandatory_info, allergen_rules, swissness_rule, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Milchprodukte',
      'Sachbezeichnung, Zutatenverzeichnis, MHD/Verbrauchsdatum, Nettofuellmenge, Herkunftsangabe, Naehrwertdeklaration',
      '14 Hauptallergene gemaess LGV Anhang: Milch, Laktose als Einzelallergen deklarieren',
      '100% der Milch muss aus der Schweiz stammen fuer Schweizer Herkunftsangabe',
      'DE',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO labelling_rules (product_type, mandatory_info, allergen_rules, swissness_rule, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Fleisch',
      'Sachbezeichnung, Tierart, Herkunftsland (Aufzucht und Schlachtung), Verbrauchsdatum, Lagerhinweis',
      'Keine spezifischen Allergene bei reinem Fleisch; Allergene in Wurstwaren/Marinaden deklarieren',
      'Tier in der Schweiz aufgezogen und geschlachtet fuer Schweizer Herkunftsangabe',
      'DE',
      'CH',
    ]
  );

  // Temperature requirements
  db.run(
    `INSERT INTO temperature_requirements (food_category, max_temp_c, transport_temp_c, notes, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Frischfleisch', 7.0, 7.0, 'Rind, Schwein, Lamm. HyV Anhang.', 'DE', 'CH']
  );
  db.run(
    `INSERT INTO temperature_requirements (food_category, max_temp_c, transport_temp_c, notes, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Gefluegel', 4.0, 4.0, 'Frisches Gefluegel. Strenger als allgemeines Frischfleisch.', 'DE', 'CH']
  );
  db.run(
    `INSERT INTO temperature_requirements (food_category, max_temp_c, transport_temp_c, notes, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Tiefkuehlprodukte', -18.0, -18.0, 'Kurzzeitige Schwankung bis -15°C beim Transport zulaessig.', 'DE', 'CH']
  );

  // Direct sales rules
  db.run(
    `INSERT INTO direct_sales_rules (product_type, rule, exemptions, conditions, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Rohmilch',
      'Ab-Hof-Verkauf von Rohmilch erlaubt mit Hinweispflicht: Vor Genuss abkochen',
      'Keine Etikettierungspflicht fuer nicht vorverpackte Rohmilch bei Direktabgabe',
      'Hinweisschild am Verkaufsort; taeglich frisch; Kuehlung einhalten; kantonale Meldung',
      'DE',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO direct_sales_rules (product_type, rule, exemptions, conditions, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Eier',
      'Hofladen-Verkauf ohne Stempelung bis 50 Hennen; darueber Erzeugercode-Pflicht',
      'Befreiung von Stempelung bei Kleinstbestaenden und Direktabgabe am Hof',
      'Kuehl lagern (max. 5°C empfohlen); Legedatum oder MHD-Angabe',
      'DE',
      'CH',
    ]
  );

  // Origin protection (AOC/AOP/IGP)
  db.run(
    `INSERT INTO origin_protection (product_name, protection_type, region, description, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Gruyere',
      'AOP',
      'Kantone Freiburg, Waadt, Neuenburg, Jura, Bern',
      'Harter Schweizer Kaese aus Rohmilch mit mindestens 5 Monaten Reifung. AOP seit 2001.',
      'DE',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO origin_protection (product_name, protection_type, region, description, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Emmentaler',
      'AOP',
      'Kantone Bern, Luzern, Schwyz, Zug, Glarus, Solothurn, Aargau',
      'Grosser Lochkaese aus Rohmilch. AOP seit 2006.',
      'DE',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO origin_protection (product_name, protection_type, region, description, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Buendnerfleisch',
      'IGP',
      'Kanton Graubuenden',
      'Luftgetrocknetes Rindfleisch. IGP seit 2000. Verarbeitung in Graubuenden, Rohstoff nicht ortsgebunden.',
      'DE',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO origin_protection (product_name, protection_type, region, description, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'St. Galler Bratwurst',
      'IGP',
      'Kanton St. Gallen',
      'Traditionelle Brühwurst ohne Haut. IGP seit 2008.',
      'DE',
      'CH',
    ]
  );

  // FTS5 search index entries
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'HACCP Gastronomiebetrieb Selbstkontrolle',
      'Gefahrenanalyse HACCP-Grundsaetze CCP Lagerung Zubereitung Warmhaltung GHP-Leitlinie GastroSuisse LMG Art. 26 HyV',
      'selbstkontrolle',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'Baeckerei Konditorei HACCP Mehl Cremes',
      'HACCP-Konzept Mehlverarbeitung Cremes Fuellungen Backtemperatur Kuehlung Allergenmanagement SBC LMG HyV',
      'selbstkontrolle',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'Schlachtbetrieb BLV Bewilligung Fleischkontrolle',
      'BLV-Bewilligungspflicht Schlachtung amtliche Fleischkontrolle Tieraerzte kantonale Meldepflicht Registrierung',
      'registrierung',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'Etikettierung Allergene Swissness Milchprodukte',
      'Sachbezeichnung Zutatenverzeichnis MHD Naehrwertdeklaration 14 Allergene LGV Swissness 100% Milch Schweizer Herkunft',
      'etikettierung',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'Temperatur Frischfleisch Gefluegel Kuehlung',
      'Frischfleisch 7°C Gefluegel 4°C Tiefkuehl -18°C HyV Anhang Lagerung Transport Temperaturvorschriften',
      'temperatur',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'Hofladen Rohmilch Direktvermarktung Ab-Hof',
      'Rohmilch Ab-Hof-Verkauf Hinweispflicht abkochen Hofladen kantonale Meldung Direktvermarktung Eier',
      'direktvermarktung',
      'CH',
    ]
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'Gruyere Emmentaler AOP IGP Buendnerfleisch',
      'AOC AOP IGP Gruyere Emmentaler Buendnerfleisch St. Galler Bratwurst Ursprungsschutz GUB GGA Register',
      'ursprungsschutz',
      'CH',
    ]
  );

  // Metadata
  const today = new Date().toISOString().split('T')[0];
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)", [today]);
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('build_date', ?)", [today]);

  return db;
}
