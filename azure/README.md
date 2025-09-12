# Azure Deployment

This directory contains infrastructure templates and helper scripts for deploying the EstateWise backend to Microsoft Azure.

Provisioned resources include:

- Azure Container Registry
- App Service plan and Web App for container hosting
- Azure Storage account
- Azure Cosmos DB (Mongo API)
- Azure Key Vault
- Azure Application Insights

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/) authenticated to your subscription
- Docker installed locally
- An existing Azure Container Registry or permissions to create one

## Quick Start

1. **Provision infrastructure** using the Bicep template, which sets up the container registry, web app, storage account, Cosmos DB, Key Vault, and Application Insights:
   ```bash
   az deployment sub create \
     --name estatewise-deploy \
     --location eastus \
     --template-file infra/main.bicep
   ```

2. **Deploy the application** using the helper script, which builds the container image, ensures the supporting services exist, and configures the Web App with required connection strings:
   ```bash
   ./deploy.sh
   ```

3. **CI/CD** is handled through `azure-pipelines.yml`, which builds the Docker image, pushes it to ACR, deploys the Web App, and sets application settings from the provisioned services.

> Secrets such as database connection strings are stored in application settings; consider moving them to Key Vault for production environments.
