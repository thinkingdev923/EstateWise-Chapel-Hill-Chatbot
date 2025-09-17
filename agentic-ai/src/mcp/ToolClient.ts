import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "node:child_process";

/**
 * Spawns the local MCP server from ../mcp/dist/server.js and exposes list/call.
 * Keep this minimal so agents can use tools without bringing in server code.
 */
export class ToolClient {
  private client: McpClient | null = null;
  private child: ReturnType<typeof spawn> | null = null;

  async start(): Promise<void> {
    if (this.client) return;
    const child = spawn("node", ["dist/server.js"], {
      cwd: new URL("../../../mcp/", import.meta.url).pathname,
      stdio: ["pipe", "pipe", "inherit"],
      env: process.env,
    });
    this.child = child;
    const transport = new StdioClientTransport(child.stdout!, child.stdin!);
    const client = new McpClient({ name: "agentic-ai", version: "0.1.0" });
    await client.connect(transport);
    this.client = client;
  }

  async stop(): Promise<void> {
    try {
      await this.client?.close();
    } catch {}
    try {
      this.child?.kill();
    } catch {}
    this.client = null;
    this.child = null;
  }

  async listTools() {
    if (!this.client) throw new Error("ToolClient not started");
    return await this.client.listTools();
  }

  async callTool(name: string, args: Record<string, unknown> = {}) {
    if (!this.client) throw new Error("ToolClient not started");
    return await this.client.callTool({ name, arguments: args });
  }
}
