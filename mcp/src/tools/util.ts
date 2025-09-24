import { z } from "zod";
import type { ToolDef } from "../core/registry.js";

function extractZpidsFromText(text: string): string[] {
  const re = /(\d+)_zpid|\b(\d{5,})\b/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)))
    out.push(m[2] || (m[1]?.replace("_zpid", "") ?? ""));
  return Array.from(new Set(out.filter(Boolean)));
}

function pickJsonPath(obj: any, path: string): any {
  if (!path) return obj;
  return path
    .split(".")
    .reduce(
      (acc: any, key: string) => (acc && key in acc ? acc[key] : undefined),
      obj,
    );
}

/**
 * General utilities: ZPID extraction, address parsing, geo utilities,
 * CSV/JSON helpers, and unit conversions.
 */
export const utilTools: ToolDef[] = [
  {
    name: "util.extractZpids",
    description: "Extract ZPIDs from free text (Zillow URLs or raw ids).",
    schema: { text: z.string() },
    handler: async (args: any) => {
      const { text } = args as { text: string };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ zpids: extractZpidsFromText(text) }),
          },
        ],
      };
    },
  },
  {
    name: "util.zillowLink",
    description: "Build Zillow home link from ZPID.",
    schema: { zpid: z.number() },
    handler: async (args: any) => {
      const { zpid } = args as { zpid: number };
      return {
        content: [
          {
            type: "text",
            text: `https://www.zillow.com/homedetails/${Number(zpid)}_zpid/`,
          },
        ],
      };
    },
  },
  {
    name: "util.summarize",
    description: "Return the first N characters of text (default 400).",
    schema: { text: z.string(), maxLen: z.number().optional() },
    handler: async (args: any) => {
      const { text, maxLen = 400 } = args as { text: string; maxLen?: number };
      const trimmed = text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
      return { content: [{ type: "text", text: trimmed }] };
    },
  },
  {
    name: "util.parseGoal",
    description:
      "Parse a free-text goal into coarse filters: zpids, zip, city/state, beds, baths, price, apr, years.",
    schema: { text: z.string() },
    handler: async (args: any) => {
      const { text } = args as { text: string };
      const zpidMatches = Array.from(
        text.matchAll(/(\d+)_zpid|\bzpid[:#]?\s*(\d{5,})/gi),
      )
        .map((m: RegExpMatchArray) =>
          Number((m as any)[2] || (m as any)[1]?.replace("_zpid", "") || 0),
        )
        .filter(Boolean);
      const zip = (text.match(/\b(\d{5})\b/) || [])[1] || null;
      const cityState = (text.match(/([A-Za-z][\w\s]+),\s*([A-Za-z]{2})/) ||
        []) as any;
      const city = cityState[1]?.trim() || null;
      const state = cityState[2]?.toUpperCase() || null;
      const beds = (text.match(/(\d+)\s*(?:bed|bd|beds)\b/i) || [])[1] || null;
      const baths =
        (text.match(/(\d+)\s*(?:bath|ba|baths)\b/i) || [])[1] || null;
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
  },
  {
    name: "util.csvToJson",
    description: "Parse CSV text into JSON (optionally with header row).",
    schema: {
      text: z.string(),
      delimiter: z.string().optional(),
      header: z.boolean().default(true),
    },
    handler: async (args: any) => {
      const {
        text,
        delimiter = ",",
        header = true,
      } = args as { text: string; delimiter?: string; header?: boolean };
      const lines = text.split(/\r?\n/).filter((l: string) => l.trim().length);
      if (!lines.length) return { content: [{ type: "text", text: "[]" }] };
      const parseLine = (line: string) => {
        // simple CSV splitting; does not handle quoted delimiter edge-cases aggressively
        const parts: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === delimiter && !inQuotes) {
            parts.push(cur);
            cur = "";
          } else {
            cur += ch;
          }
        }
        parts.push(cur);
        return parts.map((p) => p.trim().replace(/^"|"$/g, ""));
      };
      const rows = lines.map(parseLine);
      let out: any;
      if (header) {
        const headers: string[] = rows[0] as any;
        out = rows
          .slice(1)
          .map((r: string[]) =>
            Object.fromEntries(
              headers.map((h: string, i: number) => [h, (r as any)[i] ?? ""]),
            ),
          );
      } else {
        out = rows;
      }
      return { content: [{ type: "text", text: JSON.stringify(out) }] };
    },
  },
  {
    name: "util.jsonPick",
    description: "Pick a value from JSON text by dot-path.",
    schema: { json: z.string(), path: z.string().default("") },
    handler: async (args: any) => {
      const { json, path } = args as { json: string; path: string };
      const obj = JSON.parse(json);
      const val = pickJsonPath(obj, path);
      return { content: [{ type: "text", text: JSON.stringify(val) }] };
    },
  },
  {
    name: "util.units.convertArea",
    description: "Convert area between sqft and sqm.",
    schema: {
      value: z.number(),
      from: z.enum(["sqft", "sqm"]),
      to: z.enum(["sqft", "sqm"]),
    },
    handler: async (args: any) => {
      const { value, from, to } = args as {
        value: number;
        from: "sqft" | "sqm";
        to: "sqft" | "sqm";
      };
      if (from === to)
        return { content: [{ type: "text", text: JSON.stringify({ value }) }] };
      const sqmPerSqft = 0.09290304;
      const out = from === "sqft" ? value * sqmPerSqft : value / sqmPerSqft;
      return {
        content: [{ type: "text", text: JSON.stringify({ value: out }) }],
      };
    },
  },
  {
    name: "util.units.convertDistance",
    description: "Convert distance between miles and kilometers.",
    schema: {
      value: z.number(),
      from: z.enum(["mi", "km"]),
      to: z.enum(["mi", "km"]),
    },
    handler: async (args: any) => {
      const { value, from, to } = args as {
        value: number;
        from: "mi" | "km";
        to: "mi" | "km";
      };
      if (from === to)
        return { content: [{ type: "text", text: JSON.stringify({ value }) }] };
      const kmPerMi = 1.609344;
      const out = from === "mi" ? value * kmPerMi : value / kmPerMi;
      return {
        content: [{ type: "text", text: JSON.stringify({ value: out }) }],
      };
    },
  },
  {
    name: "util.address.parse",
    description: "Parse a US-style address into components if possible.",
    schema: { text: z.string() },
    handler: async (args: any) => {
      const { text } = args as { text: string };
      const t = text.trim();
      // Simple heuristic: number street, city, state zip
      const re =
        /^(?<line1>.+?),\s*(?<city>[A-Za-z\s]+?),\s*(?<state>[A-Za-z]{2})\s*(?<zip>\d{5})(?:-\d{4})?$/;
      const m = t.match(re);
      if (!m || !m.groups)
        return {
          content: [{ type: "text", text: JSON.stringify({ raw: t }) }],
        };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              line1: m.groups.line1,
              city: m.groups.city.trim(),
              state: m.groups.state.toUpperCase(),
              zip: m.groups.zip,
            }),
          },
        ],
      };
    },
  },
  {
    name: "util.geo.distance",
    description: "Haversine distance in km and mi between two coords.",
    schema: {
      lat1: z.number(),
      lng1: z.number(),
      lat2: z.number(),
      lng2: z.number(),
    },
    handler: async (args: any) => {
      const { lat1, lng1, lat2, lng2 } = args as {
        lat1: number;
        lng1: number;
        lat2: number;
        lng2: number;
      };
      const R = 6371; // km
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const km = R * c;
      const mi = km / 1.609344;
      return { content: [{ type: "text", text: JSON.stringify({ km, mi }) }] };
    },
  },
  {
    name: "util.geo.center",
    description: "Compute centroid of coordinates.",
    schema: {
      points: z.array(z.object({ lat: z.number(), lng: z.number() })).min(1),
    },
    handler: async (args: any) => {
      const { points } = args as {
        points: Array<{ lat: number; lng: number }>;
      };
      const { sumLat, sumLng } = points.reduce(
        (acc: any, p: any) => ({
          sumLat: acc.sumLat + p.lat,
          sumLng: acc.sumLng + p.lng,
        }),
        { sumLat: 0, sumLng: 0 },
      );
      const lat = sumLat / points.length;
      const lng = sumLng / points.length;
      return {
        content: [{ type: "text", text: JSON.stringify({ lat, lng }) }],
      };
    },
  },
];
