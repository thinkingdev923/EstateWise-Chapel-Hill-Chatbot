# EstateWise Architecture

This document describes the end‑to‑end architecture for EstateWise, spanning frontend UI, backend services, data and graph pipelines, MCP tooling, the agentic orchestration CLI, IDE extension, and CI/CD.

## System Overview

The high-level architecture is as follows:

```mermaid
flowchart LR
  subgraph Users
    U[Web User]
    Dev[Developer]
  end
  subgraph Frontend
    FE[Next.js / React]
    Map[/Map page/]
    Insights[/Insights page/]
    Chat[/Chat page/]
  end
  subgraph Backend
    API[Express + TypeScript]
    GraphAPI[/Graph routes/]
    PropAPI[/Property routes/]
    AuthAPI[/Auth/Conversations/Chat/]
  end
  subgraph Data
    Mongo[(MongoDB Atlas)]
    Pinecone[(Pinecone Index)]
    Neo4j[(Neo4j Graph)]
  end
  subgraph AI
    Gemini[Google Gemini]
  end
  subgraph Tooling
    MCP[MCP Server]
    Agentic[Agentic AI Orchestrator]
    VSX[VS Code Extension]
  end

  U --> FE --> API
  FE -->|/api/graph/*| GraphAPI
  FE -->|/api/properties/*| PropAPI
  API --> Mongo
  API --> Pinecone
  API --> Neo4j
  API --> Gemini
  Dev --> Agentic -->|stdio| MCP --> API
  VSX --> FE
  FE --> Map
  FE --> Insights
  FE --> Chat
```

## Repository Topology

```
backend/       # Express + TypeScript API, graph + property endpoints
frontend/      # Next.js + React app (chat, insights, map)
mcp/           # Model Context Protocol server exposing project tools over stdio
agentic-ai/    # Multi-agent CLI orchestrator using MCP
extension/     # VS Code extension embedding chat
docs-backend/  # TypeDoc output for backend
terraform/, aws/, gcp/  # Infra-as-code and cloud configs
```

## Frontend

- Pages
  - `pages/chat.tsx`: conversational UI integrated with backend chat API and conversation management.
  - `pages/insights.tsx`: graph tools, comparators, calculators; includes Find ZPID dialog with address/city/state/ZIP and bed/bath filters.
  - `pages/map.tsx`: Leaflet map rendering; accepts deep links `?zpids=...` or `?q=...` and caps markers for performance (~200 by default).
- UI
  - TailwindCSS + shadcn UI components; Chart.js for visualizations.
- API Client
  - `frontend/lib/api.ts`: REST wrappers for conversations, chat, properties, and graph.

### ZPID Lookup UX

```mermaid
sequenceDiagram
  participant User
  participant FE as Insights Modal
  participant API as /api/properties/lookup

  User->>FE: enter any subset of fields
  FE->>API: GET /lookup?city=...&state=...&zipcode=...&beds=...&baths=...
  API-->>FE: { matches: [{zpid, address, stats}] }
  FE-->>User: show candidates + "Use" action
```

## Backend (Express + TypeScript)

- Routes
  - Properties: `/api/properties` (query), `/api/properties/by-ids`, `/api/properties/lookup`.
  - Graph: `/api/graph/similar/:zpid`, `/api/graph/explain?from&to`, `/api/graph/neighborhood/:name`.
  - Auth/Conversations/Chat: login/signup, chat completion, and conversation storage.
- Integrations
  - MongoDB Atlas for persistence.
  - Pinecone for semantic search (kNN) and metadata fetch.
  - Neo4j for property‑ZIP‑neighborhood relationships and explanations.
  - Google Gemini for LLM‑assisted analysis (agents and chat).
- Observability
  - `express-status-monitor` on `/status`.
  - Prometheus metrics (latency, error rates) and structured logs.

### Property Search Flow

```mermaid
sequenceDiagram
  participant FE as Next.js
  participant API as Express
  participant PC as Pinecone

  FE->>API: GET /api/properties?q=...&topK=...
  API->>PC: vector query (kNN)
  PC-->>API: matches + metadata
  API-->>FE: listings + chart configs
```

