/**
 * Switzerland Food Safety MCP — Data Ingestion Script
 *
 * Populates the database with Swiss food safety data from:
 * - BLV — Lebensmittelgesetz (LMG, SR 817.0), LGV, HyV
 * - Kantonale Lebensmittelkontrolle — Inspektionen, GHP-Leitlinien
 * - AOC/AOP/IGP Schweiz — Ursprungsbezeichnungen
 * - Swissness-Gesetzgebung (MSchG Revision 2017)
 *
 * Usage: npm run ingest
 */

import { createDatabase } from '../src/db.js';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('data', { recursive: true });
const db = createDatabase('data/database.db');

const now = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// 1. Selbstkontrolle / HACCP requirements by business type
//    Source: LMG Art. 26, HyV Art. 4-8, GHP-Leitlinien
// ---------------------------------------------------------------------------

interface SelfMonitoring {
  business_type: string;
  requirement: string;
  haccp_level: string;
  documentation: string;
  legal_basis: string;
}

const selfMonitoringRequirements: SelfMonitoring[] = [
  {
    business_type: 'Gastronomiebetrieb (Restaurant, Hotel, Kantine)',
    requirement: 'Gefahrenanalyse nach HACCP-Grundsaetzen; Identifikation kritischer Kontrollpunkte (CCP) fuer Lagerung, Zubereitung, Warmhaltung und Ausgabe; GHP-Leitlinie Gastronomie anwenden; persoenliche Hygiene des Personals (Haende waschen, Arbeitskleidung); Reinigungsplan fuer Kueche, Lager, Sanitaerbereich',
    haccp_level: 'Vereinfachtes HACCP-Konzept (GHP-basiert)',
    documentation: 'Temperaturkontrollen (Kuehlgeraete, Warmhaltung), Reinigungsprotokoll, Personalschulung (jaehrlich), Lieferantenliste mit Rueckverfolgbarkeit, Allergenkarte/Allergeninformation fuer Gaeste',
    legal_basis: 'LMG Art. 26; HyV Art. 4-8; GHP-Leitlinie GastroSuisse',
  },
  {
    business_type: 'Baeckerei / Konditorei',
    requirement: 'HACCP-Konzept fuer Mehlverarbeitung, Cremes, Fuellungen; CCP bei Backtemperatur und Kuehlung von Cremeerzeugnissen; Rohstoffkontrolle (Mehl, Eier, Milch); Allergenmanagement (Gluten, Milch, Eier, Nuesse); Schaedlingsbekaempfung (Mehlmotten, Maeuse)',
    haccp_level: 'Vereinfachtes HACCP-Konzept (GHP-basiert)',
    documentation: 'Rohstoff-Eingangskontrolle, Backprotokolle, Kuehltemperatur-Aufzeichnungen, Allergen-Deklarationsliste, Reinigungsplan, Schaedlingsmonitoring',
    legal_basis: 'LMG Art. 26; HyV Art. 4-8; GHP-Leitlinie SBC (Schweizer Baecker-Confiseure)',
  },
  {
    business_type: 'Metzgerei / Fleischverarbeitungsbetrieb',
    requirement: 'Vollstaendiges HACCP-Konzept; CCP bei Fleischtemperatur (Eingang, Lagerung, Verarbeitung, Verkauf); Kreuzkontaminationsvermeidung roh/gekocht; Hygienezonierung (rein/unrein); Rueckverfolgbarkeit Schlachttierdaten; Mikrobiologische Eigenkontrolle (Listeria, Salmonella)',
    haccp_level: 'Vollstaendiges HACCP-Konzept (7 Grundsaetze)',
    documentation: 'Wareneingangstemperaturen, Kuehlkette lueckenlos dokumentiert, Hygieneproben (Tupfer, Produktproben), HACCP-Flussdiagramm, Personalschulung, Rueckverfolgbarkeit (Ohrmarke bis Verkauf)',
    legal_basis: 'LMG Art. 26; HyV Art. 4-8; VHyS (Verordnung ueber das Schlachten); GHP-Leitlinie SFF (Schweizer Fleisch-Fachverband)',
  },
  {
    business_type: 'Kaeserei / Milchverarbeitungsbetrieb',
    requirement: 'Vollstaendiges HACCP-Konzept; CCP bei Pasteurisierung (71.7C/15s), Rohmilchkaese-Reifung (Mindestreifedauer je nach Sorte), Salzgehalt, Wasseraktivitaet; Milchqualitaet (Zellzahl, Keimzahl); Reinigung CIP-Anlage; Starterkulturen-Management',
    haccp_level: 'Vollstaendiges HACCP-Konzept (7 Grundsaetze)',
    documentation: 'Milch-Eingangskontrollen (Keimzahl, Hemmstofftest), Pasteurisierungsprotokoll, Reifungsprotokolle (Temperatur, Feuchtigkeit, Dauer), pH-Messungen, mikrobiologische Analysen, CIP-Reinigungsprotokolle',
    legal_basis: 'LMG Art. 26; HyV Art. 4-8; Milchpruefungsverordnung (MiPV); GHP-Leitlinie Fromarte',
  },
  {
    business_type: 'Alpkaeserei',
    requirement: 'Vereinfachtes HACCP-Konzept angepasst an Alpbetrieb; CCP bei Milchqualitaet, Verkaesungstemperatur, Reifungsbedingungen; traditionelle Herstellungsverfahren anerkannt (z.B. Kupferkessel, Holzgestell); jaehrliche Kontrolle durch kantonale Lebensmittelkontrolle; Wasserqualitaet (Quellwasser pruefen)',
    haccp_level: 'Vereinfachtes HACCP-Konzept (angepasst Alpbetrieb)',
    documentation: 'Milchlieferantenliste, Verkaesungsprotokolle (Temperatur, Lab, Kultur), Reifungsbedingungen, Wasseranalysen (jaehrlich), Reinigungsprotokoll',
    legal_basis: 'LMG Art. 26; HyV Art. 4-8; Hygieneleitlinie Alpkaesereien',
  },
  {
    business_type: 'Hofladen / Direktvermarktung',
    requirement: 'Vereinfachte Selbstkontrolle fuer Primaerproduktion und einfache Verarbeitung; GHP-Grundsaetze: Sauberkeit, Temperatureinhaltung, Schaedlingsschutz; Produkthaftung liegt beim Produzenten; bei eigener Verarbeitung (Konfituere, Doerrobst, Sirup) erweitertes Konzept noetig',
    haccp_level: 'Basisanforderungen / vereinfachte GHP',
    documentation: 'Produkteliste mit Haltbarkeitsdaten, Temperaturkontrollen (Kuehlprodukte), Reinigungsplan, Allergenkennzeichnung, Rueckverfolgbarkeit (eigene Produktion)',
    legal_basis: 'LMG Art. 26; HyV Art. 4; LGV Art. 14 (Primaerproduktion-Ausnahmen)',
  },
  {
    business_type: 'Gemuese-/Obstverarbeitungsbetrieb',
    requirement: 'HACCP-Konzept fuer Waschen, Schneiden, Verpacken; CCP bei Wasserqualitaet (Waschwasser), Kuehlkette (Fresh-Cut Produkte max. 5C), Verpackungsintegritaet; Fremdkoerper-Detektion bei industrieller Verarbeitung; Rueckstandskontrolle (Pflanzenschutzmittel)',
    haccp_level: 'Vereinfachtes bis vollstaendiges HACCP-Konzept (abhaengig von Betriebsgroesse)',
    documentation: 'Wasseranalysen, Temperaturprotokolle, Rueckstandsanalysen (stichprobenartig), MHD-Validierung, Reinigungsprotokoll, Personalschulung',
    legal_basis: 'LMG Art. 26; HyV Art. 4-8; GHP-Leitlinie Schweizer Obstverband / Swisscofel',
  },
  {
    business_type: 'Grossverteiler / Detailhandel',
    requirement: 'GHP-basierte Selbstkontrolle; Kuehlkettenmanagement (Kuehlregale, Tiefkuehltruhen); Warenrotation (FIFO); Hygiene Frischtheke (Fleisch, Kaese, Feinkost); Rueckrufmanagement; Allergenkennzeichnung bei offener Abgabe; Schulung Verkaufspersonal',
    haccp_level: 'Vereinfachtes HACCP-Konzept (GHP-basiert)',
    documentation: 'Temperaturmonitoring (automatisiert empfohlen), Reklamationsprotokoll, Rueckrufprozeduren, Hygiene-Checklisten Frischtheke, Personalschulung',
    legal_basis: 'LMG Art. 26; HyV Art. 4-8; GHP-Leitlinie IG DHS / Swiss Retail Federation',
  },
  {
    business_type: 'Schlachtbetrieb',
    requirement: 'Vollstaendiges HACCP-Konzept; BLV-Bewilligung erforderlich; amtliche Fleischkontrolle bei jeder Schlachtung; CCP bei Betaeubung, Entblutung, Enthaeuten/Bruehen, Kuehlung (Kerntemperatur 7C innert 24h); Hygienezonierung strikt; Abwasserbehandlung',
    haccp_level: 'Vollstaendiges HACCP-Konzept (7 Grundsaetze) + amtliche Kontrolle',
    documentation: 'Schlachtprotokolle, Veterinaeruntersuchungsbefunde, Temperaturprotokolle (Kuehlraeume), Tupferproben (Schlachtkoerper), Abwasseranalysen, Personalgesundheitszeugnis',
    legal_basis: 'LMG Art. 26; VHyS Art. 3-15; HyV Art. 4-8; VSFK (Verordnung ueber die Schlachttier- und Fleischkontrolle)',
  },
  {
    business_type: 'Brennerei / Destillerie',
    requirement: 'Selbstkontrollkonzept fuer Alkoholherstellung; CCP bei Gaerung (Temperatur, Dauer), Destillation (Vorlauf-/Nachlaufabtrennung — Methanol), Lagerung; Eidgenoessische Alkoholverwaltung (EAV) Bewilligung zusaetzlich zur Lebensmittelkontrolle',
    haccp_level: 'Vereinfachtes HACCP-Konzept',
    documentation: 'Maischebuch, Destillationsprotokolle, Alkoholgehalt-Messungen, Lagerbestandsbuch (EAV), Reinigungsprotokolle',
    legal_basis: 'LMG Art. 26; HyV Art. 4; Alkoholgesetz (AlkG)',
  },
];

