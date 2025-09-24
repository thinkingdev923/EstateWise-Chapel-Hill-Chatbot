import { z } from "zod";
import { config } from "../core/config.js";
import type { ToolDef } from "../core/registry.js";

/** Map link helpers for deep-linking to the EstateWise frontend. */
export const mapTools: ToolDef[] = [
  {
    name: "map.linkForZpids",
    description:
      "Return a deep-link to the EstateWise map page for given ZPIDs.",
    schema: { ids: z.array(z.union([z.string(), z.number()])).min(1) },
    handler: async (args: any) => {
      const { ids } = args as { ids: Array<string | number> };
      const qp = new URLSearchParams();
      qp.set("zpids", ids.map(String).join(","));
      const url = `${config.frontendBaseUrl}/map?${qp.toString()}`;
      return { content: [{ type: "text", text: url }] };
    },
  },
  {
    name: "map.buildLinkByQuery",
    description: "Return a deep-link to the map page for a given text query.",
    schema: { q: z.string() },
    handler: async (args: any) => {
      const { q } = args as { q: string };
      const qp = new URLSearchParams();
      qp.set("q", q);
      const url = `${config.frontendBaseUrl}/map?${qp.toString()}`;
      return { content: [{ type: "text", text: url }] };
    },
  },
  {
    name: "map.decodeLink",
    description: "Decode an EstateWise map link and return its parameters.",
    schema: { url: z.string() },
    handler: async (args: any) => {
      const { url } = args as { url: string };
      try {
        const u = new URL(url);
        const qp = Object.fromEntries(u.searchParams.entries());
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                host: u.host,
                path: u.pathname,
                params: qp,
              }),
            },
          ],
        };
      } catch (e: any) {
        throw new Error(`Invalid URL: ${e?.message || String(e)}`);
      }
    },
  },
];
