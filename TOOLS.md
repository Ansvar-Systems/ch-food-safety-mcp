# Tools Reference

## Meta Tools

### `about`

Get server metadata: name, version, coverage, data sources, and links.

**Parameters:** None

**Returns:** Server name, version, jurisdiction list, data source names, tool count, homepage/repository links.

---

### `list_sources`

List all data sources with authority, URL, license, and freshness info.

**Parameters:** None

**Returns:** Array of data sources, each with `name`, `authority`, `official_url`, `retrieval_method`, `update_frequency`, `license`, `coverage`, `last_retrieved`.

---

### `check_data_freshness`

Check when data was last ingested, staleness status, and how to trigger a refresh.

**Parameters:** None

**Returns:** `status` (fresh/stale/unknown), `last_ingest`, `days_since_ingest`, `staleness_threshold_days`, `refresh_command`.

---

## Domain Tools

### `search_food_safety`

Full-text search across all Swiss food safety rules including HACCP, labelling, temperature, origin protection, and direct sales.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Free-text search query (German or English) |
| `topic` | string | No | Filter by topic: selbstkontrolle, registrierung, etikettierung, temperatur, direktvermarktung, ursprungsschutz |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |
| `limit` | number | No | Max results (default: 20, max: 50) |

**Example:** `{ "query": "HACCP Baeckerei" }`

---

### `get_self_monitoring_requirements`

Get Selbstkontrolle and HACCP requirements by business type. Based on LMG Art. 26 and HyV Art. 4-8.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `business_type` | string | Yes | Business type (e.g. Baeckerei, Metzgerei, Gastronomiebetrieb, Kaeserei, Hofladen) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** HACCP level, documentation requirements, and legal basis for the matched business type.

**Example:** `{ "business_type": "Kaeserei" }`

---

### `get_registration_requirements`

Get BLV vs. cantonal registration/authorisation requirements for food businesses. Shows which authority is responsible.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `business_type` | string | Yes | Business type (e.g. Schlachtbetrieb, Milchverarbeitung, Hofladen) |
| `activity` | string | No | Specific activity (e.g. Schlachtung, Zerlegung, Verarbeitung) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Authority (BLV or cantonal), requirement description, and applicable activities.

**Example:** `{ "business_type": "Schlachtbetrieb", "activity": "Zerlegung" }`

---

### `get_labelling_rules`

Get mandatory labelling rules, Swissness origin marking, and allergen declaration requirements per product type.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_type` | string | No | Product type (e.g. Milchprodukte, Fleisch, Backwaren, vorverpackt). Omit for all. |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Mandatory information fields, allergen rules, and Swissness rules per product type.

**Example:** `{ "product_type": "Milchprodukte" }`

---

### `get_temperature_requirements`

Get storage and transport temperature requirements per food category. Based on HyV Anhang.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `food_category` | string | No | Food category (e.g. Frischfleisch, Gefluegel, Milch, Tiefkuehlprodukte). Omit for all. |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Maximum storage temperature, transport temperature, and notes per food category.

**Example:** `{ "food_category": "Gefluegel" }`

---

### `search_direct_sales_rules`

Search rules for Direktvermarktung: Hofladen, Ab-Hof-Verkauf, Wochenmarkt, and farm-gate sales.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Free-text search query (e.g. Hofladen, Milch ab Hof, Wochenmarkt) |
| `product_type` | string | No | Filter by product type (e.g. Milch, Fleisch, Eier, Honig) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Rules, exemptions, and conditions for the matched direct sales scenarios.

**Example:** `{ "query": "Rohmilch ab Hof" }`

---

### `get_origin_protection`

Get AOC/AOP and IGP protected designations for Swiss food products.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_name` | string | No | Product name to search (e.g. Gruyere, Buendnerfleisch). Omit for full register. |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Protection type (AOP/AOC or IGP), region, and description. Grouped counts for AOP/AOC vs. IGP.

**Example:** `{ "product_name": "Gruyere" }`