const insertSelfMonitoring = db.instance.prepare(
  `INSERT INTO self_monitoring_requirements (business_type, requirement, haccp_level, documentation, legal_basis, jurisdiction)
   VALUES (?, ?, ?, ?, ?, 'CH')`
);

for (const sm of selfMonitoringRequirements) {
  insertSelfMonitoring.run(sm.business_type, sm.requirement, sm.haccp_level, sm.documentation, sm.legal_basis);
}
console.log(`Inserted ${selfMonitoringRequirements.length} self-monitoring requirements`);

// ---------------------------------------------------------------------------
// 2. Registration requirements — BLV vs. cantonal
//    Source: LMG Art. 21-22, LGV Art. 11-13, VHyS
// ---------------------------------------------------------------------------

interface Registration {
  business_type: string;
  activity: string;
  authority: string;
  requirement: string;
}

const registrationRequirements: Registration[] = [
  {
    business_type: 'Schlachtbetrieb',
    activity: 'Schlachtung von Nutztieren',
    authority: 'BLV',
    requirement: 'BLV-Bewilligung erforderlich (Art. 21 LMG). Antrag ueber kantonales Veterinäramt. Amtliche Fleischkontrolle bei jeder Schlachtung. Betrieb muss bauliche und hygienische Mindestanforderungen erfuellen (VHyS). Jaehrliche BLV-Inspektion.',
  },
  {
    business_type: 'Zerlegungsbetrieb',
    activity: 'Zerlegung und Verarbeitung von Fleisch',
    authority: 'BLV',
    requirement: 'BLV-Bewilligung erforderlich bei gewerbsmaessiger Zerlegung tierischer Lebensmittel. Hygienezonierung rein/unrein. Kuehlraeume mit Temperaturueberwachung. HACCP-Konzept Pflicht.',
  },
  {
    business_type: 'Milchverarbeitungsbetrieb',
    activity: 'Gewerbsmaessige Milchverarbeitung (Kaeserei, Molkerei)',
    authority: 'BLV',
    requirement: 'BLV-Bewilligung fuer Betriebe, die Milch gewerbsmaessig zu tierischen Lebensmitteln verarbeiten. Pasteurisierungsanlage (oder Rohmilchverarbeitung mit validiertem HACCP). Milchpruefung (MiPV). Kantonale Milchkontrolle.',
  },
  {
    business_type: 'Eierpackstelle',
    activity: 'Sortierung und Verpackung von Eiern (gewerbsmaessig)',
    authority: 'BLV',
    requirement: 'BLV-Bewilligung bei gewerbsmaessigem Sortieren und Verpacken von Eiern. Eier-Kennzeichnung (Legebetrieb, Haltungsform, MHD). Kuehlpflicht ab 18 Tage nach Legedatum.',
  },
  {
    business_type: 'Fischverarbeitungsbetrieb',
    activity: 'Verarbeitung von Fisch und Meeresfruechten',
    authority: 'BLV',
    requirement: 'BLV-Bewilligung fuer gewerbsmaessige Verarbeitung tierischer Lebensmittel. Kuehlkette -18C (Tiefkuehl) oder 0-2C (frisch). Parasitenkontrolle (Anisakis bei Rohverzehr: -20C fuer 24h). HACCP mit Histamin-CCP.',
  },
  {
    business_type: 'Gastronomiebetrieb',
    activity: 'Zubereitung und Abgabe von Speisen',
    authority: 'Kantonal',
    requirement: 'Kantonale Registrierungspflicht (Betriebsbewilligung Gastronomie). Meldung an kantonale Lebensmittelkontrolle vor Betriebsaufnahme. Selbstkontrollkonzept vorlegen. Risikobasierte Inspektionen (typisch 1-2x pro Jahr).',
  },
  {
    business_type: 'Baeckerei / Konditorei',
    activity: 'Herstellung und Verkauf von Backwaren',
    authority: 'Kantonal',
    requirement: 'Kantonale Registrierung. Meldung an kantonale Lebensmittelkontrolle. Selbstkontrollkonzept. Bei Verwendung tierischer Zutaten (Cremes, Butter) erhoehte Anforderungen.',
  },
  {
    business_type: 'Hofladen / Ab-Hof-Verkauf',
    activity: 'Direktvermarktung landwirtschaftlicher Produkte',
    authority: 'Kantonal',
    requirement: 'Kantonale Registrierung (Meldepflicht). Bei reiner Primaerproduktion (unverarbeitete Produkte) vereinfachte Anforderungen. Bei Verarbeitung (Konfituere, Fleisch, Kaese) gelten die Anforderungen des jeweiligen Produkttyps. Eigene Schlachtung von Gefluegel bis 50 Tiere/Woche ohne BLV-Bewilligung moeglich.',
  },
  {
    business_type: 'Lebensmitteltransport',
    activity: 'Gewerbsmaessiger Transport von Lebensmitteln',
    authority: 'Kantonal',
    requirement: 'Kantonale Registrierung. Kuehlfahrzeuge mit Temperaturaufzeichnung. ATP-Uebereinkommen (internationale Transporte). Lebensmittel getrennt von Nicht-Lebensmitteln transportieren.',
  },
  {
    business_type: 'Online-Lebensmittelhandel',
    activity: 'Fernabsatz von Lebensmitteln (Onlineshop)',
    authority: 'Kantonal',
    requirement: 'Kantonale Registrierung am Betriebsstandort. Vollstaendige Produktinformation vor Kauf (LGV Art. 39: Bezeichnung, Zutaten, Allergene, MHD, Herkunft). Kuehlkette bei Versand. Rueckverfolgbarkeit.',
  },
  {
    business_type: 'Wochenmarkt-/Festbetrieb',
    activity: 'Verkauf oder Abgabe an Maerkten und Festen',
    authority: 'Kantonal',
    requirement: 'Kantonale Registrierung oder Einzelbewilligung (kantonal unterschiedlich). Hygieneanforderungen: Handwaschgelegenheit, Kuehlung, Schutz vor Verunreinigung. Abgabe offener Lebensmittel: muendliche Allergeninformation moeglich.',
  },
  {
    business_type: 'Importeur',
    activity: 'Import von Lebensmitteln in die Schweiz',
    authority: 'BLV / Zoll',
    requirement: 'Selbstkontrolle durch Importeur (LMG Art. 26). Einfuhrkontrolle durch BLV (risikobasiert, TRACES-System fuer tierische Produkte). Einhaltung Schweizer Lebensmittelrecht (kann strenger sein als EU). Swissness-Regeln bei Schweizer Herkunftsangabe beachten.',
  },
];

