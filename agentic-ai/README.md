Agentic AI (Experimental)

Overview
- A standalone, experimental multi‑agent orchestration playground for EstateWise. It is not wired into the main backend yet: run it independently to iterate on agent roles, planning, and MCP tool usage.

Key Ideas
- Role-based agents:
  - Planner: turns a user goal into a plan (steps + tools).
  - GraphAnalyst: leverages graph tools (similar/explain/neighborhood).
  - PropertyAnalyst: focuses on market signals from property/search charts.
  - MapAnalyst: produces map links and geospatial groupings.
  - Reporter: composes a final, user-facing answer with links and caveats.
- Tooling via MCP:
  - Uses the local MCP server in ../mcp to call graph/property tools.
  - Adds a thin ToolClient wrapper so agents can list/call tools by name.
  - New MCP tools added: searchAdvanced, charts.priceHistogram, graph.similarityBatch, map.buildLinkByQuery, util.extractZpids, util.summarize, finance.mortgage.

Run
- Build MCP once: `cd mcp && npm run build`
- Dev: `cd agentic-ai && npm run dev` (pass a goal string to override default)
- Build: `npm run build`
- Start: `npm start`

Pipelines
- `src/pipelines/marketResearch.ts` – Orchestrates Planner → Property → Graph → Map → Finance → Reporter in 3 rounds and returns the full transcript.
  - Example goal: “Compare 123456 and 654321; map nearby 3‑bed homes; estimate $600k at 6.25%.”

Agents
- PlannerAgent – produces an initial high‑level plan and tool suggestions.
- PropertyAnalystAgent – refines textual queries and calls properties.search/Advanced.
- GraphAnalystAgent – detects zpids and calls graph.explain/similar/neighborhood.
- MapAnalystAgent – builds deep links with zpids/query.
- FinanceAnalystAgent – computes mortgage breakdown via finance.mortgage.
- ReporterAgent – composes a concise summary citing tool outputs.

MCP Integration
- The orchestrator spawns `../mcp/dist/server.js` over stdio and uses `@modelcontextprotocol/sdk` to list/call tools.
- Tool outputs are returned as text blocks; the orchestrator stores both raw result and an extracted text for summarization.

Extending
- Add a new Agent with a `think` method returning either a message or a tool call `{ data: { tool: { name, args } } }`.
- Register the agent in the orchestrator chain (order matters).
- Prefer composing with existing MCP tools before adding new ones.

Structure
- agentic-ai/
  - src/
    - core/ (agent interfaces, message bus, types)
    - mcp/ (MCP client wrapper)
    - agents/ (Planner, GraphAnalyst, PropertyAnalyst, MapAnalyst, Reporter)
    - orchestrator/ (round-based planner/executor)
    - index.ts (demo scenario)

Notes
- This is a pure TS/Node CLI workspace. It spawns the local MCP server dist build to avoid cross‑package imports.
- Keep prompts small and explicit; prefer tools over LLM guessing.
