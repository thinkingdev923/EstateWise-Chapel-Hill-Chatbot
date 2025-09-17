# EstateWise MCP Server

Badges: ![MCP](https://img.shields.io/badge/MCP-Server-6E56CF?style=for-the-badge) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logoColor=white)

This package exposes EstateWise property, graph, charts, map, and utility tools over the Model Context Protocol (MCP). It lets MCP‑compatible clients (IDEs, assistants, agents) call tools like property search, graph similarity, chart extraction, and deep‑link generation via a simple stdio transport.

- Location: `mcp/`
- Transport: stdio
- SDK: `@modelcontextprotocol/sdk`

## Quick Start

Prerequisites
- Node.js 18+ (recommended 20+)

Install
- `cd mcp && npm install`

Development (watch mode)
- `npm run dev`

Build and run
- `npm run build`
- `npm start`

Environment
- Copy `.env.example` to `.env` and adjust as needed.
- Variables:
  - `API_BASE_URL` (default: `https://estatewise-backend.vercel.app`)
  - `FRONTEND_BASE_URL` (default: `https://estatewise.vercel.app`)

## Included Tools

All tools validate inputs with Zod and return content blocks per MCP. For maximum compatibility, JSON payloads are returned as stringified text.

- Properties
- `properties.search(q: string, topK?: number)`
  - Description: Search properties via Pinecone‑backed API. Returns listings and charts.
  - Example call args:
    ```json
    { "q": "3 bed in Chapel Hill", "topK": 5 }
    ```
- `properties.searchAdvanced({ city?, zipcode?, minPrice?, maxPrice?, beds?, baths?, topK? })`
  - Description: Build a textual query from filters; returns listings and charts.
  - Example: `{ "city": "Chapel Hill", "beds": 3, "topK": 50 }`
- `properties.byIds(ids: Array<string | number>)`
  - Description: Fetch property metadata by Zillow IDs (ZPIDs).
  - Example call args:
    ```json
    { "ids": ["1234567", 2345678] }
    ```
- `properties.sample(topK?: number)` – Small bootstrap sample (`q=homes`, defaults to 50)
- Graph
- `graph.similar(zpid: number, limit?: number)`
  - Description: Graph‑based similar properties for a given ZPID. Reasons included.
  - Example call args:
    ```json
    { "zpid": 1234567, "limit": 10 }
    ```
- `graph.explain(from: number, to: number)`
  - Description: Explain the shortest path between two properties (ZIP/Neighborhood/Similarity).
  - Example call args:
    ```json
    { "from": 1234567, "to": 7654321 }
    ```
- `graph.neighborhood(name: string, limit?: number)`
  - Description: Neighborhood stats and sample properties.
  - Example call args:
    ```json
    { "name": "Northside", "limit": 50 }
    ```
- `graph.similarityBatch(zpids: number[], limit?: number)` – Aggregates similars for multiple ZPIDs

- Charts
- `charts.priceHistogram(q: string, topK?: number)` – Extract the price histogram series for the query

- Map
- `map.linkForZpids(ids: Array<string | number>)`
  - Description: Return a deep‑link to the EstateWise map page for given ZPIDs.
  - Example call args:
    ```json
    { "ids": [1234567, 2345678, 3456789] }
    ```

Notes
- Graph tools depend on Neo4j being configured in the backend; otherwise the backend responds with `503`.
- Returns use `{ type: 'text', text: '...' }` content blocks; parse JSON text in the client if needed.

## Example Client (Node.js)

A minimal stdio client is provided to help you explore tools locally.

- Source: `src/client.ts`
- Build output: `dist/client.js`

Run (dev, auto‑spawn server)
- `npm run client:dev` → lists tools

Run (built)
- `npm run build`
- `npm run client` → lists tools
- Call a tool:
  - `npm run client:call -- properties.search '{"q":"3 bed in Chapel Hill","topK":3}'`
  - `npm run client:call -- graph.similar '{"zpid":1234567,"limit":5}'`
  - `npm run client:call -- charts.priceHistogram '{"q":"Chapel Hill 3 bed"}'`
  - `npm run client:call -- util.extractZpids '{"text":"... 123456_zpid ... 987654"}'`
  - Parse JSON text into pretty JSON:
    - `npm run client:call:parse -- properties.search '{"q":"3 bed in Chapel Hill","topK":2}'`

Programmatic usage (excerpt)
```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['server.js'],
  cwd: 'dist',
});

const client = new Client({ name: 'estatewise-mcp-client', version: '0.1.0' });
await client.connect(transport);

const tools = await client.listTools();
const result = await client.callTool({
  name: 'properties.search',
  arguments: { q: '3 bed in Chapel Hill', topK: 3 },
});
```

### Launching from Popular MCP Clients

Below are example configurations for stdio‑based MCP clients. Consult your client's documentation for the correct file path and reload instructions.

- Claude Desktop (example snippet)
  ```json
  {
    "mcpServers": {
      "estatewise": {
        "command": "node",
        "args": ["/absolute/path/to/EstateWise-Chatbot/mcp/dist/server.js"],
        "env": {
          "API_BASE_URL": "https://estatewise-backend.vercel.app",
          "FRONTEND_BASE_URL": "https://estatewise.vercel.app"
        }
      }
    }
  }
  ```

- Generic MCP launcher
  ```json
  {
    "name": "estatewise-mcp",
    "transport": "stdio",
    "command": "node",
    "args": ["dist/server.js"],
    "cwd": "/absolute/path/to/EstateWise-Chatbot/mcp",
    "env": {
      "API_BASE_URL": "https://estatewise-backend.vercel.app",
      "FRONTEND_BASE_URL": "https://estatewise.vercel.app"
    }
  }
  ```

## Directory Layout

```
./mcp
├─ src/
│  ├─ server.ts   # MCP server with tool registrations
│  └─ client.ts   # Example stdio client (spawns dist/server.js)
├─ dist/          # Build output (tsc)
├─ package.json
├─ tsconfig.json
└─ .env (local)
```

## Scripts

- `npm run dev` – Start MCP server with tsx (dev)
- `npm run build` – TypeScript build to `dist/`
- `npm start` – Run built server (`node dist/server.js`)
- `npm run client:dev` – Dev client: list tools via tsx
- `npm run client` – Built client: list tools
- `npm run client:call` – Built client: call a tool (`npm run client:call -- <tool> '<json>'`)

## Troubleshooting

- Tool not listed
  - Ensure the server built successfully and you’re connecting to the built output (`dist/server.js`).
- 503 on graph tools
  - Backend Neo4j isn’t configured or ingested. See the root README for Neo4j setup and run `npm run graph:ingest` in the backend.
- JSON vs text
  - Results are text blocks; parse the JSON string in your client if you need structured objects.
- Stdio issues on Windows
  - Ensure your shell quoting passes valid JSON; prefer single quotes around the JSON and escape inner quotes.

## Security

- Do not commit secrets. Use `.env` locally; copy from `.env.example`.
- The server makes HTTP requests to the configured backend URL; validate and pin this in trusted environments.

## License
 - `map.buildLinkByQuery(q: string)` – Return a deep‑link `/map?q=...`

- Utilities
- `util.extractZpids(text: string)` – Extract ZPIDs from text or Zillow URLs
- `util.zillowLink(zpid: number)` – Build a Zillow homedetails link
- `util.summarize(text: string, maxLen?: number)` – Truncate summary (quick text post‑processing)

- Conversations (auth required)
- `conversations.list(token: string)`
- `conversations.search(token: string, q: string)`

This package is part of the EstateWise monorepo and inherits the repository license.
