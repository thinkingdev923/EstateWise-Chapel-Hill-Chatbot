# Agentic AI Pipeline for EstateWise

Welcome to the Agentic AI CLI for EstateWise, a standalone multi-agent orchestration tool designed to assist with real estate market research and analysis. This CLI leverages multiple specialized agents to break down complex goals into manageable tasks, utilizing the Model Context Protocol (MCP) tools for data retrieval and processing.

<p align="left">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="LangChain" src="https://img.shields.io/badge/LangChain-6B46C1?style=for-the-badge" />
  <img alt="LangGraph" src="https://img.shields.io/badge/LangGraph-1E90FF?style=for-the-badge" />
  <img alt="MCP" src="https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6A5ACD?style=for-the-badge" />
  <img alt="OpenAI" src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" />
  <img alt="Google Gemini" src="https://img.shields.io/badge/Google%20AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img alt="Pinecone" src="https://img.shields.io/badge/Pinecone-FF6F61?style=for-the-badge" />
  <img alt="Neo4j" src="https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white" />
  <img alt="Zod" src="https://img.shields.io/badge/Zod-2563EB?style=for-the-badge" />
  <img alt="CrewAI" src="https://img.shields.io/badge/CrewAI-Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="CLI" src="https://img.shields.io/badge/CLI-Node%20ESM-000000?style=for-the-badge" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

## Overview

This project implements a multi-agent system where each agent has a specific role, such as planning, data lookup, analysis, and reporting. The agents communicate through a shared blackboard memory, allowing for coordinated execution of tasks. The orchestrator manages the workflow, ensuring that each step is executed in the correct order and that results are aggregated for final reporting.
- Standalone multi‑agent orchestration CLI for EstateWise. Runs independently to iterate on agent roles, planning, and MCP tool usage. Output is a readable transcript in the terminal.
- Uses a round‑based orchestrator to let agents plan and execute steps (parse → lookup → search → analytics → graph → map → finance → compliance → report).
- Spawns the local MCP server build over stdio and uses `@modelcontextprotocol/sdk` to list/call tools.
- Pure TypeScript/Node.js with no cross‑package imports. Keep prompts small and explicit; prefer tools over LLM guessing.

## What’s New

This version introduces several enhancements to improve real estate market research capabilities:

- Stronger real‑estate focus with more MCP tools (lookup, analytics, finance, ZIP groupings).
- New agents for ZPID lookups and analytics.
- Coordinator‑driven pipeline for clearer hand‑offs and deterministic execution.
- Optional LangChain + LangGraph runtime with tool‑calling agent, Pinecone vector search, and Neo4j Cypher QA integration.
 - Optional CrewAI runtime (Python) to run a sequential crew of planner/analysts/reporters for a concise, agentic flow.

```mermaid
flowchart TD
  Planner --> Coordinator
  Coordinator --> ZPID[ZpidFinder]
  Coordinator --> Property
  Coordinator --> Analytics
  Coordinator --> Graph
  Coordinator --> Ranker[Dedupe/Ranking]
  Coordinator --> Map
  Coordinator --> Finance
  Coordinator --> Compliance
  Finance --> Reporter
  Map --> Reporter
  Graph --> Reporter
  Analytics --> Reporter
  Ranker --> Reporter
```

## Quick Start
```bash
# Build MCP tools once
cd mcp && npm install && npm run build

# Run Agentic AI with your goal
cd ../agentic-ai
npm install
npm run dev "Find 3-bed homes in Chapel Hill, NC; compare 123456 and 654321; estimate $600k at 6.25%."

# Production run
npm run build
npm start "Lookup ZPID for 123 Main St, Chapel Hill, NC and show similar homes nearby."
```

### LangChain + LangGraph Runtime (New)
```bash
# Ensure env is configured
# Required: one of GOOGLE_AI_API_KEY or OPENAI_API_KEY
# Optional: PINECONE_API_KEY + PINECONE_INDEX, Neo4j NEO4J_URI/NEO4J_USERNAME/NEO4J_PASSWORD

# Run with the LangGraph agent
npm run dev -- --langgraph "Find 3-bed homes in Chapel Hill; show a map and explain two ZPIDs"

# Or via env flag
AGENT_RUNTIME=langgraph npm run dev -- "Compare 123456 vs 654321 and compute mortgage"
```

