#!/usr/bin/env bash
# Deploys the EstateWise backend to Azure Web App for Containers.
# Requires Azure CLI to be logged in.

set -euo pipefail

RESOURCE_GROUP=${RESOURCE_GROUP:-estatewise-rg}
LOCATION=${LOCATION:-eastus}
ACR_NAME=${ACR_NAME:-estatewiseacr}
APP_NAME=${APP_NAME:-estatewise-backend}
IMAGE_TAG=${IMAGE_TAG:-latest}

# Create resource group
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Create Azure Container Registry if it doesn't exist
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true
fi

LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query "loginServer" -o tsv)

# Build and push image to ACR
az acr build \
  --registry "$ACR_NAME" \
  --image "$APP_NAME:$IMAGE_TAG" \
  -f backend/Dockerfile .

# Create App Service plan and Web App
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group "$RESOURCE_GROUP" \
  --sku B1 --is-linux

az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "${APP_NAME}-plan" \
  --deployment-container-image-name "$LOGIN_SERVER/$APP_NAME:$IMAGE_TAG"

# Configure container registry credentials
az webapp config container set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --docker-custom-image-name "$LOGIN_SERVER/$APP_NAME:$IMAGE_TAG" \
  --docker-registry-server-url "https://$LOGIN_SERVER"

echo "Deployment complete. Web app URL: https://$APP_NAME.azurewebsites.net"
