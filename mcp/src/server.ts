import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL =
  process.env.API_BASE_URL || "https://estatewise-backend.vercel.app";

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
  { name: "estatewise-mcp", version: "0.1.0" },
  {
    capabilities: {
      tools: {},
    },
  },
);

// properties.search
server.tool(
  "properties.search",
  "Search properties via Pinecone-backed API. Returns listings and charts.",
  { q: z.string(), topK: z.number().optional() },
  async ({ q, topK = 50 }) => {
    const data = await httpGet(
      `/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`,
    );
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// properties.searchAdvanced
server.tool(
  "properties.searchAdvanced",
  "Advanced search helper. Builds a textual query from filters.",
  {
    city: z.string().optional(),
    zipcode: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    beds: z.number().optional(),
    baths: z.number().optional(),
    topK: z.number().optional(),
  },
  async ({ city, zipcode, minPrice, maxPrice, beds, baths, topK = 100 }) => {
    const parts: string[] = [];
    if (city) parts.push(city);
    if (zipcode) parts.push(zipcode);
    if (beds) parts.push(`${beds} bed`);
    if (baths) parts.push(`${baths} bath`);
    if (minPrice || maxPrice)
      parts.push(`price ${minPrice ?? ""}-${maxPrice ?? ""}`);
    const q = parts.filter(Boolean).join(" ").trim() || "homes";
    const data = await httpGet(
      `/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`,
    );
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// properties.byIds
server.tool(
  "properties.byIds",
  "Fetch property metadata by Zillow IDs (ZPIDs).",
  { ids: z.array(z.union([z.string(), z.number()])) },
  async ({ ids }) => {
    const param = ids.map(String).join(",");
    const data = await httpGet(
      `/api/properties/by-ids?ids=${encodeURIComponent(param)}`,
    );
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// properties.sample
server.tool(
  "properties.sample",
  "Return a small sample of properties for bootstrap (q=homes).",
  { topK: z.number().optional() },
  async ({ topK = 50 }) => {
    const data = await httpGet(`/api/properties?q=homes&topK=${Number(topK)}`);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// charts.priceHistogram (extract from properties endpoint)
server.tool(
  "charts.priceHistogram",
  "Fetch price distribution chart for a given query.",
  { q: z.string(), topK: z.number().optional() },
  async ({ q, topK = 500 }) => {
    const data = await httpGet(
      `/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`,
    );
    const chart = data?.charts?.priceDist ?? null;
    return { content: [{ type: "text", text: JSON.stringify({ chart }) }] };
  },
);

// properties.lookup — find ZPIDs by partial address/city/state/zip and optional beds/baths
server.tool(
  "properties.lookup",
  "Lookup properties/ZPIDs by address/city/state/ZIP and optional beds/baths.",
  {
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipcode: z.string().optional(),
    beds: z.number().optional(),
    baths: z.number().optional(),
    limit: z.number().optional(),
  },
  async ({ address, city, state, zipcode, beds, baths, limit = 10 }) => {
    const qp = new URLSearchParams();
    if (address) qp.set("address", address);
    if (city) qp.set("city", city);
    if (state) qp.set("state", state);
    if (zipcode) qp.set("zipcode", zipcode);
    if (beds != null) qp.set("beds", String(beds));
    if (baths != null) qp.set("baths", String(baths));
    if (limit != null) qp.set("limit", String(limit));
    const data = await httpGet(`/api/properties/lookup?${qp.toString()}`);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// analytics.summarizeSearch — compute quick stats from a properties search
server.tool(
  "analytics.summarizeSearch",
  "Run a properties search and return quick stats (median price, sqft, $/sqft, beds, baths).",
  { q: z.string(), topK: z.number().optional() },
  async ({ q, topK = 200 }) => {
    const data = await httpGet(
      `/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`,
    );
    const items = Array.isArray(data?.results)
      ? data.results
      : data?.properties || [];
    const pickNum = (x: any) => (typeof x === "number" ? x : Number(x ?? NaN));
    const nums = {
      price: items
        .map((p: any) => pickNum(p.price))
        .filter((n: number) => !isNaN(n)),
      sqft: items
        .map((p: any) => pickNum(p.livingArea))
        .filter((n: number) => !isNaN(n)),
      beds: items
        .map((p: any) => pickNum(p.bedrooms))
        .filter((n: number) => !isNaN(n)),
      baths: items
        .map((p: any) => pickNum(p.bathrooms))
        .filter((n: number) => !isNaN(n)),
    } as const;
    const median = (arr: number[]) => {
      if (!arr.length) return null;
      const a = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(a.length / 2);
      return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
    };
    const medPrice = median(nums.price);
    const medSqft = median(nums.sqft);
    const medBeds = median(nums.beds);
    const medBaths = median(nums.baths);
    const medPpsf = medPrice && medSqft ? medPrice / medSqft : null;
    const summary = {
      count: items.length,
      medianPrice: medPrice,
      medianSqft: medSqft,
      medianBeds: medBeds,
      medianBaths: medBaths,
      medianPricePerSqft: medPpsf,
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ summary, sample: items.slice(0, 10) }),
        },
      ],
    };
  },
);

// analytics.groupByZip — counts and medians by zipcode for a search
server.tool(
  "analytics.groupByZip",
  "Group a search by ZIP code with counts and median price.",
  { q: z.string(), topK: z.number().optional() },
  async ({ q, topK = 200 }) => {
    const data = await httpGet(
      `/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`,
    );
    const items = Array.isArray(data?.results)
      ? data.results
      : data?.properties || [];
    const byZip: Record<string, number[]> = {};
    for (const p of items) {
      const zip = String(p.zipcode || p.zip || "?");
      const price = Number(p.price ?? NaN);
      if (!isNaN(price)) {
        if (!byZip[zip]) byZip[zip] = [];
        byZip[zip].push(price);
      }
    }
    const median = (arr: number[]) => {
      if (!arr.length) return null;
      const a = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(a.length / 2);
      return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
    };
    const groups = Object.entries(byZip).map(([zip, prices]) => ({
      zip,
      count: prices.length,
      medianPrice: median(prices),
    }));
    return { content: [{ type: "text", text: JSON.stringify({ groups }) }] };
  },
);

// graph.comparePairs — explain pairwise relations for a small set of zpids
server.tool(
  "graph.comparePairs",
  "Explain relationships for up to 4 pairs derived from provided ZPIDs.",
  { zpids: z.array(z.number()) },
  async ({ zpids }) => {
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < zpids.length - 1 && pairs.length < 4; i++) {
      pairs.push([zpids[i], zpids[i + 1]]);
    }
    const out: any[] = [];
    for (const [from, to] of pairs) {
      try {
        const data = await httpGet(`/api/graph/explain?from=${from}&to=${to}`);
        out.push({ from, to, data });
      } catch (e: any) {
        out.push({ from, to, error: e?.message || String(e) });
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ pairs: out }) }],
    };
  },
);

// analytics.distributions — quartiles and histograms for price and sqft
server.tool(
  "analytics.distributions",
  "Compute quartiles and histogram buckets for price and living area.",
  {
    q: z.string(),
    topK: z.number().optional(),
    buckets: z.number().optional(),
  },
  async ({ q, topK = 500, buckets = 10 }) => {
    const data = await httpGet(
      `/api/properties?q=${encodeURIComponent(q)}&topK=${Number(topK)}`,
    );
    const items = Array.isArray(data?.results)
      ? data.results
      : data?.properties || [];
    const pick = (k: string) =>
      items
        .map((p: any) => Number(p?.[k] ?? NaN))
        .filter((n: number) => !isNaN(n));
    const price = pick("price");
    const sqft = pick("livingArea");
    const quantiles = (arr: number[]) => {
      if (!arr.length) return null;
      const a = [...arr].sort((a, b) => a - b);
      const q = (p: number) =>
        a[Math.min(a.length - 1, Math.max(0, Math.floor((a.length - 1) * p)))];
      return {
        q0: a[0],
        q1: q(0.25),
        q2: q(0.5),
        q3: q(0.75),
        q4: a[a.length - 1],
      };
    };
    const histogram = (arr: number[]) => {
      if (!arr.length) return [];
      const min = Math.min(...arr),
        max = Math.max(...arr);
      const step = (max - min) / buckets || 1;
      const edges = Array.from(
        { length: buckets + 1 },
        (_, i) => min + i * step,
      );
      const counts = Array.from({ length: buckets }, () => 0);
      for (const v of arr) {
        const idx = Math.min(
          buckets - 1,
          Math.max(0, Math.floor((v - min) / step)),
        );
        counts[idx]++;
      }
      return edges
        .slice(0, -1)
        .map((start, i) => ({ start, end: edges[i + 1], count: counts[i] }));
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            price: { quantiles: quantiles(price), histogram: histogram(price) },
            sqft: { quantiles: quantiles(sqft), histogram: histogram(sqft) },
          }),
        },
      ],
    };
  },
);

