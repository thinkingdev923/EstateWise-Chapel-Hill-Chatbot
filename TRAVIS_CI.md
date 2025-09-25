# Travis CI

This project includes a Travis CI pipeline that keeps the backend and frontend healthy by installing dependencies, building the code, and running automated tests in separate stages. The configuration lives in `.travis.yml` at the repository root.

## Pipeline Overview

- **Environment:** Ubuntu Focal images with Node.js 20.
- **Caching:** npm cache is persisted between runs to speed up installs.
- **Global variables:** `CI=true`, `NEXT_TELEMETRY_DISABLED=1`, and a quieter npm log level are exported for consistency with other CI providers.
- **Stages:**
  - **Backend build & tests:** Runs `npm --prefix backend ci`, `npm --prefix backend run build`, and `npm --prefix backend test`.
  - **Frontend build & tests:** Runs `npm --prefix frontend ci`, `npm --prefix frontend run lint`, `npm --prefix frontend run build`, and `npm --prefix frontend test`.

## Enabling Travis CI for the Repository

1. Sign in to [Travis CI](https://app.travis-ci.com/) with your GitHub account and authorize access to the repository.
2. From your Travis CI dashboard, enable the repository and trigger the first build (either from the Travis UI or by pushing a commit).
3. In the Travis project settings, add encrypted environment variables for the secrets the build requires, such as:
   - `MONGO_URI`
   - `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
   - `GOOGLE_AI_API_KEY`
   - `PINECONE_API_KEY`
   - Any additional keys used by optional integrations (e.g., analytics, mapping providers).
4. If the build needs access to external services (databases, APIs), make sure the credentials are scoped to CI usage and read-only where possible.

## Working Locally with Travis Commands

- Run `npm --prefix backend run build` and `npm --prefix backend test` to reproduce backend stages locally.
- Run `npm --prefix frontend run lint`, `npm --prefix frontend run build`, and `npm --prefix frontend test` to mirror the frontend stage.
- Keep local Node.js versions aligned with the CI default (Node 20) to minimize discrepancies.

## Maintenance Tips

- Update `.travis.yml` whenever backend/frontend build commands change so CI remains accurate.
- Monitor Travis build history for flaky tests; stabilize or quarantine failing suites before merging.
- Use Travis build badges or links in documentation so contributors can quickly verify build status.
- Combine Travis with existing GitHub Actions workflows when you want redundant CI or different gating logic.