const insertRegistration = db.instance.prepare(
  `INSERT INTO registration_requirements (business_type, activity, authority, requirement, jurisdiction)
   VALUES (?, ?, ?, ?, 'CH')`
);

for (const reg of registrationRequirements) {
  insertRegistration.run(reg.business_type, reg.activity, reg.authority, reg.requirement);
}
console.log(`Inserted ${registrationRequirements.length} registration requirements`);

// ---------------------------------------------------------------------------
// 3. Labelling rules
//    Source: LGV Art. 3, 12, 36-39; Allergen: LGV Anhang 6;
//    Swissness: MSchG Art. 48a-48c
// ---------------------------------------------------------------------------

interface LabellingRule {
  product_type: string;
  mandatory_info: string;
  allergen_rules: string;
  swissness_rule: string;
}

const labellingRules: LabellingRule[] = [
  {
    product_type: 'Vorverpackte Lebensmittel (allgemein)',
    mandatory_info: 'Sachbezeichnung; Zutatenliste (absteigend nach Gewicht); Allergene hervorgehoben (fett, kursiv oder unterstrichen); Nettofuellmenge; MHD oder Verbrauchsdatum; Aufbewahrungshinweise; Name und Adresse der verantwortlichen Person in der Schweiz; Herkunftsland/Ursprungsort; Naehrwertdeklaration (Energie, Fett, davon gesaettigte Fettsaeuren, Kohlenhydrate, davon Zucker, Eiweiss, Salz) — seit 1.5.2021 obligatorisch; Los-Kennzeichnung',
    allergen_rules: '14 deklarationspflichtige Allergene nach LGV Anhang 6: glutenhaltiges Getreide (Weizen, Roggen, Gerste, Hafer, Dinkel, Kamut), Krebstiere, Eier, Fisch, Erdnuesse, Sojabohnen, Milch (inkl. Laktose), Schalenfrüchte (Mandeln, Haselnuesse, Walnuesse, Cashew, Pecan, Paranuss, Pistazie, Macadamia), Sellerie, Senf, Sesamsamen, Schwefeldioxid/Sulfite (>10mg/kg), Lupinen, Weichtiere. Allergene muessen in Zutatenliste hervorgehoben werden.',
    swissness_rule: 'Herkunftsangabe "Schweiz" oder Schweizerkreuz: mind. 80% des Gewichts der Rohstoffe muessen aus der Schweiz stammen (Art. 48c MSchG). Berechnung: Gewichtsanteil, nicht Wertanteil. Rohstoffe, die in der Schweiz nicht in genuegender Menge/Qualitaet verfuegbar sind, koennen ausgenommen werden (Selbstversorgungsgrad). Wasser und Milch zu 100% aus CH.',
  },
  {
    product_type: 'Milch und Milchprodukte',
    mandatory_info: 'Sachbezeichnung (z.B. Vollmilch, teilentrahmte Milch, Rahm, Joghurt, Kaese); Fettgehalt; Waermebehandlung (pasteurisiert, UHT, roh); bei Kaese: Sortenbezeichnung, Fett i.T.; MHD; Herkunft der Milch',
    allergen_rules: 'Milch ist deklarationspflichtiges Allergen (inkl. Laktose). Auch bei Kaese, Butter, Rahm, Molke. Laktosefreie Produkte: Laktosegehalt <0.1g/100g, Kennzeichnung "laktosefrei".',
    swissness_rule: 'Milch und Milchprodukte mit Herkunftsangabe "Schweiz": 100% der Milch muss aus der Schweiz stammen (Art. 48c Abs. 2 MSchG). Ausnahme nur bei nachweislicher Nichtverfuegbarkeit.',
  },
  {
    product_type: 'Fleisch und Fleischerzeugnisse',
    mandatory_info: 'Sachbezeichnung (Tierart, Teilstueck); Herkunftsland des Tieres (Geburt, Aufzucht, Schlachtung); Verbrauchsdatum (bei frischem Fleisch); Aufbewahrungstemperatur; Naehrwertdeklaration; bei verarbeitetem Fleisch: Zutatenliste, Anteil Fleisch',
    allergen_rules: 'Allergene in Marinaden, Wuerzungen beachten (z.B. Senf, Soja, Sellerie, Gluten in paniertem Fleisch). Sulfite bei Hackfleischzubereitungen.',
    swissness_rule: 'Herkunftsangabe "Schweizer Fleisch": Tier in der Schweiz geboren, aufgezogen und geschlachtet (Swiss law stricter than EU). Proviande-Label fuer Schweizer Fleisch. 80%-Regel gilt fuer zusammengesetzte Fleischprodukte.',
  },
  {
    product_type: 'Backwaren',
    mandatory_info: 'Sachbezeichnung; Zutatenliste (inkl. Mehltyp bei Spezialbroten); Allergene (Gluten, Milch, Eier, Nuesse, Sesam, Soja); MHD; Naehrwertdeklaration; bei unverpackter Ware (Baeckerei): muendliche Allergeninformation muss verfuegbar sein',
    allergen_rules: 'Gluten (Weizen, Roggen, Gerste, Hafer, Dinkel, Kamut) ist haeufigster Allergen in Backwaren. Milch, Eier, Nuesse, Sesam, Soja ebenfalls typisch. Glutenfreie Produkte: max. 20mg/kg Gluten.',
    swissness_rule: '80%-Regel: bei Brot typischerweise erfuellt wenn Mehl aus Schweizer Getreide. Aufpreiszahlung IP-Suisse oder Bio Suisse Knospe fuer Schweizer Herkunft ueblich.',
  },
  {
    product_type: 'Getraenke (nicht-alkoholisch)',
    mandatory_info: 'Sachbezeichnung; Zutatenliste; Naehrwertdeklaration; MHD; Nettofuellmenge; bei Fruchtsaft: Fruchtanteil; bei Mineralwasser: Analysen, Quellbezeichnung',
    allergen_rules: 'Allergene moeglich bei Milchmischgetraenken (Milch), Smoothies mit Nuessen, Sojadrinks (Soja). Sulfite bei Traubensaft.',
    swissness_rule: 'Wasser zaehlt als Schweizer Rohstoff wenn aus Schweizer Quelle. Bei Fruchtsaft: 80% der Frucht muss aus CH stammen fuer Schweizer Herkunftsangabe.',
  },
  {
    product_type: 'Alkoholische Getraenke',
    mandatory_info: 'Sachbezeichnung; Alkoholgehalt (% vol); Nettofuellmenge; Herkunftsangabe; bei Wein: Jahrgang, Rebsorte, AOC-Bezeichnung; Los-Kennzeichnung. Naehrwertdeklaration seit 2023 fuer Wein in der EU — CH noch nicht obligatorisch, aber empfohlen.',
    allergen_rules: 'Sulfite deklarationspflichtig (>10mg/l). Milch- und Eiprodukte wenn als Schoenungsmittel verwendet. Gluten bei Bier.',
    swissness_rule: 'Wein: Schweizer AOC-System (kantonal). Bier: 80% Rohstoffanteil CH fuer Schweizer Herkunftsangabe. Spirituosen: Verarbeitung in der Schweiz genuegt fuer bestimmte Bezeichnungen (z.B. Kirsch).',
  },
  {
    product_type: 'Honig',
    mandatory_info: 'Sachbezeichnung ("Honig", Sortenbezeichnung wenn zutreffend); Herkunftsland; Nettofuellmenge; MHD; Name und Adresse des Imkers oder Abfuellers. Mischungen verschiedener Herkunftslaender: "Mischung von Honig aus EU- und Nicht-EU-Laendern" o.ae.',
    allergen_rules: 'Honig selbst kein deklarationspflichtiges Allergen. Bei Honig mit Zusaetzen (Nuesse, Gewuerze): jeweilige Allergene deklarieren.',
    swissness_rule: '100% Schweizer Honig fuer Herkunftsangabe "Schweiz". Gguetesiegel goldene Biene (Bienen Schweiz) garantiert 100% CH. Importanteil CH-Markt ca. 75%.',
  },
  {
    product_type: 'Offene Abgabe (unverpackt)',
    mandatory_info: 'Bei offener Abgabe (Markt, Theke, Buffet): Allergene muessen muendlich auf Anfrage oder schriftlich (Aushang, Karte) kommuniziert werden. Herkunft bei Fleisch, Fisch und Eiern muss angegeben werden. Sachbezeichnung empfohlen.',
    allergen_rules: 'Muendliche Allergeninformation muss geschultem Personal jederzeit verfuegbar sein. Alternative: schriftliche Information (Speisekarte, Anschlag, Ordner am Verkaufspunkt). "Auf Anfrage" genuegt — automatische Deklaration nicht obligatorisch.',
    swissness_rule: 'Herkunftsangabe bei offener Abgabe: gleiche Swissness-Regeln. Bei Fleisch: Herkunftsland obligatorisch sichtbar.',
  },
];