// finance.schedule — first N months of amortization schedule
server.tool(
  "finance.schedule",
  "Return the first N months of the amortization schedule.",
  {
    price: z.number(),
    downPct: z.number().default(20),
    apr: z.number().default(6.5),
    years: z.number().default(30),
    months: z.number().default(12),
  },
  async ({ price, downPct = 20, apr = 6.5, years = 30, months = 12 }) => {
    const loan = price * (1 - downPct / 100);
    const r = apr / 100 / 12;
    const n = years * 12;
    const pmt = r
      ? (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      : loan / n;
    const rows = [] as Array<{
      month: number;
      interest: number;
      principal: number;
      balance: number;
    }>;
    let bal = loan;
    for (let m = 1; m <= Math.max(1, Math.min(months, n)); m++) {
      const interest = bal * r;
      const principal = pmt - interest;
      bal = Math.max(0, bal - principal);
      rows.push({ month: m, interest, principal, balance: bal });
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ payment: pmt, schedule: rows }),
        },
      ],
    };
  },
);

// graph.pathMatrix — explain paths for all adjacent pairs in given ZPIDs
server.tool(
  "graph.pathMatrix",
  "Explain paths for adjacent pairs across provided ZPIDs (limited).",
  { zpids: z.array(z.number()), limitPairs: z.number().optional() },
  async ({ zpids, limitPairs = 6 }) => {
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < zpids.length - 1 && pairs.length < limitPairs; i++) {
      pairs.push([zpids[i], zpids[i + 1]]);
    }
    const out: any[] = [];
    for (const [from, to] of pairs) {
      try {
        const data = await httpGet(`/api/graph/explain?from=${from}&to=${to}`);
        out.push({ from, to, data });
      } catch (e: any) {
        out.push({ from, to, error: e?.message || String(e) });
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ pairs: out }) }],
    };
  },
);

