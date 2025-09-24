import { z } from "zod";
import { httpGetCached as httpGet, qs } from "../core/http.js";
import type { ToolDef } from "../core/registry.js";

/**
 * Properties and chart-related MCP tools.
 * - properties.search / searchAdvanced / byIds / sample / lookup
 * - charts.priceHistogram
 */
export const propertiesTools: ToolDef[] = [
  {
    name: "properties.search",
    description:
      "Search properties via Pinecone-backed API. Returns listings and charts.",
    schema: { q: z.string(), topK: z.number().optional() },
    handler: async (args: any) => {
      const { q, topK = 50 } = args as { q: string; topK?: number };
      const data = await httpGet(`/api/properties${qs({ q, topK })}`);
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "properties.searchAdvanced",
    description: "Advanced search helper. Builds a textual query from filters.",
    schema: {
      city: z.string().optional(),
      zipcode: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      beds: z.number().optional(),
      baths: z.number().optional(),
      topK: z.number().optional(),
    },
    handler: async (args: any) => {
      const {
        city,
        zipcode,
        minPrice,
        maxPrice,
        beds,
        baths,
        topK = 100,
      } = args as any;
      const parts: string[] = [];
      if (city) parts.push(city);
      if (zipcode) parts.push(zipcode);
      if (beds) parts.push(`${beds} bed`);
      if (baths) parts.push(`${baths} bath`);
      if (minPrice || maxPrice)
        parts.push(`price ${minPrice ?? ""}-${maxPrice ?? ""}`);
      const q = parts.filter(Boolean).join(" ").trim() || "homes";
      const data = await httpGet(`/api/properties${qs({ q, topK })}`);
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "properties.byIds",
    description: "Fetch property metadata by Zillow IDs (ZPIDs).",
    schema: { ids: z.array(z.union([z.string(), z.number()])) },
    handler: async (args: any) => {
      const { ids } = args as { ids: Array<string | number> };
      const param = ids.map(String).join(",");
      const data = await httpGet(`/api/properties/by-ids${qs({ ids: param })}`);
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "properties.sample",
    description: "Return a small sample of properties for bootstrap (q=homes).",
    schema: { topK: z.number().optional() },
    handler: async (args: any) => {
      const { topK = 50 } = args as { topK?: number };
      const data = await httpGet(`/api/properties${qs({ q: "homes", topK })}`);
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "properties.lookup",
    description:
      "Lookup properties/ZPIDs by address/city/state/ZIP and optional beds/baths.",
    schema: {
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipcode: z.string().optional(),
      beds: z.number().optional(),
      baths: z.number().optional(),
      limit: z.number().optional(),
    },
    handler: async (args: any) => {
      const {
        address,
        city,
        state,
        zipcode,
        beds,
        baths,
        limit = 10,
      } = args as any;
      const data = await httpGet(
        `/api/properties/lookup${qs({ address, city, state, zipcode, beds, baths, limit })}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "charts.priceHistogram",
    description: "Fetch price distribution chart for a given query.",
    schema: { q: z.string(), topK: z.number().optional() },
    handler: async (args: any) => {
      const { q, topK = 500 } = args as { q: string; topK?: number };
      const data = await httpGet(`/api/properties${qs({ q, topK })}`);
      const chart = (data as any)?.charts?.priceDist ?? null;
      return { content: [{ type: "text", text: JSON.stringify({ chart }) }] };
    },
  },
];
