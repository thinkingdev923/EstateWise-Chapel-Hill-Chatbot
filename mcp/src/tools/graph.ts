import { z } from "zod";
import { httpGetCached as httpGet, qs } from "../core/http.js";
import type { ToolDef } from "../core/registry.js";

/** Graph-based similarity and path explanation tools. */
export const graphTools: ToolDef[] = [
  {
    name: "graph.similar",
    description:
      "Graph-based similar properties for a given ZPID. Reasons included.",
    schema: { zpid: z.number(), limit: z.number().optional() },
    handler: async (args: any) => {
      const { zpid, limit = 10 } = args as { zpid: number; limit?: number };
      const data = await httpGet(
        `/api/graph/similar/${Number(zpid)}${qs({ limit })}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "graph.explain",
    description:
      "Explain the shortest path between two properties (ZIP/Neighborhood/Similarity).",
    schema: { from: z.number(), to: z.number() },
    handler: async (args: any) => {
      const { from, to } = args as { from: number; to: number };
      const data = await httpGet(`/api/graph/explain${qs({ from, to })}`);
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "graph.neighborhood",
    description: "Neighborhood stats and sample properties.",
    schema: { name: z.string(), limit: z.number().optional() },
    handler: async (args: any) => {
      const { name, limit = 50 } = args as { name: string; limit?: number };
      const data = await httpGet(
        `/api/graph/neighborhood/${encodeURIComponent(name)}${qs({ limit })}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "graph.similarityBatch",
    description: "Run graph.similar for multiple ZPIDs and merge results.",
    schema: { zpids: z.array(z.number()), limit: z.number().optional() },
    handler: async (args: any) => {
      const { zpids, limit = 5 } = args as { zpids: number[]; limit?: number };
      const all: any[] = [];
      for (const zpid of zpids.slice(0, 10)) {
        try {
          const data = await httpGet(
            `/api/graph/similar/${Number(zpid)}${qs({ limit })}`,
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
  },
  {
    name: "graph.comparePairs",
    description:
      "Explain relationships for up to 4 pairs derived from provided ZPIDs.",
    schema: { zpids: z.array(z.number()) },
    handler: async (args: any) => {
      const { zpids } = args as { zpids: number[] };
      const pairs: Array<[number, number]> = [];
      for (let i = 0; i < zpids.length - 1 && pairs.length < 4; i++)
        pairs.push([zpids[i], zpids[i + 1]]);
      const out: any[] = [];
      for (const [from, to] of pairs) {
        try {
          const data = await httpGet(`/api/graph/explain${qs({ from, to })}`);
          out.push({ from, to, data });
        } catch (e: any) {
          out.push({ from, to, error: e?.message || String(e) });
        }
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ pairs: out }) }],
      };
    },
  },
  {
    name: "graph.pathMatrix",
    description:
      "Explain paths for adjacent pairs across provided ZPIDs (limited).",
    schema: { zpids: z.array(z.number()), limitPairs: z.number().optional() },
    handler: async (args: any) => {
      const { zpids, limitPairs = 6 } = args as {
        zpids: number[];
        limitPairs?: number;
      };
      const pairs: Array<[number, number]> = [];
      for (let i = 0; i < zpids.length - 1 && pairs.length < limitPairs; i++)
        pairs.push([zpids[i], zpids[i + 1]]);
      const out: any[] = [];
      for (const [from, to] of pairs) {
        try {
          const data = await httpGet(`/api/graph/explain${qs({ from, to })}`);
          out.push({ from, to, data });
        } catch (e: any) {
          out.push({ from, to, error: e?.message || String(e) });
        }
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ pairs: out }) }],
      };
    },
  },
];