// graph.similar
server.tool(
  "graph.similar",
  "Graph-based similar properties for a given ZPID. Reasons included.",
  { zpid: z.number(), limit: z.number().optional() },
  async ({ zpid, limit = 10 }) => {
    const data = await httpGet(
      `/api/graph/similar/${Number(zpid)}?limit=${Number(limit)}`,
    );
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// graph.explain
server.tool(
  "graph.explain",
  "Explain the shortest path between two properties (ZIP/Neighborhood/Similarity).",
  { from: z.number(), to: z.number() },
  async ({ from, to }) => {
    const data = await httpGet(
      `/api/graph/explain?from=${Number(from)}&to=${Number(to)}`,
    );
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// graph.neighborhood
server.tool(
  "graph.neighborhood",
  "Neighborhood stats and sample properties.",
  { name: z.string(), limit: z.number().optional() },
  async ({ name, limit = 50 }) => {
    const data = await httpGet(
      `/api/graph/neighborhood/${encodeURIComponent(name)}?limit=${Number(limit)}`,
    );
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// graph.similarityBatch
server.tool(
  "graph.similarityBatch",
  "Run graph.similar for multiple ZPIDs and merge results.",
  { zpids: z.array(z.number()), limit: z.number().optional() },
  async ({ zpids, limit = 5 }) => {
    const all = [] as any[];
    for (const zpid of zpids.slice(0, 10)) {
      try {
        const data = await httpGet(
          `/api/graph/similar/${Number(zpid)}?limit=${Number(limit)}`,
        );
        all.push({ zpid, data });
      } catch (e: any) {
        all.push({ zpid, error: e?.message || String(e) });
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ results: all }) }],
    };
  },
);

// map.linkForZpids (utility)
server.tool(
  "map.linkForZpids",
  "Return a deep-link to the EstateWise map page for given ZPIDs.",
  { ids: z.array(z.union([z.string(), z.number()])) },
  async ({ ids }) => {
    const qp = new URLSearchParams();
    qp.set("zpids", ids.map(String).join(","));
    const url = `${process.env.FRONTEND_BASE_URL || "https://estatewise.vercel.app"}/map?${qp.toString()}`;
    return { content: [{ type: "text", text: url }] };
  },
);

// map.buildLinkByQuery
server.tool(
  "map.buildLinkByQuery",
  "Return a deep-link to the map page for a given text query.",
  { q: z.string() },
  async ({ q }) => {
    const qp = new URLSearchParams();
    qp.set("q", q);
    const url = `${process.env.FRONTEND_BASE_URL || "https://estatewise.vercel.app"}/map?${qp.toString()}`;
    return { content: [{ type: "text", text: url }] };
  },
);

// util.extractZpids
server.tool(
  "util.extractZpids",
  "Extract ZPIDs from free text (Zillow URLs or raw ids).",
  { text: z.string() },
  async ({ text }) => {
    const re = /(\d+)_zpid|\b(\d{5,})\b/g;
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)))
      out.push(m[2] || (m[1]?.replace("_zpid", "") ?? ""));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            zpids: Array.from(new Set(out.filter(Boolean))),
          }),
        },
      ],
    };
  },
);