### Graph API Flow

```mermaid
sequenceDiagram
  participant FE as Next.js
  participant API as Express
  participant N as Neo4j

  FE->>API: GET /api/graph/similar/:zpid
  API->>N: Cypher query (SIMILAR/IN_ZIP/IN_NEIGHBORHOOD)
  N-->>API: related nodes + reasons
  API-->>FE: results
```

## Data & Graph Pipelines

### Embedding & Upsert (Pinecone)

```mermaid
flowchart TD
  Raw[Raw Property Source] --> Clean[Normalize fields]
  Clean --> Embed[Embedding model]
  Embed --> Upsert[Upsert batched]
  Upsert --> Pinecone[(Pinecone Index)]
```

### Neo4j Ingest (from Pinecone)

```mermaid
flowchart TD
    PineconeList["List IDs by page"] --> FetchMeta["Fetch metadata"]
    FetchMeta --> ParseAddr["Parse address JSON"]
    ParseAddr --> UpsertProp["MERGE Property(zpid) SET props"]
    UpsertProp --> LinkZip["MERGE Zip(code) and (Property)-[:IN_ZIP]->(Zip)"]
    UpsertProp --> LinkHood["MERGE Neighborhood(name) and link"]
    LinkZip --> NextPage{More?}
    LinkHood --> NextPage
    NextPage -->|yes| PineconeList
    NextPage -->|no| Done[Complete]
```

## Model Context Protocol (MCP) Server

The `mcp/` package exposes graph, property, analytics, finance, and utility tools to any MCP‑compatible client over stdio.

```mermaid
flowchart LR
  Client[IDE or Assistant MCP Client] -- stdio --> MCP[MCP Server]
  MCP -->|properties, graph, analytics, map, util, finance| API[Backend API]
  MCP -->|deep links| FE[Frontend /map]
```

- Tool categories
  - Properties: `search`, `searchAdvanced`, `lookup`, `byIds`, `sample`
  - Graph: `similar`, `explain`, `neighborhood`, `similarityBatch`, `comparePairs`, `pathMatrix`
  - Analytics: `priceHistogram`, `summarizeSearch`, `groupByZip`, `distributions`
  - Map: `linkForZpids`, `buildLinkByQuery`
  - Utilities: `extractZpids`, `zillowLink`, `summarize`, `parseGoal`
  - Finance: `mortgage`, `affordability`, `schedule`

## Agentic AI Orchestrator

The `agentic-ai/` CLI runs a multi‑agent pipeline that spawns the local MCP server and coordinates steps with a shared blackboard and a Coordinator agent.

```mermaid
flowchart LR
  Goal[User Goal] --> Planner
  Planner --> Coordinator
  Coordinator -->|parseGoal| Parse
  Coordinator -->|lookup| Lookup
  Coordinator -->|search| Search
  Coordinator -->|summarize| Summarize
  Coordinator -->|groupByZip| Group
  Coordinator -->|dedupeRank| Rank
  Coordinator -->|graph| Graph
  Coordinator -->|comparePairs| Pairs
  Coordinator -->|map| Map
  Coordinator -->|mortgage| Mortgage
  Coordinator -->|affordability| Afford
  Coordinator -->|compliance| Compliance
  Compliance --> Reporter
```

- Agents
  - Planner, Coordinator, ZpidFinder, PropertyAnalyst, AnalyticsAnalyst, GraphAnalyst, DedupeRanking, MapAnalyst, FinanceAnalyst, Compliance, Reporter.
- Blackboard
  - Aggregates ZPIDs, parsed filters, analytics summaries, map links, finance results, and step state.
- Orchestrator
  - Executes tool calls via MCP, retries transient failures once, and normalizes JSON results.

### Agentic Runtimes (Pipeline Overview)

The project supports three agentic runtimes: the default round‑based Orchestrator, a LangChain + LangGraph ReAct agent, and a CrewAI (Python) sequential crew.

