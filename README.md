# Switzerland Food Safety MCP

[![CI](https://github.com/Ansvar-Systems/ch-food-safety-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/ch-food-safety-mcp/actions/workflows/ci.yml)
[![GHCR](https://github.com/Ansvar-Systems/ch-food-safety-mcp/actions/workflows/ghcr-build.yml/badge.svg)](https://github.com/Ansvar-Systems/ch-food-safety-mcp/actions/workflows/ghcr-build.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Swiss food safety regulations via the [Model Context Protocol](https://modelcontextprotocol.io). Query Lebensmittelgesetz (LMG), Selbstkontrolle/HACCP requirements, labelling rules, Swissness origin marking, AOC/AOP/IGP protected designations, temperature requirements, and Direktvermarktung (direct sales) rules -- all from your AI assistant.

Part of [Ansvar Open Agriculture](https://ansvar.eu/open-agriculture).

## Why This Exists

Swiss food businesses must comply with the Lebensmittelgesetz (LMG, SR 817.0), the Hygieneverordnung (HyV), GHP guidelines from industry organisations, and cantonal enforcement rules. Requirements vary by business type (Baeckerei, Metzgerei, Kaeserei, Gastronomiebetrieb) and product category. The BLV publishes guidance across Fedlex, official circulars, and industry-specific GHP standards. This MCP server consolidates those requirements into a queryable database so AI assistants can give accurate, sourced answers about Swiss food safety obligations.

## Quick Start

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ch-food-safety": {
      "command": "npx",
      "args": ["-y", "@ansvar/ch-food-safety-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add ch-food-safety npx @ansvar/ch-food-safety-mcp
```

### Streamable HTTP (remote)

```
https://mcp.ansvar.eu/ch-food-safety/mcp
```

### Docker (self-hosted)

```bash
docker run -p 3000:3000 ghcr.io/ansvar-systems/ch-food-safety-mcp:latest
```

### npm (stdio)

```bash
npx @ansvar/ch-food-safety-mcp
```

## Example Queries

Ask your AI assistant:

- "Welche HACCP-Anforderungen gelten fuer eine Baeckerei?"
- "Braucht mein Hofladen eine BLV-Bewilligung oder reicht die kantonale Meldung?"
- "Welche Allergene muessen auf vorverpackten Lebensmitteln deklariert werden?"
- "Bei welcher Temperatur muss Frischfleisch gelagert werden?"
- "Ist Gruyere AOP oder IGP geschuetzt?"
- "Darf ich Rohmilch ab Hof verkaufen und welche Bedingungen gelten?"
- "What Swissness rules apply to food labelling?"

## Stats

| Metric | Value |
|--------|-------|
| Tools | 10 (3 meta + 7 domain) |
| Jurisdiction | CH |
| Data sources | LMG (SR 817.0), HyV, LGV, BLV guidelines, AOC/AOP/IGP Register, Swissness (MSchG) |
| License (data) | Swiss Federal Administration -- free reuse |
| License (code) | Apache-2.0 |
| Transport | stdio + Streamable HTTP |

## Tools

| Tool | Description |
|------|-------------|
| `about` | Server metadata and links |
| `list_sources` | Data sources with freshness info |
| `check_data_freshness` | Staleness status and refresh command |
| `search_food_safety` | FTS5 search across all food safety rules |
| `get_self_monitoring_requirements` | Selbstkontrolle/HACCP requirements by business type |
| `get_registration_requirements` | BLV vs. cantonal registration requirements |
| `get_labelling_rules` | Mandatory labelling, allergen, and Swissness rules |
| `get_temperature_requirements` | Storage and transport temperatures per food category |
| `search_direct_sales_rules` | Direktvermarktung rules (Hofladen, Ab-Hof, Wochenmarkt) |
| `get_origin_protection` | AOC/AOP and IGP protected designations |

See [TOOLS.md](TOOLS.md) for full parameter documentation.

## Security Scanning

This repository runs security checks on every push:

- **CodeQL** -- static analysis for JavaScript/TypeScript
- **Gitleaks** -- secret detection across full history
- **Dependency review** -- via Dependabot
- **Container scanning** -- via GHCR build pipeline

See [SECURITY.md](SECURITY.md) for reporting policy.

## Disclaimer

Dieses Tool stellt Referenzdaten ausschliesslich zu Informationszwecken bereit. Es ersetzt keine Rechtsberatung oder die Konsultation der zustaendigen kantonalen Lebensmittelkontrolle bzw. des BLV. Siehe [DISCLAIMER.md](DISCLAIMER.md).

This tool provides reference data for informational purposes only. Always consult the responsible cantonal food safety authority or BLV. See [DISCLAIMER.md](DISCLAIMER.md).

## Contributing

Issues and pull requests welcome. For security vulnerabilities, email security@ansvar.eu (do not open a public issue).

## License

Apache-2.0. Data sourced from Swiss Federal Administration publications under free reuse terms.
