import { z } from "zod";
import {
  bearer,
  httpDelete,
  httpGet,
  httpPost,
  httpPut,
} from "../core/http.js";
import type { ToolDef } from "../core/registry.js";

const Destination = z.object({
  label: z.string(),
  lat: z.number(),
  lng: z.number(),
  mode: z.enum(["drive", "transit", "bike", "walk"]),
  window: z.string(),
  maxMinutes: z.number().optional(),
});

export const commuteTools: ToolDef[] = [
  {
    name: "commute.create",
    description: "Create a new commute profile (requires token).",
    schema: {
      token: z.string(),
      name: z.string(),
      destinations: z.array(Destination).min(1).max(3),
      maxMinutes: z.number().optional(),
      combine: z.enum(["intersect", "union"]).optional(),
    },
    handler: async (args: any) => {
      const { token, name, destinations, maxMinutes, combine } = args as any;
      const data = await httpPost(
        "/api/commute-profiles",
        { name, destinations, maxMinutes, combine },
        { headers: bearer(token) },
      );
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "commute.list",
    description: "List commute profiles for the authenticated user.",
    schema: { token: z.string() },
    handler: async (args: any) => {
      const { token } = args as { token: string };
      const data = await httpGet("/api/commute-profiles", {
        headers: bearer(token),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "commute.get",
    description: "Get a specific commute profile by id (requires token).",
    schema: { token: z.string(), id: z.string() },
    handler: async (args: any) => {
      const { token, id } = args as { token: string; id: string };
      const data = await httpGet(
        `/api/commute-profiles/${encodeURIComponent(id)}`,
        { headers: bearer(token) },
      );
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "commute.update",
    description: "Update a commute profile by id (requires token).",
    schema: {
      token: z.string(),
      id: z.string(),
      name: z.string().optional(),
      destinations: z.array(Destination).min(1).max(3).optional(),
      maxMinutes: z.number().optional(),
      combine: z.enum(["intersect", "union"]).optional(),
    },
    handler: async (args: any) => {
      const { token, id, ...body } = args as any;
      const data = await httpPut(
        `/api/commute-profiles/${encodeURIComponent(id)}`,
        body,
        { headers: bearer(token) },
      );
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "commute.delete",
    description: "Delete a commute profile by id (requires token).",
    schema: { token: z.string(), id: z.string() },
    handler: async (args: any) => {
      const { token, id } = args as { token: string; id: string };
      const data = await httpDelete(
        `/api/commute-profiles/${encodeURIComponent(id)}`,
        { headers: bearer(token) },
      );
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
];
