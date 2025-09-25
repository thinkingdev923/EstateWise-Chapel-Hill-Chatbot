# Azure Deployment (Container Apps)

![Azure](https://img.shields.io/badge/Microsoft_Azure-Cloud-blue?logo=microsoft-azure) ![Bicep](https://img.shields.io/badge/Bicep-Infrastructure-blue?logo=azure-bicep) ![Container_Apps](https://img.shields.io/badge/Azure_Container_Apps-Serverless-blue?logo=azure)

The Azure stack has been reworked around Azure Container Apps, modular Bicep, and Key Vault-backed secrets. It provisions a fully managed runtime for the EstateWise backend with secure networking, observability, and streamlined CI/CD. For the multi-cloud comparison table see [DEPLOYMENTS.md](../DEPLOYMENTS.md).

## Architecture Overview

- **Networking**: `modules/network.bicep` creates a VNet with dedicated subnets for Container Apps infrastructure and workloads.
- **Observability**: `modules/logAnalytics.bicep` provisions Log Analytics + Application Insights; container logs stream directly into the workspace.
- **Data layer**: `modules/data.bicep` stands up ACR (System-assigned identity), Storage (for map assets), and Cosmos DB (Mongo API).
- **Secrets**: `modules/security.bicep` stores generated connection strings in Key Vault and optionally persists application secrets (JWT, Pinecone, LLM keys).
- **Runtime**: `modules/container-app.bicep` creates a Container Apps environment, assigns system identity, and injects secrets from Key Vault. Autoscaling is driven by HTTP concurrency (1 → 5 replicas by default).

All modules are orchestrated via `infra/main.bicep`.

```bash
# Deploy from the repo root
az group create -g estatewise-rg -l eastus
./deploy.sh --resource-group estatewise-rg --location eastus --env estatewise --image-tag $(git rev-parse --short HEAD) \
  --jwt-secret <jwt> --google-ai-api-key <gemini> --pinecone-api-key <pinecone>
```

The script will:
1. Deploy the modular Bicep template (`infra/main.bicep`).
2. Build and push the backend container to the newly created ACR.
3. Update the Container App to the fresh image + set a `VERSION` environment variable.

Outputs include the Container App FQDN, Key Vault URI, and connection strings (also stored in Key Vault).

## Parameter Reference

| Parameter | Description |
|-----------|-------------|
| `environmentName` | Short name used to prefix resources (defaults to `estatewise`). |
| `imageName` / `imageTag` | The container repo/tag to deploy (ACR login server is derived automatically). |
| `jwtSecret`, `googleAiApiKey`, `pineconeApiKey`, `openAiApiKey` | Optional secrets; empty values are ignored. |
| `pineconeIndex` | Injected into the container app for Pinecone lookups. |

Additional secrets can be added by extending `main.bicep` with new entries inside `optionalSecrets` and `secretMappings`.

## Azure DevOps Pipeline

`azure/azure-pipelines.yml` now performs two stages:
1. **Build:** `az acr build` builds/pushes the backend container inside ACR and surfaces the image tag as a pipeline variable.
2. **Deploy:** `az containerapp update` swaps the container image (and updates a `VERSION` env var) to trigger a new revision.

Required pipeline variables:
- `AZURE_SUBSCRIPTION`: Service connection name.
- `RESOURCE_GROUP`, `ENVIRONMENT_NAME`, `ACR_NAME`.

## Observability + Access

- Container logs: query Log Analytics workspace `${environmentName}-law`.
- Application Insights connection string is injected into the container via env var.
- The Container App identity receives `AcrPull` and `Key Vault Secrets User` roles automatically.

## Customisation Tips

- Swap `minReplicas` / `maxReplicas` parameters in `main.bicep` for different scaling behaviour.
- Add additional Container Apps (e.g., orchestrator, workers) by reusing `modules/container-app.bicep` with new parameters.
- Set custom domains via `az containerapp ingress custom-domain list/add` once DNS + certificates are ready.