What it adds:
- Tool-calling agent built with `@langchain/langgraph` prebuilt ReAct agent.
- Tools include MCP tools (search/lookup/analytics/graph/map/finance), Pinecone vector retrieval, and Neo4j Cypher QA.
- Lightweight in-memory checkpointer; easy to swap for Redis/Postgres in production.

### CrewAI Runtime (New)
CrewAI integration is provided via a small Python runner. This is great for teams standardizing on CrewAI’s Agent/Task/Crew abstractions.

Setup
```bash
cd agentic-ai/crewai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Ensure OPENAI_API_KEY is set (CrewAI runner uses OpenAI via langchain-openai)
export OPENAI_API_KEY=sk-...
```

Run from the Node CLI
```bash
# Dev
cd agentic-ai
npm run dev -- --crewai "Find 3-bed homes in Chapel Hill; show a map and explain two ZPIDs"

# Or production
npm run start:crewai -- "Compare 123456 vs 654321 and compute mortgage"

# Optional: customize python binary
PYTHON_BIN=python3.11 npm run dev -- --crewai "..."
```

Notes
- Python runner path: `agentic-ai/crewai/runner.py`. It reads a JSON payload `{goal}` on stdin and returns JSON.
- Model: uses `OPENAI_MODEL` env (default `gpt-4o-mini`).
- Output: a structured JSON with final `result` plus intermediate artifacts (plan/search/graph/finance).

## Example Goals
- "Find 3‑bed homes in Chapel Hill, NC; compare 123456 and 654321; estimate $600k at 6.25%."
- "Lookup ZPID for 123 Main St, Chapel Hill, NC and show similar homes nearby."

## Pipeline
- Coordinator‑guided steps: parseGoal → lookup → search → summarize → groupByZip → dedupeRank → graph → comparePairs → map → mortgage → affordability → compliance.
- Default rounds: 5 (enough to complete the plan and summarize).
- File: `src/pipelines/marketResearch.ts`

```mermaid
flowchart LR
  U[User Goal] --> P[Planner]
  P --> C[Coordinator]
  C -->|parseGoal| Parse(util.parseGoal)
  C -->|lookup| Lookup(properties.lookup)
  C -->|search| Search{properties.search / searchAdvanced}
  C -->|summarize| Summ(analytics.summarizeSearch)
  C -->|groupByZip| Group(analytics.groupByZip)
  C -->|dedupeRank| Rank[Dedupe/Rank ZPIDs]
  C -->|graph| Graph{graph.explain / graph.similar}
  C -->|comparePairs| Pairs(graph.comparePairs)
  C -->|map| Map{map.linkForZpids / map.buildLinkByQuery}
  C -->|mortgage| Mort(finance.mortgage)
  C -->|affordability| Aff(finance.affordability)
  C -->|compliance| Comp[Compliance Checks]
  Comp --> R[Reporter]
  Map --> R
  Mort --> R
  Aff --> R
  Group --> R
```

## Agents
- PlannerAgent – drafts a high‑level plan from the goal.
- CoordinatorAgent – drives step execution using a shared blackboard plan (parse → lookup → search → analytics → graph → map → finance), marks steps running/done, and triggers the right tools at the right time.
- ZpidFinderAgent – extracts address/city/state/ZIP/beds/baths and calls `properties.lookup`.
- PropertyAnalystAgent – refines queries and calls `properties.search`/`properties.searchAdvanced`.
- AnalyticsAnalystAgent – runs `analytics.summarizeSearch` (and `analytics.groupByZip`) for market medians and groupings.
- GraphAnalystAgent – calls `graph.explain`/`graph.similar` when ZPIDs are present.
- MapAnalystAgent – builds deep links via `map.linkForZpids` or `map.buildLinkByQuery`.
- FinanceAnalystAgent – computes mortgage via `finance.mortgage` and checks `finance.affordability` as needed.
- DedupeRankingAgent – deduplicates and caps ZPID lists, writing `rankedZpids` to the blackboard.
- ComplianceAgent – runs sanity checks (medians, APR, payment totals, ZPID counts) and writes a compliance report.
- ReporterAgent – composes a concise summary citing tool outputs.

