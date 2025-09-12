# EstateWise Architecture

## Overview
EstateWise is a full‑stack, AI‑powered real estate assistant focused on Chapel Hill, NC.  It pairs a modern **Next.js** front‑end with an **Express/TypeScript** API and a rich Retrieval‑Augmented Generation (RAG) pipeline backed by **Google Gemini**, **Pinecone**, and **MongoDB**.  The project also includes infrastructure as code for multi‑cloud deployment, monitoring, and a VS Code extension for in‑editor chat.

## High‑Level Components
```mermaid
flowchart LR
    subgraph Client
        U[User]
        F[Next.js UI]
    end
    subgraph Server
        API[Express API]
        DL[Decision Layer]
        RAG[RAG Query]
        MoE[Mixture of Experts]
    end
    DB[(MongoDB)]
    PC[(Pinecone)]
    GM[(Google Gemini)]
    U --> F --> API
    API --> DL -->|usePropertyData| RAG
    RAG --> PC
    RAG --> MoE
    DL -->|skip RAG| MoE
    MoE --> GM
    API --> DB
    API -->|metrics| Prom[Prometheus]
    API --> F
```

### Frontend (Next.js)
- Renders the chat interface, property visualizations, and account management.
- Communicates with the backend via REST APIs.
- Uses Tailwind CSS, Framer Motion, and Chart.js for responsive and animated UI.

### Backend (Express + TypeScript)
- Serves RESTful endpoints for authentication, conversations, chat, and property data.
- Integrates Prometheus metrics, status monitoring, and structured logging.
- Connects to MongoDB for persistence and Pinecone for vector search.

### AI/RAG Pipeline
- Property data is embedded using Google's `text-embedding-004` model and stored in Pinecone.
- A decision model determines whether property retrieval is needed.
- A Mixture‑of‑Experts system (Data Analyst, Lifestyle Concierge, Financial Advisor, Neighborhood Expert, Cluster Analyst) generates responses and merges them into a final answer.

## Chat Sequence
```mermaid
sequenceDiagram
    participant User
    participant UI as Next.js
    participant API as Express API
    participant Agent as EstateWise Agent
    participant DecisionAI
    participant Pinecone
    participant Experts
    participant Gemini

    User->>UI: sendMessage
    UI->>API: POST /api/chat
    API->>Agent: runEstateWiseAgent
    Agent->>DecisionAI: shouldFetch?
    DecisionAI-->>Agent: yes/no
    alt fetch
        Agent->>Pinecone: queryProperties
        Pinecone-->>Agent: propertyContext
    end
    Agent->>Experts: parallel expert calls
    Experts->>Gemini: generate views
    Gemini-->>Experts: expert responses
    Experts-->>Agent: merged response
    Agent-->>API: finalText + expertViews
    API-->>UI: JSON response
    UI-->>User: render answer
```

## Data Ingestion & Embedding Pipeline
```mermaid
flowchart TD
    CSV[Raw Property CSV] --> Clean[Data Cleaning & Normalization]
    Clean --> Embed[Generate 1536-dim Embeddings]
    Embed --> Upsert[Batch Upsert (size=50)]
    Upsert --> PineconeStore[(Pinecone Index)]
    PineconeStore -->|KNN| Query
```

## Deployment & Infrastructure
```mermaid
flowchart LR
    subgraph Cloud
        Vercel[Vercel
        Frontend]
        ECS[AWS ECS
        Backend]
        Atlas[MongoDB Atlas]
        PineconeSvc[Pinecone]
        GCP[GCP Storage]
        Azure[Azure Pipelines]
    end
    Dev[Developer]
    Dev -->|Git Push| GH[GitHub Actions]
    GH -->|Docker Build & Scan| Registry[GHCR]
    Registry --> ECS
    Registry --> Vercel
    ECS --> Atlas
    ECS --> PineconeSvc
    GH -->|Terraform| AWS[(AWS Infra)]
```

## Monitoring & Observability
- `express-status-monitor` provides a `/status` dashboard.
- Prometheus collects request latency, MongoDB connection health, and other metrics.
- Logs are emitted via Winston for structured analysis.

## Security
- JWT‑based authentication with cookies.
- CORS configured for public access.
- Rate limiting and error‑handling middleware.

## Testing
- **Backend:** Jest unit tests for controllers and middleware.
- **Frontend:** Jest tests for API utilities; Cypress and Selenium for E2E and UI testing.

## VS Code Extension
The `extension` directory contains a VS Code WebView extension that embeds the live chat at `https://estatewise.vercel.app/chat` directly inside the editor, enabling in‑IDE conversations.

## Technology Stack Overview
```mermaid
pie title Core Technologies
    "Next.js & React" : 25
    "Express & TypeScript" : 25
    "Google Gemini" : 15
    "MongoDB" : 10
    "Pinecone" : 10
    "Infrastructure & CI/CD" : 15
```

## Core Data Models
```mermaid
erDiagram
    USER ||--o{ CONVERSATION : owns
    CONVERSATION ||--o{ MESSAGE : includes
    USER ||--o{ FAVORITE : marks
    PROPERTY ||--o{ LISTING : contains
    FAVORITE }o--|| PROPERTY : references
```
The models mirror the MongoDB collections:
- **USER** documents store credentials and profile info.
- **CONVERSATION** threads group chat **MESSAGE** documents.
- **PROPERTY** data powers listings and user **FAVORITE** relationships.

## Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant UI as Next.js
    participant API
    participant DB as MongoDB
    User->>UI: Enter email/password
    UI->>API: POST /api/auth/login
    API->>DB: Validate credentials
    DB-->>API: User record
    API-->>UI: Set-Cookie JWT
    UI-->>User: Authenticated session
```
Key aspects:
- Passwords are salted and hashed with bcrypt before storage.
- JWT tokens are HttpOnly cookies to mitigate XSS.

## CI/CD Workflow
```mermaid
flowchart LR
    Dev[Developer] --> PR[Pull Request]
    PR --> Actions[GitHub Actions]
    Actions --> Test[Unit & E2E Tests]
    Actions --> Lint[Lint & Type Check]
    Actions --> Build[Docker/Next.js Builds]
    Build --> DeployECS[ECS Deploy]
    Build --> DeployVercel[Vercel Deploy]
    DeployECS --> Monitor[Prometheus]
```

## Scalability & Resilience
- Stateless backend containers on **AWS ECS** allow horizontal scaling.
- **MongoDB Atlas** provides replica sets and automated failover.
- **Pinecone** handles vector index sharding and replication.
- Rate limiting and circuit breakers protect against API abuse and downstream failures.

## Developer Workflow
- Local services are orchestrated via `docker-compose` for parity with production.
- `make` targets wrap common tasks like linting, testing, and building images.
- TypeDoc and JSDoc generate API documentation for backend and frontend respectively.

## Future Enhancements
- Incorporate real-time WebSocket updates for collaborative search.
- Add multi-region deployment with traffic steering.
- Expand expert models for mortgage and school district analysis.

---
This document serves as a top‑to‑bottom reference for EstateWise’s architecture, from data ingestion to deployment.
