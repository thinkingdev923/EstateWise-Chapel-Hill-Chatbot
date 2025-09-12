# Azure Deployment

This directory contains infrastructure templates and helper scripts for deploying the EstateWise backend to Microsoft Azure.

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/) authenticated to your subscription
- Docker installed locally
- An existing Azure Container Registry or permissions to create one

## Quick Start

1. **Provision infrastructure** using the Bicep template:
   ```bash
   az deployment sub create \
     --name estatewise-deploy \
     --location eastus \
     --template-file infra/main.bicep
   ```

2. **Deploy the application** using the helper script:
   ```bash
   ./deploy.sh
   ```

3. **CI/CD** is handled through `azure-pipelines.yml`, which builds the Docker image, pushes it to ACR, and deploys the Web App.

> Update environment variables such as `MONGO_URI` or API keys in Azure before running the application.