## Inter‑Agent Coordination
- Shared blackboard memory aggregates: ZPIDs, parsed filters, analytics, map links, finance results, and the step plan.
- CoordinatorAgent advances steps, sets in‑flight tool calls, and marks them done once results arrive.
- The orchestrator retries failed tool calls once and normalizes JSON text where possible.

## MCP Integration
- Spawns `../mcp/dist/server.js` over stdio and uses `@modelcontextprotocol/sdk` to list/call tools.
- Tool outputs are text blocks; the orchestrator stores both the raw result and an extracted text for the Reporter.

## Extending
- Create a new Agent with a `think(ctx)` method returning a message or a tool call: `{ data: { tool: { name, args } } }`.
- Register the agent in `AgentOrchestrator`. Keep roles focused and stateless where possible.
- Prefer composing existing MCP tools. If missing, add tools in `mcp/` and update docs.

## Structure
```
agentic-ai/
└─ src/
   ├─ core/           # agent interfaces, types, blackboard
   ├─ mcp/            # MCP client wrapper
   ├─ agents/         # Planner, Coordinator, ZpidFinder, Property, Analytics, Graph, Map, Finance, Reporter
   ├─ orchestrator/   # round-based planner/executor
   ├─ lang/           # LangChain + LangGraph runtime
   │  ├─ llm.ts       # Chat/embedding model selection (Google/OpenAI)
   │  ├─ tools.ts     # MCP wrappers, Pinecone retrieval, Neo4j Cypher tools
   │  ├─ memory.ts    # Checkpointer (MemorySaver by default)
   │  └─ graph.ts     # createReactAgent + runner
   ├─ crewai/         # Python CrewAI runner (invoked from Node)
   │  ├─ runner.py    # stdin JSON -> crew -> stdout JSON
   │  └─ requirements.txt
   ├─ pipelines/      # marketResearch
   └─ index.ts        # demo entrypoint
```

## Configuration
- LLMs
  - `GOOGLE_AI_API_KEY` (preferred) and optional `GOOGLE_AI_MODEL` (default `gemini-1.5-pro-002`).
  - Or `OPENAI_API_KEY` and optional `OPENAI_MODEL` (default `gpt-4o-mini`).
- Embeddings
  - `GOOGLE_EMBED_MODEL` (default `text-embedding-004`) or `OPENAI_EMBED_MODEL` (default `text-embedding-3-large`).
- Pinecone (optional)
  - `PINECONE_API_KEY`, `PINECONE_INDEX` (and optionally `PINECONE_ENV` if needed by your account).
- Neo4j (optional)
  - `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`.
- Runtime
  - `AGENT_RUNTIME=langgraph` to enable the LangGraph runtime by default.
  - Optional `THREAD_ID` for conversation continuity when using the LangGraph checkpointer.
  - `AGENT_RUNTIME=crewai` or `--crewai` to enable the CrewAI runtime; requires Python + crewai deps and `OPENAI_API_KEY`.

## Notes

This project is designed for iterative development and experimentation with multi-agent systems in real estate analysis. Key points to remember:

- Pure TS/Node CLI. Spawns the local MCP server dist build to avoid cross‑package imports.
- Keep prompts small and explicit; prefer tools over LLM guessing.
- Output is a readable terminal transcript showing agents' reasoning and actions.
- Default 5 rounds should be enough to complete the plan and summarize.
- CoordinatorAgent drives the pipeline, ensuring clear hand-offs and deterministic execution.

```mermaid
sequenceDiagram
  participant CLI as Agentic CLI
  participant Coord as Coordinator
  participant MCP as MCP Server (stdio)
  participant API as Backend API

  CLI->>Coord: goal
  Coord->>MCP: util.parseGoal
  MCP->>API: GET /api/... (lookup/search/graph)
  API-->>MCP: JSON
  MCP-->>Coord: text(JSON)
  Coord->>MCP: properties.searchAdvanced / analytics / graph / map / finance
  MCP-->>Coord: text(JSON)
  Coord-->>CLI: blackboard + transcript
```

This setup allows iterative development of agent roles, planning logic, and MCP tool usage. The output is a clear terminal transcript showing the agents' reasoning and actions, making it easy to refine and extend the pipeline over time.