// util.zillowLink
server.tool(
  "util.zillowLink",
  "Build Zillow home link from ZPID.",
  { zpid: z.number() },
  async ({ zpid }) => {
    return {
      content: [
        {
          type: "text",
          text: `https://www.zillow.com/homedetails/${Number(zpid)}_zpid/`,
        },
      ],
    };
  },
);

// util.summarize
server.tool(
  "util.summarize",
  "Return the first N characters of text (default 400).",
  { text: z.string(), maxLen: z.number().optional() },
  async ({ text, maxLen = 400 }) => {
    const trimmed = text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
    return { content: [{ type: "text", text: trimmed }] };
  },
);

// util.parseGoal — extract simple filters from a free-text goal
server.tool(
  "util.parseGoal",
  "Parse a free-text goal into coarse filters: zpids, zip, city/state, beds, baths, price, apr, years.",
  { text: z.string() },
  async ({ text }) => {
    const zpidMatches = Array.from(
      text.matchAll(/(\d+)_zpid|\bzpid[:#]?\s*(\d{5,})/gi),
    )
      .map((m) => Number(m[2] || m[1]?.replace("_zpid", "") || 0))
      .filter(Boolean);
    const zip = (text.match(/\b(\d{5})\b/) || [])[1] || null;
    const cityState = (text.match(/([A-Za-z][\w\s]+),\s*([A-Za-z]{2})/) ||
      []) as any;
    const city = cityState[1]?.trim() || null;
    const state = cityState[2]?.toUpperCase() || null;
    const beds = (text.match(/(\d+)\s*(?:bed|bd|beds)\b/i) || [])[1] || null;
    const baths = (text.match(/(\d+)\s*(?:bath|ba|baths)\b/i) || [])[1] || null;
    const priceRaw = (text.match(/\$?([\d.,]+)\s*(k|m)?/i) || []) as any;
    let price = null as null | number;
    if (priceRaw[1]) {
      const base = Number(priceRaw[1].replace(/[,]/g, ""));
      const mult =
        priceRaw[2]?.toLowerCase() === "m"
          ? 1_000_000
          : priceRaw[2]?.toLowerCase() === "k"
            ? 1_000
            : 1;
      if (!isNaN(base)) price = base * mult;
    }
    const aprMatch = text.match(/(\d+(?:\.\d+)?)%/);
    const apr = aprMatch ? Number(aprMatch[1]) : null;
    const yearsMatch = text.match(/\b(15|30)\b/);
    const years = yearsMatch ? Number(yearsMatch[1]) : null;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            zpids: Array.from(new Set(zpidMatches)),
            zipcode: zip,
            city,
            state,
            beds: beds ? Number(beds) : null,
            baths: baths ? Number(baths) : null,
            price,
            apr,
            years,
          }),
        },
      ],
    };
  },
);

