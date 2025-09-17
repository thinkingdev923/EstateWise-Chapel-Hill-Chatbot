import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE_URL = process.env.API_BASE_URL || 'https://estatewise-backend.vercel.app';

async function httpGet(path: string) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg += `: ${j.error}`;
    } catch {}
    throw new Error(`Request failed: ${msg}`);
  }
  return await res.json();
}

const server = new McpServer(
  { name: 'estatewise-mcp', version: '0.1.0' },
  {
    capabilities: {
      tools: {},
    },
  }
);

// properties.search
server.tool(
  'properties.search',
  'Search properties via Pinecone-backed API. Returns listings and charts.',
  { q: z.string(), topK: z.number().optional() },
  async ({ q, topK = 50 }) => {
    const data = await httpGet(`/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

// properties.searchAdvanced
server.tool(
  'properties.searchAdvanced',
  'Advanced search helper. Builds a textual query from filters.',
  { city: z.string().optional(), zipcode: z.string().optional(), minPrice: z.number().optional(), maxPrice: z.number().optional(), beds: z.number().optional(), baths: z.number().optional(), topK: z.number().optional() },
  async ({ city, zipcode, minPrice, maxPrice, beds, baths, topK = 100 }) => {
    const parts: string[] = [];
    if (city) parts.push(city);
    if (zipcode) parts.push(zipcode);
    if (beds) parts.push(`${beds} bed`);
    if (baths) parts.push(`${baths} bath`);
    if (minPrice || maxPrice) parts.push(`price ${minPrice ?? ''}-${maxPrice ?? ''}`);
    const q = parts.filter(Boolean).join(' ').trim() || 'homes';
    const data = await httpGet(`/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

// properties.byIds
server.tool(
  'properties.byIds',
  'Fetch property metadata by Zillow IDs (ZPIDs).',
  { ids: z.array(z.union([z.string(), z.number()])) },
  async ({ ids }) => {
    const param = ids.map(String).join(',');
    const data = await httpGet(`/api/properties/by-ids?ids=${encodeURIComponent(param)}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

// properties.sample
server.tool(
  'properties.sample',
  'Return a small sample of properties for bootstrap (q=homes).',
  { topK: z.number().optional() },
  async ({ topK = 50 }) => {
    const data = await httpGet(`/api/properties?q=homes&topK=${Number(topK)}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

// charts.priceHistogram (extract from properties endpoint)
server.tool(
  'charts.priceHistogram',
  'Fetch price distribution chart for a given query.',
  { q: z.string(), topK: z.number().optional() },
  async ({ q, topK = 500 }) => {
    const data = await httpGet(`/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`);
    const chart = data?.charts?.priceDist ?? null;
    return { content: [{ type: 'text', text: JSON.stringify({ chart }) }] };
  }
);

// graph.similar
server.tool(
  'graph.similar',
  'Graph-based similar properties for a given ZPID. Reasons included.',
  { zpid: z.number(), limit: z.number().optional() },
  async ({ zpid, limit = 10 }) => {
    const data = await httpGet(`/api/graph/similar/${Number(zpid)}?limit=${Number(limit)}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

// graph.explain
server.tool(
  'graph.explain',
  'Explain the shortest path between two properties (ZIP/Neighborhood/Similarity).',
  { from: z.number(), to: z.number() },
  async ({ from, to }) => {
    const data = await httpGet(`/api/graph/explain?from=${Number(from)}&to=${Number(to)}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

// graph.neighborhood
server.tool(
  'graph.neighborhood',
  'Neighborhood stats and sample properties.',
  { name: z.string(), limit: z.number().optional() },
  async ({ name, limit = 50 }) => {
    const data = await httpGet(`/api/graph/neighborhood/${encodeURIComponent(name)}?limit=${Number(limit)}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

// graph.similarityBatch
server.tool(
  'graph.similarityBatch',
  'Run graph.similar for multiple ZPIDs and merge results.',
  { zpids: z.array(z.number()), limit: z.number().optional() },
  async ({ zpids, limit = 5 }) => {
    const all = [] as any[];
    for (const zpid of zpids.slice(0, 10)) {
      try {
        const data = await httpGet(`/api/graph/similar/${Number(zpid)}?limit=${Number(limit)}`);
        all.push({ zpid, data });
      } catch (e: any) {
        all.push({ zpid, error: e?.message || String(e) });
      }
    }
    return { content: [{ type: 'text', text: JSON.stringify({ results: all }) }] };
  }
);

// map.linkForZpids (utility)
server.tool(
  'map.linkForZpids',
  'Return a deep-link to the EstateWise map page for given ZPIDs.',
  { ids: z.array(z.union([z.string(), z.number()])) },
  async ({ ids }) => {
    const qp = new URLSearchParams();
    qp.set('zpids', ids.map(String).join(','));
    const url = `${process.env.FRONTEND_BASE_URL || 'https://estatewise.vercel.app'}/map?${qp.toString()}`;
    return { content: [{ type: 'text', text: url }] };
  }
);

// map.buildLinkByQuery
server.tool(
  'map.buildLinkByQuery',
  'Return a deep-link to the map page for a given text query.',
  { q: z.string() },
  async ({ q }) => {
    const qp = new URLSearchParams();
    qp.set('q', q);
    const url = `${process.env.FRONTEND_BASE_URL || 'https://estatewise.vercel.app'}/map?${qp.toString()}`;
    return { content: [{ type: 'text', text: url }] };
  }
);

// util.extractZpids
server.tool(
  'util.extractZpids',
  'Extract ZPIDs from free text (Zillow URLs or raw ids).',
  { text: z.string() },
  async ({ text }) => {
    const re = /(\d+)_zpid|\b(\d{5,})\b/g;
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) out.push(m[2] || (m[1]?.replace('_zpid', '') ?? ''));
    return { content: [{ type: 'text', text: JSON.stringify({ zpids: Array.from(new Set(out.filter(Boolean))) }) }] };
  }
);

// util.zillowLink
server.tool(
  'util.zillowLink',
  'Build Zillow home link from ZPID.',
  { zpid: z.number() },
  async ({ zpid }) => {
    return { content: [{ type: 'text', text: `https://www.zillow.com/homedetails/${Number(zpid)}_zpid/` }] };
  }
);

// util.summarize
server.tool(
  'util.summarize',
  'Return the first N characters of text (default 400).',
  { text: z.string(), maxLen: z.number().optional() },
  async ({ text, maxLen = 400 }) => {
    const trimmed = text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
    return { content: [{ type: 'text', text: trimmed }] };
  }
);

// finance.mortgage
server.tool(
  'finance.mortgage',
  'Compute mortgage breakdown (principal+interest, taxes, insurance, HOA).',
  {
    price: z.number(),
    downPct: z.number().default(20),
    apr: z.number().default(6.5),
    years: z.number().default(30),
    taxRatePct: z.number().default(1.0),
    insMonthly: z.number().default(120),
    hoaMonthly: z.number().default(0),
  },
  async ({ price, downPct, apr, years, taxRatePct, insMonthly, hoaMonthly }) => {
    const loan = price * (1 - downPct / 100);
    const r = apr / 100 / 12;
    const n = years * 12;
    const pAndI = r ? loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loan / n;
    const taxes = (price * (taxRatePct / 100)) / 12;
    const total = pAndI + taxes + insMonthly + hoaMonthly;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ loan, pAndI, taxes, insMonthly, hoaMonthly, total })
      }],
    };
  }
);

// conversations.list (requires token)
server.tool(
  'conversations.list',
  'List conversations (requires bearer token).',
  { token: z.string() },
  async ({ token }) => {
    const res = await fetch(`${API_BASE_URL}/api/conversations`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

// conversations.search (requires token)
server.tool(
  'conversations.search',
  'Search conversations by query (requires bearer token).',
  { token: z.string(), q: z.string() },
  async ({ token, q }) => {
    const res = await fetch(`${API_BASE_URL}/api/conversations/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

const transport = new StdioServerTransport();
server.connect(transport).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
