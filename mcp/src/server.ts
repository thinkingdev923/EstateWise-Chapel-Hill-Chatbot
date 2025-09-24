import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { config } from "./core/config.js";

/**
 * EstateWise MCP server: exposes properties, graph, analytics, finance,
 * map, auth, commute, util, and system tools over stdio.
 */
const server = new McpServer(
  { name: "estatewise-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

// Register domain tool modules
registerAllTools(server);

// Start stdio transport. This process will appear idle because it waits for
// an MCP client over stdio (expected). Use `npm run client:dev` to interact.
const transport = new StdioServerTransport();
// eslint-disable-next-line no-console
console.error(
  `estatewise-mcp starting (API_BASE_URL=${config.apiBaseUrl})... waiting for client on stdio`,
);
server
  .connect(transport)
  .then(() => {
    // eslint-disable-next-line no-console
    console.error("estatewise-mcp connected.");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start MCP server:", err);
    process.exit(1);
  });
