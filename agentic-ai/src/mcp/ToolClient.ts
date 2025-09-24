import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Spawns the local MCP server from ../mcp/dist/server.js and exposes list/call.
 * Keep this minimal so agents can use tools without bringing in server code.
 */
export class ToolClient {
  private client: McpClient | null = null;
  // We let StdioClientTransport manage the child process internally.

  /** Start a background stdio MCP client, spawning the server if needed. */
  async start(): Promise<void> {
    if (this.client) return;
    const mcpDir = new URL("../../../mcp/", import.meta.url).pathname;
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["dist/server.js"],
      cwd: mcpDir,
      stderr: "inherit",
      env: process.env,
    } as any);
    const client = new McpClient({ name: "agentic-ai", version: "0.1.0" });
    await client.connect(transport);
    this.client = client;
  }

  /** Stop the MCP client and terminate the spawned server process. */
  async stop(): Promise<void> {
    try {
      await this.client?.close();
    } catch {}
    this.client = null;
  }

  /** List available MCP tools reported by the server. */
  async listTools() {
    if (!this.client) throw new Error("ToolClient not started");
    return await this.client.listTools();
  }

  /** Invoke an MCP tool with JSON arguments and return the raw MCP response. */
  async callTool(name: string, args: Record<string, unknown> = {}) {
    if (!this.client) throw new Error("ToolClient not started");
    return await this.client.callTool({ name, arguments: args });
  }
}
