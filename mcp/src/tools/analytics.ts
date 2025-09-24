import { z } from "zod";
import { httpGetCached as httpGet, qs } from "../core/http.js";
import type { ToolDef } from "../core/registry.js";

/** Analytics tools for summarizing and bucketing search results. */
export const analyticsTools: ToolDef[] = [
  {
    name: "analytics.summarizeSearch",
    description:
      "Run a properties search and return quick stats (median price, sqft, $/sqft, beds, baths).",
    schema: { q: z.string(), topK: z.number().optional() },
    handler: async (args: any) => {
      const { q, topK = 200 } = args as { q: string; topK?: number };
      const data = await httpGet(`/api/properties${qs({ q, topK })}`);
      const items = Array.isArray((data as any)?.results)
        ? (data as any).results
        : (data as any)?.properties || [];
      const pickNum = (x: any) =>
        typeof x === "number" ? x : Number(x ?? NaN);
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
  },
  {
    name: "analytics.groupByZip",
    description: "Group a search by ZIP code with counts and median price.",
    schema: { q: z.string(), topK: z.number().optional() },
    handler: async (args: any) => {
      const { q, topK = 200 } = args as { q: string; topK?: number };
      const data = await httpGet(`/api/properties${qs({ q, topK })}`);
      const items = Array.isArray((data as any)?.results)
        ? (data as any).results
        : (data as any)?.properties || [];
      const byZip: Record<string, number[]> = {};
      for (const p of items) {
        const zip = String((p as any).zipcode || (p as any).zip || "?");
        const price = Number((p as any).price ?? NaN);
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
  },
  {
    name: "analytics.distributions",
    description:
      "Compute quartiles and histogram buckets for price and living area.",
    schema: {
      q: z.string(),
      topK: z.number().optional(),
      buckets: z.number().optional(),
    },
    handler: async (args: any) => {
      const {
        q,
        topK = 500,
        buckets = 10,
      } = args as { q: string; topK?: number; buckets?: number };
      const data = await httpGet(`/api/properties${qs({ q, topK })}`);
      const items = Array.isArray((data as any)?.results)
        ? (data as any).results
        : (data as any)?.properties || [];
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
          a[
            Math.min(a.length - 1, Math.max(0, Math.floor((a.length - 1) * p)))
          ];
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
              price: {
                quantiles: quantiles(price),
                histogram: histogram(price),
              },
              sqft: { quantiles: quantiles(sqft), histogram: histogram(sqft) },
            }),
          },
        ],
      };
    },
  },
  {
    name: "analytics.pricePerSqft",
    description:
      "Compute price-per-sqft distribution and summary for a search.",
    schema: {
      q: z.string(),
      topK: z.number().optional(),
      buckets: z.number().optional(),
    },
    handler: async (args: any) => {
      const {
        q,
        topK = 300,
        buckets = 10,
      } = args as { q: string; topK?: number; buckets?: number };
      const data = await httpGet(`/api/properties${qs({ q, topK })}`);
      const items = Array.isArray((data as any)?.results)
        ? (data as any).results
        : (data as any)?.properties || [];
      const ppsf = (items as any[])
        .map((p: any) => ({
          price: Number(p?.price ?? NaN),
          sqft: Number(p?.livingArea ?? NaN),
        }))
        .filter(
          (x: { price: number; sqft: number }) =>
            Number.isFinite(x.price) && Number.isFinite(x.sqft) && x.sqft > 0,
        )
        .map((x: { price: number; sqft: number }) => x.price / x.sqft);
      const quantiles = (arr: number[]) => {
        if (!arr.length) return null;
        const a = [...arr].sort((a, b) => a - b);
        const q = (p: number) =>
          a[
            Math.min(a.length - 1, Math.max(0, Math.floor((a.length - 1) * p)))
          ];
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
              count: ppsf.length,
              quantiles: quantiles(ppsf),
              histogram: histogram(ppsf),
            }),
          },
        ],
      };
    },
  },
];
