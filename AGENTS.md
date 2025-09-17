# Repository Guidelines

## Project Structure & Module Organization
- `backend/` (Express + TypeScript): API, models, routes, services.
  - Graph: `src/graph/` (Neo4j client + services), ingest: `src/scripts/ingestNeo4j.ts`.
  - Properties: `src/controllers/property.controller.ts`, routes in `src/routes/`.
- `frontend/` (Next.js + React): pages and UI components.
  - Key pages: `pages/chat.tsx`, `pages/insights.tsx` (graph tools + calculators), `pages/map.tsx` (Leaflet map).
- `docs-backend/` TypeDoc output; `extension/` VS Code extension; infra under `terraform/`, `aws/`, `gcp/`.

## Build, Test, and Development Commands
- Backend
  - `cd backend && npm start` – run API in dev (ts-node-dev).
  - `npm run build` – compile TypeScript.
  - `npm run test` – Jest tests.
  - `npm run graph:ingest` – seed Neo4j from Mongo.
  - `npm run upsert` – embed + upsert properties to Pinecone.
- Frontend
  - `cd frontend && npm run dev` – run Next.js dev server.
  - `npm run build && npm start` – production build/start.
  - `npm run test` – Jest; `npm run cypress:open`; `npm run test:selenium`.

## Coding Style & Naming Conventions
- TypeScript everywhere; 2‑space indents; semicolons; single quotes or project default.
- React components: PascalCase. Variables/functions: camelCase.
- Files: Next.js pages lower‑case (e.g., `chat.tsx`, `map.tsx`), backend models `PascalCase.model.ts`.
- Run formatters: `npm run format` in each package. ESLint is configured for the frontend.

## Testing Guidelines
- Frameworks: Jest (unit/integration), Cypress + Selenium (E2E/UI).
- Locations: `backend/tests/`, `frontend/__tests__/`, `frontend/cypress/`, `frontend/selenium/`.
- Name tests `*.test.ts` or `*.spec.ts(x)`. Keep tests fast, deterministic, and independent.

## Commit & Pull Request Guidelines
- Commits: concise imperative subject (e.g., "Add map page deep-linking"). Group related changes.
- PRs: include context, screenshots/links (e.g., `/insights`, `/map`), and how to test. Link issues. Keep diffs focused.

## Security & Configuration Tips
- Never commit secrets. Copy `.env.example` → `.env`. Required keys include `MONGO_URI`, `GOOGLE_AI_API_KEY`, `PINECONE_API_KEY`, and Neo4j (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`).
- Limit map query volume (default cap ~200 markers). Run `npm run graph:ingest` before graph tools.
- Agents: keep patches surgical; follow directory conventions; don’t refactor unrelated code; update docs when adding endpoints or pages.