```mermaid
flowchart LR
  subgraph Entry
    Goal[User Goal]
  end

  subgraph Orchestrator
    PlannerO[Planner]
    CoordO[Coordinator]
    ParseO[util.parseGoal]
    LookupO[properties.lookup]
    SearchO[properties.search]
    SummO[analytics.summarizeSearch]
    GroupO[analytics.groupByZip]
    RankO[Dedupe/Rank]
    GraphO[graph.explain/similar]
    MapO[map.linkForZpids]
    FinO[finance.mortgage]
    CompO[Compliance]
    ReportO[Reporter]
    PlannerO --> CoordO --> ParseO --> LookupO --> SearchO --> SummO --> GroupO --> RankO --> GraphO --> MapO --> FinO --> CompO --> ReportO
  end

  subgraph LangGraph
    ReactA[ReAct Agent]
    ToolsA[[MCP Tools]]
    PineA[(Pinecone)]
    NeoA[(Neo4j)]
    ReactA --> ToolsA
    ReactA --> PineA
    ReactA --> NeoA
  end

  subgraph CrewAI
    PlanC[Planner]
    AnalC[Property Analyst]
    GraphC[Graph Analyst]
    FinC[Finance Analyst]
    RepC[Reporter]
    PlanC --> AnalC --> GraphC --> FinC --> RepC
  end

  Goal -->|--runtime=orchestrator| PlannerO
  Goal -->|--runtime=langgraph| ReactA
  Goal -->|--runtime=crewai| PlanC
```

### Integration with Overall System

The agentic runtimes integrate with the rest of EstateWise via the MCP server and backend API. The diagram shows an end‑to‑end view (agent → tools → API/data) and UI entry points.

```mermaid
flowchart LR
    subgraph UI;
        FE[Next.js / React];
        VSX[VS Code Extension];
    end;

    subgraph Agentic;
        OrchestratorRuntime[Orchestrator CLI];
        LangGraphRuntime[LangGraph Agent];
        CrewAIRuntime[CrewAI Runner];
    end;

subgraph Tooling;
MCP[MCP Server];
end;

subgraph Backend;
API[Express API];
Auth[/Auth/Chat/Props/Graph/];
end;

subgraph Data;
Mongo[(MongoDB Atlas)];
Pinecone[(Pinecone Index)];
Neo4j[(Neo4j Graph)];
end;

FE --> API;
VSX --> FE;
OrchestratorRuntime -->|spawn stdio| MCP;
LangGraphRuntime --> MCP;
CrewAIRuntime --> API;
MCP --> API;
API --> Mongo;
API --> Pinecone;
API --> Neo4j;
FE -->|/map deep links| FE;
```

## VS Code Extension

Simple WebView wrapper that loads `https://estatewise.vercel.app/chat` inside VS Code. No additional secrets are required; it leverages the hosted frontend.

```mermaid
flowchart LR
  VSX[VS Code] --> WebView[Chat WebView]
  WebView --> FE[estatewise.vercel.app/chat]
```

## Security & Config

