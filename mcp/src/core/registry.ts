import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodTypeAny } from "zod";

/**
 * Declarative description of an MCP tool to register on the server.
 * `schema` may be a Zod raw shape or annotations (per MCP SDK).
 */
export type ToolDef = {
  name: string;
  description: string;
  schema: unknown;
  handler: (args: any) => Promise<any>;
};

/** In-memory registry of all tools registered on this server. */
export const catalog: ToolDef[] = [];

/** Register an array of tools on the MCP server and record them in the catalog. */
export function registerTools(server: McpServer, defs: ToolDef[]) {
  for (const d of defs) {
    server.tool(d.name, d.description, d.schema as any, d.handler);
    catalog.push(d);
  }
}
