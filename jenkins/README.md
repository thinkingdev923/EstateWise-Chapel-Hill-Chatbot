# Jenkins Pipeline Reference

![Jenkins Badge](https://img.shields.io/badge/Jenkins-Blue?style=flat&logo=jenkins&logoColor=white)

This directory contains reusable Jenkinsfiles that power EstateWise’s multi-cloud CI/CD pipeline. The entrypoint is [`workflow.Jenkinsfile`](workflow.Jenkinsfile), which orchestrates builds, tests, artifact publishing, and optional deployments to AWS, Azure, GCP, HashiCorp/Kubernetes, and Vercel.

## Jenkinsfiles

| File | Purpose |
|------|---------|
| `workflow.Jenkinsfile` | Main pipeline: checkout → lint/tests → Docker builds → security scans → multi-cloud deploy toggles → Vercel notify. |
| `ci.Jenkinsfile` | Lightweight CI pipeline used in branches to run unit/integration suites without deployment stages. |
| `analyze-code.Jenkinsfile` | Static analysis at scale (CodeQL, linting, dependency audits). |
| `analyze-repo.Jenkinsfile` | Repository hygiene tasks (license checks, dependency freshness). |

## Multibranch Pipeline Setup

1. Create a Jenkins job of type **Multibranch Pipeline**.
2. Point it to your Git repo and set the scan interval (e.g., every 5 minutes).
3. Ensure credentials exist for:
   - GitHub/Source control checkout
   - GHCR (or target registry) `usernamePassword` credential with ID `ghcr`
4. Optional: define environment variables at the job level to control deployments (see below).

## Environment Variables & Secrets

| Variable | Description |
|----------|-------------|
| `DEPLOY_AWS` | `1` to run `aws/deploy.sh` (requires `AWS_DEPLOY_ARGS` or default config). |
| `DEPLOY_AZURE` | `1` to run `azure/deploy.sh`. |
| `DEPLOY_GCP` | `1` to run `gcp/deploy.sh`. |
| `DEPLOY_HASHICORP` | `1` to run `hashicorp/deploy.sh`. |
| `DEPLOY_K8S_MANIFESTS` | `1` to apply `kubectl apply -k` (defaults to `kubernetes/base`; override with `K8S_APPLY_PATH`). |
| `DEPLOY_AGENTIC` | `1` to run `agentic-ai/deploy.sh`. |
| `DEPLOY_MCP` | `1` to run `mcp/deploy.sh`. |
| `DEPLOY_B64` | Base64 encoded bash script executed in the “Infra Deploy” stage (legacy hook). |
| `AWS_DEPLOY_ARGS` | Extra CLI parameters for `aws/deploy.sh` (e.g., `"--region us-east-1"`). |
| `AZURE_DEPLOY_ARGS` | Additional arguments for `azure/deploy.sh`. |
| `GCP_DEPLOY_ARGS` | Additional arguments for `gcp/deploy.sh`. |
| `HASHICORP_DEPLOY_ARGS` | Additional arguments for `hashicorp/deploy.sh`. |
| `K8S_APPLY_PATH` | Custom path for `kubectl apply -k` during the Kubernetes stage. |
| `AGENTIC_DEPLOY_ARGS` | Arguments forwarded to `agentic-ai/deploy.sh` (e.g., `--target aws`). |
| `MCP_DEPLOY_ARGS` | Arguments forwarded to `mcp/deploy.sh`. |
| `DB_CHECK` | Optional base64 script run prior to tests for smoke-checking database connectivity. |

Secrets such as cloud credentials are managed via Jenkins credentials (e.g., AWS `withAWS`, Azure service principals, GCP JSON key files), or by injecting environment variables stored in credential bindings.

## Pipeline Stages Overview

```mermaid
flowchart TD
  Checkout --> Lint
  Lint --> BackendTests
  Lint --> FrontendTests
  BackendTests --> BuildBackend
  FrontendTests --> BuildFrontend
  BuildBackend --> VulnerabilityScan
  BuildFrontend --> VulnerabilityScan
  VulnerabilityScan --> Benchmarks
  Benchmarks --> DeployToggle
  DeployToggle -->|AWS/Azure/GCP/HashiCorp/K8s| MultiDeploy
  MultiDeploy --> VercelNotify
  VercelNotify --> Done
```

Key stage notes:
- **Cache Dependencies**: uses `npm ci` with `--legacy-peer-deps` for reproducible installs.
- **Build & Push Backend/Frontend Image**: tags both commit SHA and `latest` before pushing to GHCR (swap registry via `REGISTRY` env).
- **Image Vulnerability Scan**: runs Trivy in non-blocking mode (adjust `--exit-code` to enforce gating).
- **Performance Benchmark**: simple Artillery smoke test; extend or disable as needed.
- **Multi-Cloud Deploy**: executes requested platform scripts in parallel.
- **Vercel Deploy**: placeholder stage to trigger Vercel deployments/notifications.

## Running Locally (Jenkinsfile Runner)

You can validate pipeline changes before pushing using Jenkinsfile Runner:

```bash
docker run --rm -v "$PWD":/workspace jenkins/jenkinsfile-runner \
  -w /workspace -p workflow.Jenkinsfile
```

## Tips

- Keep environment-specific secrets/project IDs outside of the repo; inject them via Jenkins credentials.
- For Terraform/HashiCorp deploys, provide kubeconfig paths using `HASHICORP_DEPLOY_ARGS="--kubeconfig /var/lib/jenkins/.kube/config --do-apply"`.
- Combine with Jenkins shared libraries if you want to re-use stages across repositories.
- Monitor job results via Jenkins Blue Ocean or the classic UI; failing stages surface the command output from the shell steps.

With the provided scripts and Jenkinsfiles, you can deliver EstateWise to production across AWS, Azure, GCP, Kubernetes, or Vercel with a single pipeline.