const insertLabelling = db.instance.prepare(
  `INSERT INTO labelling_rules (product_type, mandatory_info, allergen_rules, swissness_rule, jurisdiction)
   VALUES (?, ?, ?, ?, 'CH')`
);

for (const lr of labellingRules) {
  insertLabelling.run(lr.product_type, lr.mandatory_info, lr.allergen_rules, lr.swissness_rule);
}
console.log(`Inserted ${labellingRules.length} labelling rules`);

// ---------------------------------------------------------------------------
// 4. Temperature requirements
//    Source: HyV Anhang 1, Verordnung des EDI (VSFK)
// ---------------------------------------------------------------------------

interface TemperatureReq {
  food_category: string;
  max_temp_c: number;
  transport_temp_c: number | null;
  notes: string;
}

const temperatureRequirements: TemperatureReq[] = [
  {
    food_category: 'Frischfleisch (Rind, Schwein, Lamm)',
    max_temp_c: 5,
    transport_temp_c: 7,
    notes: 'Lagerung max. 5C (HyV). Transport max. 7C. Hackfleisch max. 2C (kurzfristig). Nach Schlachtung Kerntemperatur 7C innert 24h (Grosswild) bzw. 4C innert 12h (Kleinwild). Verbrauchsdatum statt MHD.',
  },
  {
    food_category: 'Gefluegelfleisch',
    max_temp_c: 4,
    transport_temp_c: 4,
    notes: 'Lagerung und Transport max. 4C. Erhoehtes Salmonellen- und Campylobacter-Risiko. Trennung von anderen Lebensmitteln. Durchgarung auf Kerntemperatur 74C empfohlen.',
  },
  {
    food_category: 'Fisch und Meeresfruechte (frisch)',
    max_temp_c: 2,
    transport_temp_c: 2,
    notes: 'Frischer Fisch: max. 2C (moeglichst auf Eis). Bei Rohverzehr (Sushi, Tartare): vorheriges Tiefgefrieren -20C fuer mind. 24h (Parasitenabtötung Anisakis). Histaminbildung bei erhoehter Temperatur (Thunfisch, Makrele).',
  },
  {
    food_category: 'Milch (pasteurisiert)',
    max_temp_c: 5,
    transport_temp_c: 6,
    notes: 'Pasteurisierte Milch max. 5C lagern. Transport max. 6C. UHT-Milch nach Oeffnung wie Frischmilch behandeln. Rohmilch (Vorzugsmilch) ab Hof: sofortige Kuehlung auf unter 8C innert 2h nach Melken.',
  },
  {
    food_category: 'Rohmilch (ab Hof / Vorzugsmilch)',
    max_temp_c: 8,
    transport_temp_c: 8,
    notes: 'Rohmilch: Kuehlung auf unter 8C innert 2h nach Melken. Abgabe ab Hof (Vorzugsmilch) erlaubt mit Hinweis "Rohmilch — vor dem Verzehr abkochen". Besondere Keimzahl-Grenzwerte (max. 50000 KBE/ml bei Abgabe). Schwangere, Kinder, Immunsupprimierte: Abkochempfehlung.',
  },
  {
    food_category: 'Eier',
    max_temp_c: 5,
    transport_temp_c: 8,
    notes: 'Kuehlpflicht ab 18 Tage nach Legedatum (davor Raumtemperatur moeglich). Verkauf bis max. 21 Tage nach Legedatum. MHD 28 Tage nach Legedatum. Lagerung beim Konsumenten: Kuehlschrank empfohlen.',
  },
  {
    food_category: 'Kaese (Hartkaese, Halbhartkaese)',
    max_temp_c: 12,
    transport_temp_c: 12,
    notes: 'Hart- und Halbhartkaese (Gruyere, Emmentaler, Appenzeller): max. 12C empfohlen (laengere Haltbarkeit bei tieferer Temperatur). Weichkaese und Frischkaese: max. 5C. Rohmilchkaese: Mindestreifedauer beachten.',
  },
  {
    food_category: 'Weichkaese und Frischkaese',
    max_temp_c: 5,
    transport_temp_c: 5,
    notes: 'Frischkaese und Weichkaese max. 5C. Erhoehtes Listeria-Risiko bei Weichkaese aus Rohmilch. Schwangere: Verzicht auf Rohmilch-Weichkaese empfohlen (BAG).',
  },
  {
    food_category: 'Tiefkuehlprodukte',
    max_temp_c: -18,
    transport_temp_c: -18,
    notes: 'Tiefkuehlkette -18C durchgehend. Kurzzeitige Erwaermung auf -15C bei Transport/Umladung toleriert. Einmal aufgetaute Produkte nicht wieder einfrieren (mikrobiologische Sicherheit). MHD beachten — auch Tiefkuehlware ist nicht unbegrenzt haltbar.',
  },
  {
    food_category: 'Speiseeis',
    max_temp_c: -18,
    transport_temp_c: -18,
    notes: 'Lagerung und Transport -18C. Bei Abgabe (Glacewagen, Dessert): kurzzeitig hoehere Temperatur akzeptabel. Herstellung: Pasteurisierung der Eismasse (mind. 68C/30min oder 80C/15s). Rohei-basiertes Eis: erhoehtes Salmonellenrisiko.',
  },
  {
    food_category: 'Warmhaltung (fertige Speisen)',
    max_temp_c: 65,
    transport_temp_c: 65,
    notes: 'Fertige warme Speisen muessen auf mind. 65C gehalten werden (Warmhaltung). Kritischer Bereich 5-65C ("Gefahrenzone"): max. 2h Aufenthalt. Regenerierung (Aufwaermen) auf Kerntemperatur mind. 75C. Einmaliges Aufwaermen empfohlen.',
  },
  {
    food_category: 'Fertigsalate / Fresh-Cut',
    max_temp_c: 5,
    transport_temp_c: 5,
    notes: 'Vorgeschnittene Salate und Gemuese: max. 5C. Kurze Haltbarkeit (MHD beachten). Waschung reduziert Keimbelastung, eliminiert sie aber nicht. Konsumdatum einhalten.',
  },
];