- Secrets are never committed. Copy `.env.example` → `.env` per package.
- Required keys by area
  - Backend: `MONGO_URI`, Pinecone, Google AI key, optional Neo4j (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`).
  - MCP: `API_BASE_URL`, `FRONTEND_BASE_URL`.
- Rate limits and error handling middleware on the API; JWT cookies for auth; CORS configured.

## Testing Strategy

- Backend: `backend/tests/` with Jest unit/integration tests.
- Frontend: `frontend/__tests__/` with Jest; Cypress + Selenium for E2E/UI.
- MCP/Agentic: CLI flows are testable via scripted goals; tools return text(JSON) for easy parsing.

## CI/CD & Infrastructure

```mermaid
flowchart LR
  Dev --> PR[Pull Request]
  PR --> CI[GitHub Actions]
  CI --> Test[Tests + Lint + Type Check]
  CI --> Build[Docker/Next build]
  Build --> GHCR[Registry]
  GHCR --> ECS[AWS ECS Backend]
  GHCR --> Vercel[Vercel Frontend]
  ECS --> Atlas[MongoDB Atlas]
  ECS --> PineconeSvc[Pinecone]
  CI --> TF[Terraform Apply]
  TF --> AWS[(AWS Infra)]
```

## Scalability & Resilience

- Horizontal scale on ECS for stateless API.
- MongoDB Atlas replica sets and auto‑failover; Pinecone replication; Neo4j constraints.
- Guardrails: marker caps on map, basic circuit‑breakers, and compliance checks in agentic pipeline.

## Core Data Models

```mermaid
erDiagram
  USER ||--o{ CONVERSATION : owns
  CONVERSATION ||--o{ MESSAGE : includes
  PROPERTY ||--o{ LISTING : contains
```

Graph (Neo4j) high‑level entities and relationships:

```mermaid
classDiagram
  class Property {
    zpid
    streetAddress
    city
    state
    zipcode
    price, bedrooms, bathrooms
    livingArea, yearBuilt
  }
  class Zip { code }
  class Neighborhood { name }
  Property --> Zip : IN_ZIP
  Property --> Neighborhood : IN_NEIGHBORHOOD
```

## Authentication

```mermaid
sequenceDiagram
  participant User
  participant UI as Next.js
  participant API
  participant DB as MongoDB
  User->>UI: submit credentials
  UI->>API: POST /api/auth/login
  API->>DB: validate user
  DB-->>API: match
  API-->>UI: Set-Cookie JWT
  UI-->>User: authenticated session
```

Key aspects: bcrypt salted hashes, HttpOnly JWT cookies, and CSRF‑resistant flows via cookie + header patterns.

---

This document reflects the current codebase, data flows, and pipelines. Update it alongside major feature changes (graph tools, MCP tools, agent roles, or infra topology).

## Request Lifecycle (End‑to‑End)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Next.js
  participant API as Express API
  participant PC as Pinecone
  participant N as Neo4j
  participant DB as MongoDB

  U->>FE: Interact (Chat/Insights/Map)
  FE->>API: REST (fetch, JSON)
  alt Property Search
    API->>PC: vector query (kNN)
    PC-->>API: matches + metadata
    API-->>FE: listings + charts
  else Graph Query
    API->>N: Cypher
    N-->>API: nodes + relations
    API-->>FE: explained path / similars
  else Conversations/Chat
    API->>DB: read/write convo/messages
    API-->>FE: payload
  end
```

## Backend Modules (Detailed View)

```mermaid
classDiagram
  class Server_ts { boot(); registerRoutes(); }
  class Routes {
    +property.routes.ts
    +graph.routes.ts
    +auth.routes.ts
    +conversation.routes.ts
    +chat.routes.ts
    +commute-profile.routes.ts
  }
  class Controllers {
    +property.controller.ts
    +graph.controller.ts
  }
  class GraphLayer {
    +neo4j.client
    +graph/services.ts
    +scripts/ingestNeo4j.ts
  }
  class Data {
    +models/* (Mongo)
    +pineconeClient.ts
  }
  class Middleware { auth, rateLimit, status, errors }
  Server_ts --> Routes
  Routes --> Controllers
  Controllers --> Data
  Controllers --> GraphLayer
  Server_ts --> Middleware
```

### HTTP Surface (Selected)

```mermaid
flowchart TD
  A[/GET /api/properties?q, topK/] -->|kNN| Pinecone
  B[/GET /api/properties/by-ids?ids/] --> Data[(Mongo/Pinecone)]
  C[/GET /api/properties/lookup?filters/] --> Pinecone
  D[/GET /api/graph/similar/:zpid/] --> Neo4j
  E[/GET /api/graph/explain?from&to/] --> Neo4j
  F[/GET /api/graph/neighborhood/:name/] --> Neo4j
```

## Agentic Blackboard Updates (Lifecycle)

```mermaid
sequenceDiagram
    participant Coord as Coordinator
    participant MCP as MCP Server
    participant API as Backend API
    participant BB as Blackboard

    Coord->>MCP: call util.parseGoal(text)
    MCP->>API: GET /parse (server maps to backend util)
    API-->>MCP: JSON
    MCP-->>Coord: content: text(JSON)
    Coord->>BB: write parsed filters
    Coord->>MCP: call properties.lookup
    MCP->>API: GET /api/properties/lookup
    API-->>MCP: matches
    MCP-->>Coord: content: text(JSON)
    Coord->>BB: merge zpids
    Coord->>BB: mark step done
```

## Failure Modes & Fallbacks

```mermaid
flowchart TD
  Start[Request] --> CheckNeo4j{Graph tool?}
  CheckNeo4j -- yes --> NeoTry[Call Neo4j]
  NeoTry --> OkN{200?}
  OkN -- no --> DegradeN[Return 503 with helpful message]
  DegradeN --> End
  OkN -- yes --> End
  CheckNeo4j -- no --> Next[Call other services]
  Next --> End
```

Guidance:
- If Neo4j is down: APIs return 503 with a clear error; UI surfaces a tip to run `npm run graph:ingest` or try later.
- If Pinecone is unavailable: property search endpoints return a 5xx; client side suggests retrying or narrowing filters.
- MCP tools propagate backend errors as text blocks; orchestrator retries once.

## Observability & Telemetry

```mermaid
flowchart LR
  API[Express] --> Metrics[Prometheus]
  API --> Status[/status monitor/]
  API --> Logs[Structured logs]
  Metrics --> Dash[Grafana/Alerts]
```

Key metrics (examples):
- http_request_duration_seconds (by route)
- mongo_connections, pinecone_latency_ms, neo4j_latency_ms
- cache_hits (if applicable), error_rate

## Security Model

- AuthN: JWT cookies (HttpOnly, Secure in prod). Passwords hashed with bcrypt.
- AuthZ: route middleware for protected endpoints (conversations, chat).
- Input validation: route params/query validated server-side.
- CORS: restricted origins (frontend + extension).
- Secrets: `.env` per package; never committed.
- Rate limiting and well-formed error responses.

## Environment & Config Matrix

```mermaid
classDiagram
  class Frontend_env {
    NEXT_PUBLIC_API_BASE_URL
  }
  class Backend_env {
    MONGO_URI
    GOOGLE_AI_API_KEY
    PINECONE_API_KEY, PINECONE_INDEX, PINECONE_NAMESPACE
    NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE
  }
  class MCP_env {
    API_BASE_URL
    FRONTEND_BASE_URL
  }
```

## Performance & SLOs (Targets)

- P50 API latency: < 200ms for property search (warm path); P95 < 800ms.
- Graph similar/explain: P95 < 1.5s (depends on Neo4j workload).
- Map load: < 2s with ≤200 markers.
- Agentic CLI (marketResearch): end-to-end < 15s for typical goals.

## Data Contracts (Examples)

Property listing (excerpt):

```json
{
  "id": "1234567",
  "zpid": 1234567,
  "price": 625000,
  "bedrooms": 3,
  "bathrooms": 2,
  "livingArea": 1850,
  "yearBuilt": 1996,
  "city": "Chapel Hill",
  "zipcode": "27514"
}
```

Graph similar (excerpt):

```json
{
  "zpid": 1234567,
  "results": [
    { "zpid": 2345678, "reason": "Same zip" }
  ]
}
```

## Environments

- Local: `npm start` (backend), `npm run dev` (frontend), MCP via `npm run dev` in `mcp/`.
- Dev/Preview: Vercel previews for frontend; ECS test cluster for backend.
- Prod: Vercel + AWS ECS; MongoDB Atlas; Pinecone; optional Neo4j managed service.

## Deployment Strategies

- Frontend: Vercel immutable deploys.
- Backend: ECS rolling updates; health checks; blue/green optional.
- Infra: Terraform for AWS resources; GH Actions for CI.

## Change Management

- Keep `ARCHITECTURE.md`, `README.md`, and package READMEs in sync with feature additions (routes, tools, agents).
- Document new env vars and update `.env.example` files.
