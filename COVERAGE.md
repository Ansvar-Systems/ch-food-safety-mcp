# Coverage

## What Is Included

- **Selbstkontrolle / HACCP** (10 entries): Gastronomiebetrieb, Baeckerei/Konditorei, Metzgerei/Fleischverarbeitung, Kaeserei/Milchverarbeitung, Hofladen, Lebensmittelhandel (Grosshandel/Einzelhandel), Catering/Gemeinschaftsgastronomie, Getraenkeherstellung, Fischverarbeitung, Lebensmitteltransport
- **Registrierung / Bewilligung** (12 entries): BLV-Bewilligungspflicht (Schlachtbetrieb, Milchverarbeitung, Export), kantonale Meldepflicht (Gastronomiebetrieb, Hofladen, Baeckerei), Taetigkeitsspezifische Anforderungen (Schlachtung, Zerlegung, Verarbeitung)
- **Etikettierung / Labelling** (8 entries): Vorverpackte Lebensmittel (Pflichtangaben), Allergendeklaration (14 Allergene), Naehrwertdeklaration, Herkunftsangabe, Swissness-Regeln (80% Rohstoff, 100% Milch), produktspezifische Regeln (Milchprodukte, Fleisch, Backwaren)
- **Temperaturvorschriften** (12 entries): Frischfleisch, Gefluegel, Hackfleisch, Milch, Milchprodukte, Fisch/Meeresfruechte, Tiefkuehlprodukte, Speiseeis, zubereitete Speisen (Warmhaltung), Eier, Konditoreiwaren, Gemuese/Salat (geschnitten)
- **Direktvermarktung** (9 entries): Rohmilch ab Hof, Fleisch (Hofladen), Eier, Honig, Obst/Gemuese, Kaese, Backwaren, Konfitueren/Eingemachtes, Wochenmarkt-Regeln
- **Ursprungsschutz AOC/AOP/IGP** (22 entries): AOP-geschuetzte Produkte (Gruyere, Emmentaler, Vacherin Mont-d'Or, Sbrinz, L'Etivaz, Tete de Moine, Raclette du Valais, etc.), IGP-geschuetzte Produkte (Buendnerfleisch, St. Galler Bratwurst, Walliser Trockenfleisch, Saucisson vaudois, etc.)
- **FTS5-Suchindex** (73 entries): Alle Themen durchsuchbar (deutsch)

## Jurisdictions

| Code | Country | Status |
|------|---------|--------|
| CH | Switzerland | Supported |

## Key Regulations Referenced

| Regulation | Coverage |
|------------|----------|
| Lebensmittelgesetz (LMG, SR 817.0) | Framework: Selbstkontrolle (Art. 26), Rueckverfolgbarkeit (Art. 28), Registrierung/Bewilligung (Art. 12-15) |
| Hygieneverordnung (HyV, SR 817.024.1) | HACCP (Art. 4-8), Temperaturvorschriften (Anhang), GHP-Anforderungen, mikrobiologische Kriterien |
| Lebensmittel- und Gebrauchsgegenstaendeverordnung (LGV, SR 817.02) | Produktspezifische Regeln, Etikettierung, Allergendeklaration, Naehrwertdeklaration |
| GUB/GGA-Verordnung (SR 910.12) | AOC/AOP und IGP Schutz, Registrierungsverfahren |
| Swissness-Gesetzgebung (MSchG Revision 2017) | Herkunftsangaben: 80% Rohstoff fuer Lebensmittel, 100% Milch, Schweizer Kreuz |
| Verordnung ueber Hygiene (VHyS) | Schlachthof-Hygiene, Fleischkontrolle |
| GHP-Leitlinien (Branchenorganisationen) | GastroSuisse, SBC (Baecker-Confiseure), SFF (Fleischfachverband), Fromarte (Kaesereien), etc. |

## What Is NOT Included

- **Kantonsspezifische Abweichungen** -- kantonale Lebensmittelkontrolle hat eigene Durchfuehrungsbestimmungen (26 Kantone)
- **Veterinaerangelegenheiten** -- Tiergesundheit und Tierschutz (TSchG) separat geregelt
- **Trinkwasserverordnung (TBDV)** -- nur am Rande erwaehnt
- **Einfuhr-/Ausfuhrvorschriften** -- Grenzkontrollen und phytosanitaere Massnahmen
- **Novel Food** -- neuartige Lebensmittel nach EU-Verordnung 2015/2283 (via Cassis-de-Dijon-Prinzip)
- **Gentechnikgesetzgebung** -- GTG, Kennzeichnung von GVO-Produkten separat
- **Echtzeitdaten** -- Referenzinformationen, keine Live-Rueckrufmeldungen oder Kontrollresultate
- **Bestrahlung, Kontaminanten, Rueckstaende** -- spezifische Verordnungen (FIV, VPRH) nicht vollstaendig abgedeckt

## Known Gaps

1. Data based on published federal law and BLV guidance -- accuracy checked against Fedlex and BLV publications
2. FTS5 search quality varies depending on query phrasing -- specific terms produce better results
3. Cantonal enforcement details not included -- contact your kantonal Lebensmittelkontrolle for specific requirements
4. AOC/AOP/IGP register is a snapshot -- new registrations may not appear until next ingestion

## Data Freshness

Run `check_data_freshness` to see when data was last updated. The ingestion pipeline runs monthly; manual triggers available via `gh workflow run ingest.yml`.