const insertTemperature = db.instance.prepare(
  `INSERT INTO temperature_requirements (food_category, max_temp_c, transport_temp_c, notes, jurisdiction)
   VALUES (?, ?, ?, ?, 'CH')`
);

for (const tr of temperatureRequirements) {
  insertTemperature.run(tr.food_category, tr.max_temp_c, tr.transport_temp_c, tr.notes);
}
console.log(`Inserted ${temperatureRequirements.length} temperature requirements`);

// ---------------------------------------------------------------------------
// 5. Direct sales rules (Direktvermarktung, Hofladen)
//    Source: LGV Art. 14 (Primaerproduktion), HyV, kantonale Praxis
// ---------------------------------------------------------------------------

interface DirectSalesRule {
  product_type: string;
  rule: string;
  exemptions: string;
  conditions: string;
}

const directSalesRules: DirectSalesRule[] = [
  {
    product_type: 'Milch (Rohmilch ab Hof)',
    rule: 'Abgabe von Rohmilch (Vorzugsmilch) direkt ab Hof an Endverbraucher ist erlaubt. Kein Zwischenhandel. Nicht ueber Detailhandel.',
    exemptions: 'Keine BLV-Bewilligung noetig fuer Ab-Hof-Abgabe. Kantonale Registrierung genuegt.',
    conditions: 'Hinweisschild "Rohmilch — vor dem Verzehr abkochen" obligatorisch. Kuehlung unter 8C ab Melken. Keimzahl max. 50000 KBE/ml. Zellzahl max. 350000/ml. Keine pathogenen Keime. Milchpruefung gemaess MiPV.',
  },
  {
    product_type: 'Eier (ab Hof)',
    rule: 'Eier duerfen ab Hof direkt an Endverbraucher abgegeben werden. Sortierung und Stempelung nur bei gewerbsmaessiger Packstelle noetig.',
    exemptions: 'Keine Eierpackstellen-Bewilligung bei Direktabgabe ab Hof.',
    conditions: 'Legedatum oder MHD angeben. Sauber und unbeschaedigt. Kuehlung ab 18 Tage nach Legedatum. Salmonellen-Monitoring bei >250 Legehennen (nationales Programm).',
  },
  {
    product_type: 'Gefluegel (Schlachtung auf dem Hof)',
    rule: 'Landwirte duerfen auf dem eigenen Hof Gefluegel schlachten und direkt an Endverbraucher abgeben — bis zu 50 Tiere pro Woche (Art. 14 LGV).',
    exemptions: 'Keine BLV-Schlachtbewilligung bis 50 Tiere/Woche. Keine amtliche Fleischkontrolle.',
    conditions: 'Max. 50 Tiere pro Woche. Nur Abgabe an Endverbraucher (nicht an Gastronomie oder Handel). Hygienische Schlachtung und Kuehlung auf 4C. Kantonale Registrierung Pflicht.',
  },
  {
    product_type: 'Fleisch (Schwein, Rind — Metzgete)',
    rule: 'Hofmetzgete (traditionelle Hausschlachtung) fuer Eigenverbrauch und Direktabgabe ist unter bestimmten Bedingungen moeglich.',
    exemptions: 'Bei Schlachtung auf dem Hof mit Abgabe an Endverbraucher: kantonale Regelung. Einige Kantone erlauben bis zu einer bestimmten Stueckzahl ohne BLV-Bewilligung.',
    conditions: 'Meldung ans kantonale Veterinäramt. Betaeubungspflicht (Bolzenschuss oder elektro). Fleischkontrolle bei gewerbsmaessiger Abgabe. Kuehlkette einhalten. Einige Kantone (z.B. BE, LU) erlauben traditionelle Metzgete mit vereinfachter Kontrolle.',
  },
  {
    product_type: 'Kaese (Hofkaeserei)',
    rule: 'Hofkaeserei mit Verarbeitung eigener Milch und Direktverkauf. Voll HACCP-pflichtig ab gewerbsmaessiger Verarbeitung.',
    exemptions: 'Kleine Mengen fuer Direktabgabe: vereinfachte Selbstkontrolle moeglich. AOC/AOP-Kaese: zusaetzliche Auflagen des Pflichtenhefts.',
    conditions: 'Milchqualitaet kontrollieren. Bei Rohmilchkaese: validierte Reifungsdauer. BLV-Bewilligung ab gewerbsmaessiger Verarbeitung. Kantonale Milchkontrolle.',
  },
  {
    product_type: 'Konfituere, Sirup, Doerrobst',
    rule: 'Herstellung und Direktverkauf von Konfituere, Sirup, Doerrobst, eingemachtes Gemuese ab Hofladen.',
    exemptions: 'Keine BLV-Bewilligung noetig (pflanzliche Produkte, kein tierisches Lebensmittel). Vereinfachte Selbstkontrolle.',
    conditions: 'Korrekte Etikettierung (Zutatenliste, MHD, Allergene, Nettofuellmenge). Hygienische Herstellung. Haltbarkeit validieren (pH, Zuckergehalt, Wasseraktivitaet). Kantonale Registrierung.',
  },
  {
    product_type: 'Honig',
    rule: 'Imker duerfen Honig direkt ab Hof, auf Maerkten und ueber Onlineshop an Endverbraucher abgeben.',
    exemptions: 'Vereinfachte Selbstkontrolle fuer Imker. Keine BLV-Bewilligung.',
    conditions: 'Etikettierung (Herkunftsland, Nettofuellmenge, Name/Adresse Imker, MHD). Wassergehalt max. 20% (Goldene Biene: max. 18.5%). Kein Erwaermen ueber 40C.',
  },
  {
    product_type: 'Wochenmarkt (allgemein)',
    rule: 'Verkauf auf Wochenmaerkten unterliegt den gleichen Lebensmittelrechtlichen Anforderungen wie stationaerer Verkauf. Kommunale Marktordnung zusaetzlich.',
    exemptions: 'Keine generellen Ausnahmen. Einzelne Kantone bieten Kurzzeit-Registrierungen fuer Marktfahrer.',
    conditions: 'Handwaschgelegenheit. Kuehlung fuer kuehlpflichtige Produkte (Thermotasche, Kuehlvitrine). Schutz vor Sonne, Staub, Insekten. Allergeninformation verfuegbar. Rueckverfolgbarkeit.',
  },
  {
    product_type: 'Spirituosen (Hofbrennerei)',
    rule: 'Hofbrennerei darf Obstbraende, Likoere und Spirituosen direkt ab Hof abgeben.',
    exemptions: 'Brennbewilligung der Eidg. Alkoholverwaltung (EAV) erforderlich — unabhaengig von Menge.',
    conditions: 'EAV-Konzession. Alkoholsteuer (Fiskalabgabe). Etikettierung (Alkoholgehalt % vol, Nettofuellmenge, Herkunft). Vorlauf sauber abtrennen (Methanol). Ab 18 Jahren.',
  },
];