// finance.mortgage
server.tool(
  "finance.mortgage",
  "Compute mortgage breakdown (principal+interest, taxes, insurance, HOA).",
  {
    price: z.number(),
    downPct: z.number().default(20),
    apr: z.number().default(6.5),
    years: z.number().default(30),
    taxRatePct: z.number().default(1.0),
    insMonthly: z.number().default(120),
    hoaMonthly: z.number().default(0),
  },
  async ({
    price,
    downPct,
    apr,
    years,
    taxRatePct,
    insMonthly,
    hoaMonthly,
  }) => {
    const loan = price * (1 - downPct / 100);
    const r = apr / 100 / 12;
    const n = years * 12;
    const pAndI = r
      ? (loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
      : loan / n;
    const taxes = (price * (taxRatePct / 100)) / 12;
    const total = pAndI + taxes + insMonthly + hoaMonthly;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            loan,
            pAndI,
            taxes,
            insMonthly,
            hoaMonthly,
            total,
          }),
        },
      ],
    };
  },
);

// finance.affordability — estimate max price from monthly budget or income+DTI
server.tool(
  "finance.affordability",
  "Estimate max home price from monthly budget or income+DTI (includes taxes/insurance/HOA).",
  {
    monthlyBudget: z.number().optional(),
    annualIncome: z.number().optional(),
    maxDtiPct: z.number().optional().default(36),
    downPct: z.number().default(20),
    apr: z.number().default(6.5),
    years: z.number().default(30),
    taxRatePct: z.number().default(1.0),
    insMonthly: z.number().default(120),
    hoaMonthly: z.number().default(0),
  },
  async ({
    monthlyBudget,
    annualIncome,
    maxDtiPct = 36,
    downPct = 20,
    apr = 6.5,
    years = 30,
    taxRatePct = 1.0,
    insMonthly = 120,
    hoaMonthly = 0,
  }) => {
    const monthlyCap =
      monthlyBudget ??
      (annualIncome ? (annualIncome / 12) * (maxDtiPct / 100) : null);
    if (!monthlyCap) {
      throw new Error("Provide monthlyBudget or annualIncome");
    }
    // Solve for price such that pAndI + taxes + ins + hoa = monthlyCap
    const r = apr / 100 / 12;
    const n = years * 12;
    const fixed = insMonthly + hoaMonthly;
    // taxes = price * (taxRatePct/100) / 12
    // pAndI = A = loan * [ r (1+r)^n / ((1+r)^n - 1) ] with loan = price*(1-downPct/100)
    const k = r ? (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 1 / n;
    const loanFactor = 1 - downPct / 100; // loan = price * loanFactor
    // monthlyCap = price*loanFactor*k + price*(taxRatePct/100)/12 + fixed
    const price =
      (monthlyCap - fixed) / (loanFactor * k + taxRatePct / 100 / 12);
    const loan = price * loanFactor;
    const pAndI = loan * k;
    const taxes = (price * (taxRatePct / 100)) / 12;
    const total = pAndI + taxes + fixed;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            monthlyCap,
            price,
            loan,
            pAndI,
            taxes,
            insMonthly,
            hoaMonthly,
            total,
          }),
        },
      ],
    };
  },
);

// conversations.list (requires token)
server.tool(
  "conversations.list",
  "List conversations (requires bearer token).",
  { token: z.string() },
  async ({ token }) => {
    const res = await fetch(`${API_BASE_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

// conversations.search (requires token)
server.tool(
  "conversations.search",
  "Search conversations by query (requires bearer token).",
  { token: z.string(), q: z.string() },
  async ({ token, q }) => {
    const res = await fetch(
      `${API_BASE_URL}/api/conversations/search?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
);

const transport = new StdioServerTransport();
server.connect(transport).catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
