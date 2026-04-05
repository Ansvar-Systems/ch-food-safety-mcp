#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createDatabase } from './db.js';
import { handleAbout } from './tools/about.js';
import { handleListSources } from './tools/list-sources.js';
import { handleCheckFreshness } from './tools/check-freshness.js';
import { handleSearchFoodSafety } from './tools/search-food-safety.js';
import { handleGetSelfMonitoringRequirements } from './tools/get-self-monitoring-requirements.js';
import { handleGetRegistrationRequirements } from './tools/get-registration-requirements.js';
import { handleGetLabellingRules } from './tools/get-labelling-rules.js';
import { handleGetTemperatureRequirements } from './tools/get-temperature-requirements.js';
import { handleSearchDirectSalesRules } from './tools/search-direct-sales-rules.js';
import { handleGetOriginProtection } from './tools/get-origin-protection.js';

const SERVER_NAME = 'ch-food-safety-mcp';
const SERVER_VERSION = '0.1.0';

const TOOLS = [
  {
    name: 'about',
    description: 'Get server metadata: name, version, coverage, data sources, and links.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_sources',
    description: 'List all data sources with authority, URL, license, and freshness info.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'check_data_freshness',
    description: 'Check when data was last ingested, staleness status, and how to trigger a refresh.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_food_safety',
    description: 'Search Swiss food safety rules, HACCP requirements, labelling, temperature, and origin protection. Use for broad queries about Lebensmittelsicherheit.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Free-text search query (German or English)' },
        topic: { type: 'string', description: 'Filter by topic: selbstkontrolle, registrierung, etikettierung, temperatur, direktvermarktung, ursprungsschutz' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
        limit: { type: 'number', description: 'Max results (default: 20, max: 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_self_monitoring_requirements',
    description: 'Get Selbstkontrolle and HACCP requirements by business type (e.g. Baeckerei, Metzgerei, Gastronomiebetrieb, Kaeserei). Based on LMG and HyV.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_type: { type: 'string', description: 'Business type (e.g. Baeckerei, Metzgerei, Gastronomiebetrieb, Kaeserei, Hofladen)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['business_type'],
    },
  },
  {
    name: 'get_registration_requirements',
    description: 'Get BLV vs. cantonal registration/authorisation requirements for food businesses. Shows which authority is responsible.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_type: { type: 'string', description: 'Business type (e.g. Schlachtbetrieb, Milchverarbeitung, Hofladen)' },
        activity: { type: 'string', description: 'Specific activity (e.g. Schlachtung, Zerlegung, Verarbeitung)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['business_type'],
    },
  },
  {
    name: 'get_labelling_rules',
    description: 'Get mandatory labelling rules, Swissness origin marking, and allergen declaration requirements per product type.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        product_type: { type: 'string', description: 'Product type (e.g. Milchprodukte, Fleisch, Backwaren, vorverpackt). Omit for all.' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'get_temperature_requirements',
    description: 'Get storage and transport temperature requirements per food category. Based on HyV Anhang.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        food_category: { type: 'string', description: 'Food category (e.g. Frischfleisch, Gefluegel, Milch, Tiefkuehlprodukte). Omit for all.' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'search_direct_sales_rules',
    description: 'Search rules for Direktvermarktung: Hofladen, Ab-Hof-Verkauf, Wochenmarkt, and farm-gate sales.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Free-text search query (e.g. Hofladen, Milch ab Hof, Wochenmarkt)' },
        product_type: { type: 'string', description: 'Filter by product type (e.g. Milch, Fleisch, Eier, Honig)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_origin_protection',
    description: 'Get AOC/AOP and IGP protected designations for Swiss food products (e.g. Gruyere, Emmentaler, Buendnerfleisch).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        product_name: { type: 'string', description: 'Product name to search (e.g. Gruyere, Buendnerfleisch). Omit for full register.' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
];

const SearchFoodSafetySchema = z.object({
  query: z.string(),
  topic: z.string().optional(),
  jurisdiction: z.string().optional(),
  limit: z.number().optional(),
});

const SelfMonitoringSchema = z.object({
  business_type: z.string(),
  jurisdiction: z.string().optional(),
});

const RegistrationSchema = z.object({
  business_type: z.string(),
  activity: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const LabellingSchema = z.object({
  product_type: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const TemperatureSchema = z.object({
  food_category: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const DirectSalesSchema = z.object({
  query: z.string(),
  product_type: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const OriginProtectionSchema = z.object({
  product_name: z.string().optional(),
  jurisdiction: z.string().optional(),
});

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

const db = createDatabase();

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'about':
        return textResult(handleAbout());
      case 'list_sources':
        return textResult(handleListSources(db));
      case 'check_data_freshness':
        return textResult(handleCheckFreshness(db));
      case 'search_food_safety':
        return textResult(handleSearchFoodSafety(db, SearchFoodSafetySchema.parse(args)));
      case 'get_self_monitoring_requirements':
        return textResult(handleGetSelfMonitoringRequirements(db, SelfMonitoringSchema.parse(args)));
      case 'get_registration_requirements':
        return textResult(handleGetRegistrationRequirements(db, RegistrationSchema.parse(args)));
      case 'get_labelling_rules':
        return textResult(handleGetLabellingRules(db, LabellingSchema.parse(args)));
      case 'get_temperature_requirements':
        return textResult(handleGetTemperatureRequirements(db, TemperatureSchema.parse(args)));
      case 'search_direct_sales_rules':
        return textResult(handleSearchDirectSalesRules(db, DirectSalesSchema.parse(args)));
      case 'get_origin_protection':
        return textResult(handleGetOriginProtection(db, OriginProtectionSchema.parse(args)));
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : String(err));
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