const insertDirectSales = db.instance.prepare(
  `INSERT INTO direct_sales_rules (product_type, rule, exemptions, conditions, jurisdiction)
   VALUES (?, ?, ?, ?, 'CH')`
);

for (const ds of directSalesRules) {
  insertDirectSales.run(ds.product_type, ds.rule, ds.exemptions, ds.conditions);
}
console.log(`Inserted ${directSalesRules.length} direct sales rules`);

// ---------------------------------------------------------------------------
// 6. Origin protection — AOC/AOP and IGP
//    Source: GUB/GGA-Verordnung (SR 910.12), BLW Register
// ---------------------------------------------------------------------------

interface OriginProtection {
  product_name: string;
  protection_type: string;
  region: string;
  description: string;
}

const originProtectionData: OriginProtection[] = [
  // --- AOC/AOP (geschuetzte Ursprungsbezeichnung) ---
  {
    product_name: 'Le Gruyere',
    protection_type: 'AOP',
    region: 'Kantone FR, VD, NE, JU, BE (teilweise)',
    description: 'Halbhartkaese aus Rohmilch, mind. 5 Monate gereift (bis 18+ Monate fuer Reserve). Herstellung in Dorfkaeserei. Kupferkessel. Keine Silage-Fuetterung. AOP seit 2001. Jahrliche Produktion ca. 29000 Tonnen.',
  },
  {
    product_name: 'Emmentaler Switzerland',
    protection_type: 'AOP',
    region: 'Gesamte Schweiz (traditionelles Gebiet Emmental, Kt. BE)',
    description: 'Hartkaese aus Rohmilch mit charakteristischen Loechern. Mind. 4 Monate Reifung. Laibe 75-120 kg. AOP seit 2006. Herstellung in ca. 110 Kaesereien. Keine Silage.',
  },
  {
    product_name: 'Appenzeller',
    protection_type: 'AOP',
    region: 'Kantone AI, AR, SG (teilweise), TG (teilweise)',
    description: 'Halbhartkaese, gewuerzt mit geheimer Kraeutersulz. Mind. 3 Monate Reifung. Milde bis rezente Sorten. AOP-Anmeldung haengig (derzeit Markenname geschuetzt).',
  },
  {
    product_name: 'Sbrinz',
    protection_type: 'AOP',
    region: 'Kantone LU, OW, NW, SZ, ZG, BE (teilweise), AG (teilweise)',
    description: 'Extrahartkaeser aus Rohmilch, mind. 18 Monate Reifung. Aelteste Schweizer Kaesesorte (seit 16. Jahrhundert dokumentiert). Wird gebrochen oder gehobelt, nicht geschnitten. AOP seit 2002.',
  },
  {
    product_name: 'Vacherin Mont-d\'Or',
    protection_type: 'AOP',
    region: 'Vallee de Joux, Kanton VD',
    description: 'Saisonaler Weichkaese aus Rohmilch (Produktion September bis Maerz). Umguertet mit Fichtenrinde. Wird warm geloeffelt. AOP seit 2003. Circa 500 Tonnen jaehrlich.',
  },
  {
    product_name: 'Raclette du Valais',
    protection_type: 'AOP',
    region: 'Kanton VS (Wallis)',
    description: 'Raclette-Kaese aus Rohmilch, hergestellt im Wallis. Mind. 3 Monate Reifung. Traditionell am Feuer geschmolzen. AOP seit 2007. Unterscheidung von generischem "Raclette" (kein Herkunftsschutz).',
  },
  {
    product_name: 'Tete de Moine',
    protection_type: 'AOP',
    region: 'Berner Jura, Kanton BE (Amtsbezirke Moutier, Courtelary, La Neuveville) und Kanton JU',
    description: 'Halbhartkaese aus Rohmilch, wird mit der "Girolle" zu Rosetten geschabt. Mind. 2.5 Monate Reifung. AOP seit 2001. Ursprung im Kloster Bellelay (12. Jahrhundert).',
  },
  {
    product_name: 'Formaggio d\'alpe ticinese',
    protection_type: 'AOP',
    region: 'Kanton TI (Tessin) — Alpen oberhalb 900 m.ue.M.',
    description: 'Alpkaese aus Rohmilch, hergestellt auf Tessiner Alpen waehrend der Soemmerung (Juni-September). Halbhart bis hart. Mind. 60 Tage Reifung. AOP seit 2002.',
  },
  {
    product_name: 'L\'Etivaz',
    protection_type: 'AOP',
    region: 'Pays-d\'Enhaut, Kanton VD',
    description: 'Alpkaese aus Rohmilch, hergestellt auf Alpen im Pays-d\'Enhaut. Traditionelle Herstellung ueber Holzfeuer im Kupferkessel. Mind. 5.5 Monate Reifung. AOP seit 2000.',
  },
  {
    product_name: 'Berner Alpkaese / Berner Hobelkaese',
    protection_type: 'AOP',
    region: 'Berner Oberland, Kanton BE — Alpen',
    description: 'Hartkaese aus Rohmilch, hergestellt auf Berner Alpen. Hobelkaese: mind. 2 Jahre gereift, wird gehobelt. AOP seit 2001.',
  },
  {
    product_name: 'Vacherin Fribourgeois',
    protection_type: 'AOP',
    region: 'Kanton FR (Fribourg)',
    description: 'Halbhartkaese aus thermisierter oder Rohmilch. Hauptzutat der Freiburger Fondue-Mischung (moitie-moitie). Mind. 6 Wochen Reifung. AOP seit 2006.',
  },
  {
    product_name: 'Bloderkäse / Sauerkäse aus dem Glarnerland',
    protection_type: 'AOP',
    region: 'Kanton GL (Glarus)',
    description: 'Magerkäse aus entrahmter Milch, traditionell im Glarnerland hergestellt. Magerkaese mit charaketristischer Konsistenz. AOP seit 2011.',
  },

  // --- IGP (geschuetzte geografische Angabe) ---
  {
    product_name: 'Buendnerfleisch',
    protection_type: 'IGP',
    region: 'Kanton GR (Graubuenden)',
    description: 'Luftgetrocknetes Rindfleisch aus dem Buendnerland. Gewuerzt, gepresst und an der Buendner Luft getrocknet. Mind. 5 Wochen Trocknung. Gewichtsverlust mind. 40%. IGP seit 2000.',
  },
  {
    product_name: 'Walliser Trockenfleisch / Viande sechee du Valais',
    protection_type: 'IGP',
    region: 'Kanton VS (Wallis)',
    description: 'Luftgetrocknetes Rindfleisch aus dem Wallis. Aehnlich Buendnerfleisch, aber mit eigener Walliser Tradition. Trocknung im Walliser Klima. IGP seit 2014.',
  },
  {
    product_name: 'St. Galler Bratwurst / St. Galler Kalbsbratwurst',
    protection_type: 'IGP',
    region: 'Region St. Gallen, Nordostschweiz',
    description: 'Feine Brühwurst aus Kalb- und Schweinefleisch, frischer Milch. Wird ohne Senf gegessen (traditionell). Keine sichtbare Haut. IGP seit 2008.',
  },
  {
    product_name: 'Saucisson vaudois',
    protection_type: 'IGP',
    region: 'Kanton VD (Waadt)',
    description: 'Rohwurst aus Schweinefleisch, leicht gerauechert. Wird im Papier gekocht ("papet vaudois" mit Lauch). Traditionelles Waadtlaender Produkt. IGP seit 2003.',
  },
  {
    product_name: 'Longeole',
    protection_type: 'IGP',
    region: 'Kanton GE (Genf)',
    description: 'Genfer Rohwurst aus Schweinefleisch mit Fenchelsamen. Traditionell an der Escalade (Genfer Fest, 11. Dezember) gegessen. IGP seit 2009.',
  },
  {
    product_name: 'Zuger Kirschtorte',
    protection_type: 'IGP',
    region: 'Stadt und Region Zug',
    description: 'Biskuit-Torte mit Kirsch (Kirschwasser), Buttercreme und Zucker. Herstellung in der Region Zug. Kirschwasser aus einheimischen Kirschen. IGP seit 2009.',
  },
  {
    product_name: 'Walliser Roggenbrott / Pain de seigle du Valais',
    protection_type: 'AOP',
    region: 'Kanton VS (Wallis)',
    description: 'Roggenbrot aus mind. 90% Walliser Roggen. Traditionell in Gemeinschaftsbackoefen gebacken. Rund, dunkel, kompakt. AOP seit 2004.',
  },
  {
    product_name: 'Rheintaler Ribelmais',
    protection_type: 'AOP',
    region: 'Rheintal, Kantone SG, GR',
    description: 'Maisprodukt aus der alten Rheintaler Maissorte "Ribelmais". Wird als Griess, Mehl oder Brei verarbeitet. AOP seit 2000. Slow Food Arche des Geschmacks.',
  },
  {
    product_name: 'Damassine',
    protection_type: 'AOP',
    region: 'Kanton JU (Jura) und Berner Jura',
    description: 'Edelbrand aus der Damassine-Pflaume (Prunus domestica subsp. insititia), einer autochthonen Sorte des Juras. Bernsteinfarbig. AOP seit 2010.',
  },
  {
    product_name: 'Absinthe',
    protection_type: 'AOP',
    region: 'Val-de-Travers, Kanton NE',
    description: 'Absinth-Spirituose aus dem Val-de-Travers. Destillat aus Wermut, Anis, Fenchel. Rehabilitiert 2005 (zuvor 1910-2005 verboten). AOP seit 2014.',
  },
];

