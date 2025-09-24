import { z } from "zod";
import { bearer, httpGet, qs } from "../core/http.js";
import type { ToolDef } from "../core/registry.js";

/** Authenticated conversation tools (list/search). */
export const conversationTools: ToolDef[] = [
  {
    name: "conversations.list",
    description: "List conversations (requires bearer token).",
    schema: { token: z.string() },
    handler: async (args: any) => {
      const { token } = args as { token: string };
      const data = await httpGet("/api/conversations", {
        headers: bearer(token),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "conversations.search",
    description: "Search conversations by query (requires bearer token).",
    schema: { token: z.string(), q: z.string() },
    handler: async (args: any) => {
      const { token, q } = args as { token: string; q: string };
      const data = await httpGet(`/api/conversations/search${qs({ q })}`, {
        headers: bearer(token),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
];
