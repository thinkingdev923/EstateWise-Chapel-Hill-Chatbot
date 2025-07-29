# GitHub Copilot Instructions for EstateWise Monorepo

Welcome to the **EstateWise** repository! This document guides GitHub Copilot to generate code, configuration, and documentation across all parts of the monorepo, from backend services and frontend apps to data analyses, infrastructure definitions, and the VS Code extension.

---

## 1. Project Overview

- **Repository Type**: Full-stack monorepo
- **Languages & Frameworks**:
  - **Backend:** TypeScript, Express.js, Node.js
  - **Frontend:** TypeScript, Next.js, React, Tailwind CSS, Shadcn UI, Framer Motion
  - **Data & Analytics:** Python (Jupyter), JavaScript
  - **Infrastructure:** Terraform, AWS CloudFormation, Docker, GitHub Actions
  - **Documentation:** Markdown, OpenAPI, JSDoc/TypeDoc
  - **VS Code Extension:** TypeScript, VS Code Extension API
- **Key Directories:**
  - `/backend` – API server, controllers, services, tests
  - `/frontend` – Next.js app, components, pages, visualizations
  - `/data` – Python notebooks, CLI chatbot, EDA scripts
  - `/terraform` & `/aws` / `/gcp` – IaC modules and deployment configs
  - `/extension` – VS Code extension source and tests
  - `/shell` – helper scripts for setup and deployment
  - Root – docs (`README.md`, `TECH_DOCS.md`), CI (`.github/workflows`), Docker, OpenAPI spec

---

## 2. Coding Style & Conventions

### TypeScript & JavaScript
- **Modules & Imports:** ES module syntax (`import ... from ...`).
- **Formatting:** Prettier + ESLint. 2-space indentation; semicolons; single quotes for JS/TS code.
- **Naming:** `camelCase` for variables/functions; `PascalCase` for classes/types; `snake_case` for Python.
- **Typing:** Always specify return types for public functions; prefer interfaces for object shapes.
- **Async/Await:** Use `async/await` over raw Promise chains.

### Python Notebooks & Scripts
- **Style:** PEP8 compliant; use Black for formatting.
- **Imports:** Group standard library, third-party, and local modules.
- **Docstrings:** Use Google style for functions.

### Terraform & IaC
- **Structure:** One module per resource type; clear naming conventions (e.g. `vpc`, `ecs_service`).
- **Variables:** Document inputs in `variables.tf`; default sensible values.
- **Outputs:** Clearly defined outputs for cross-module references.

### Markdown & Docs
- **Headings:** Use `#` through `####` hierarchies.
- **Linking:** Relative links for in-repo docs.
- **Diagrams:** Embed Mermaid or plaintext ASCII as needed.

---

## 3. Common Copilot Prompts

Use these to scaffold consistent code or docs:

### Backend
```ts
// Copilot: scaffold a new Express controller in backend/src/controllers to handle `/api/properties` CRUD operations
```

### Frontend

```tsx
// Copilot: generate a Next.js page at `frontend/pages/properties.tsx` that fetches from `/api/properties` and displays a list
```

### Data & Analytics

```python
# Copilot: write a Python function in data/utils.py to normalize feature columns to [0,1] using pandas
```

### Infrastructure

```hcl
# Copilot: add a Terraform module in terraform/ecs for creating an AWS ECS Fargate service behind an ALB
```

### VS Code Extension

```ts
// Copilot: add a new command in extension/src/extension.ts to open the Visualizations page in a webview
```

### CI/CD & Workflows

```yaml
# Copilot: create a GitHub Actions workflow in .github/workflows/ci.yml that lints, builds, tests, and deploys the monorepo
```

### Documentation

```md
<!-- Copilot: update README.md with instructions for running Docker Compose for both backend and frontend -->
```

---

## 4. Testing & Quality

* **Backend Tests:** Jest or Mocha in `backend/src/test` → compile to `out/test`.
* **Frontend Tests:** Jest + React Testing Library / Cypress in `frontend/__tests__` or `cypress`.
* **Python Tests:** Pytest in `data/tests`.
* **Linting & Formatting:** `npm run lint`, `npm run format`, `black .` in Python.
* **Security Scanning:** Dependabot config, Trivy in CI, CodeQL.

In prompts, refer to test patterns, mock frameworks, and common utilities in each directory.

---

## 5. Documentation Generation

* **OpenAPI:** Keep `openapi.yaml` in root updated; Copilot can scaffold new endpoint specs.
* **JSDoc/TypeDoc:** Scripts `npm run typedoc:backend` and `npm run typedoc:frontend` should update docs.
* **TECH\_DOCS.md:** Detailed system diagrams, data flow, and scaling considerations.

```md
<!-- Copilot: add a sequence diagram in TECH_DOCS.md showing user login flow through backend APIs and JWT verification -->
```

---

## 6. VS Code Extension

* **Activate/Deactivate:** Follow patterns in `extension/src/extension.ts`.
* **Webview Panels:** Use strict CSP and escape interpolated values.
* **Configuration:** Contribute settings in `extension/package.json` under `contributes.configuration`.
* **Testing:** Mock `vscode` API in `extension/src/test` for unit tests.

```ts
// Copilot: add a new setting `openOnLogin` to extension/package.json and update activation code to respect it
```

---

Thank you, Copilot! Let’s keep code and docs aligned across this complex full-stack monorepo. 🚀