const insertOriginProtection = db.instance.prepare(
  `INSERT INTO origin_protection (product_name, protection_type, region, description, jurisdiction)
   VALUES (?, ?, ?, ?, 'CH')`
);

for (const op of originProtectionData) {
  insertOriginProtection.run(op.product_name, op.protection_type, op.region, op.description);
}
console.log(`Inserted ${originProtectionData.length} origin protection records`);

// ---------------------------------------------------------------------------
// 7. FTS5 search index — populate from all tables
// ---------------------------------------------------------------------------

// Clear existing FTS data
try { db.run('DELETE FROM search_index'); } catch { /* table might not exist yet */ }

interface FtsEntry {
  title: string;
  body: string;
  topic: string;
}

const ftsEntries: FtsEntry[] = [];

// Self-monitoring
for (const sm of selfMonitoringRequirements) {
  ftsEntries.push({
    title: `Selbstkontrolle — ${sm.business_type}`,
    body: `${sm.requirement} HACCP: ${sm.haccp_level}. Dokumentation: ${sm.documentation}. Rechtsgrundlage: ${sm.legal_basis}`,
    topic: 'selbstkontrolle',
  });
}

// Registration
for (const reg of registrationRequirements) {
  ftsEntries.push({
    title: `Registrierung — ${reg.business_type} (${reg.authority})`,
    body: `${reg.activity}: ${reg.requirement}`,
    topic: 'registrierung',
  });
}

// Labelling
for (const lr of labellingRules) {
  ftsEntries.push({
    title: `Etikettierung — ${lr.product_type}`,
    body: `Obligatorische Angaben: ${lr.mandatory_info}. Allergene: ${lr.allergen_rules}. Swissness: ${lr.swissness_rule}`,
    topic: 'etikettierung',
  });
}

// Temperature
for (const tr of temperatureRequirements) {
  ftsEntries.push({
    title: `Temperatur — ${tr.food_category}`,
    body: `Lagerung max. ${tr.max_temp_c}C, Transport ${tr.transport_temp_c !== null ? tr.transport_temp_c + 'C' : 'k.A.'}. ${tr.notes}`,
    topic: 'temperatur',
  });
}

// Direct sales
for (const ds of directSalesRules) {
  ftsEntries.push({
    title: `Direktvermarktung — ${ds.product_type}`,
    body: `${ds.rule} Ausnahmen: ${ds.exemptions}. Bedingungen: ${ds.conditions}`,
    topic: 'direktvermarktung',
  });
}

// Origin protection
for (const op of originProtectionData) {
  ftsEntries.push({
    title: `${op.protection_type} — ${op.product_name}`,
    body: `Region: ${op.region}. ${op.description}`,
    topic: 'ursprungsschutz',
  });
}

const insertFts = db.instance.prepare(
  `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, 'CH')`
);

for (const entry of ftsEntries) {
  insertFts.run(entry.title, entry.body, entry.topic);
}
console.log(`Inserted ${ftsEntries.length} FTS5 search index entries`);

// ---------------------------------------------------------------------------
// 8. Metadata
// ---------------------------------------------------------------------------

db.run(
  `INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)`,
  [now]
);
db.run(
  `INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('build_date', ?)`,
  [now]
);
db.run(
  `INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('schema_version', '1.0')`
);
db.run(
  `INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('mcp_name', 'Switzerland Food Safety MCP')`
);
db.run(
  `INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('jurisdiction', 'CH')`
);

// ---------------------------------------------------------------------------
// 9. Coverage JSON
// ---------------------------------------------------------------------------

const coverage = {
  server: 'ch-food-safety-mcp',
  jurisdiction: 'CH',
  version: '0.1.0',
  last_ingest: now,
  data: {
    self_monitoring_requirements: selfMonitoringRequirements.length,
    registration_requirements: registrationRequirements.length,
    labelling_rules: labellingRules.length,
    temperature_requirements: temperatureRequirements.length,
    direct_sales_rules: directSalesRules.length,
    origin_protection: originProtectionData.length,
    fts_entries: ftsEntries.length,
  },
  tools: 10,
  sources: [
    'Lebensmittelgesetz (LMG, SR 817.0)',
    'Hygieneverordnung (HyV)',
    'LGV (Lebensmittel- und Gebrauchsgegenstaendeverordnung)',
    'BLV Selbstkontrolle-Leitlinien',
    'AOC/AOP/IGP Register Schweiz',
    'Swissness-Gesetzgebung (MSchG)',
  ],
};

writeFileSync('data/coverage.json', JSON.stringify(coverage, null, 2) + '\n');
console.log('Wrote data/coverage.json');

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

db.close();

console.log('\nIngestion complete:');
console.log(`  Self-monitoring requirements: ${selfMonitoringRequirements.length}`);
console.log(`  Registration requirements:    ${registrationRequirements.length}`);
console.log(`  Labelling rules:              ${labellingRules.length}`);
console.log(`  Temperature requirements:     ${temperatureRequirements.length}`);
console.log(`  Direct sales rules:           ${directSalesRules.length}`);
console.log(`  Origin protection (AOC/IGP):  ${originProtectionData.length}`);
console.log(`  FTS5 index entries:           ${ftsEntries.length}`);
console.log(`  Date: ${now}`);
