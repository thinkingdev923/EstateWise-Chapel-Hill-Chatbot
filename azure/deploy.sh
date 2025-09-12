#!/usr/bin/env bash
# Deploys the EstateWise backend to Azure Web App for Containers.
# Requires Azure CLI to be logged in.

set -euo pipefail

RESOURCE_GROUP=${RESOURCE_GROUP:-estatewise-rg}
LOCATION=${LOCATION:-eastus}
ACR_NAME=${ACR_NAME:-estatewiseacr}
APP_NAME=${APP_NAME:-estatewise-backend}
IMAGE_TAG=${IMAGE_TAG:-latest}
STORAGE_ACCOUNT=${STORAGE_ACCOUNT:-estatewisestorage}
COSMOS_ACCOUNT=${COSMOS_ACCOUNT:-estatewisecosmos}
APP_INSIGHTS=${APP_INSIGHTS:-estatewise-ai}
VAULT_NAME=${VAULT_NAME:-estatewisekv}
DATABASE_NAME=${DATABASE_NAME:-estatewisedb}

# Create resource group
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Create Azure Container Registry if it doesn't exist
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true
fi

# Create Storage Account if it doesn't exist
if ! az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az storage account create --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --sku Standard_LRS
fi

# Create Cosmos DB for Mongo API if it doesn't exist
if ! az cosmosdb show --name "$COSMOS_ACCOUNT" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az cosmosdb create --name "$COSMOS_ACCOUNT" --resource-group "$RESOURCE_GROUP" --kind MongoDB --locations regionName="$LOCATION" failoverPriority=0 isZoneRedundant=False
  az cosmosdb mongodb database create --account-name "$COSMOS_ACCOUNT" --resource-group "$RESOURCE_GROUP" --name "$DATABASE_NAME"
fi

# Create Application Insights if it doesn't exist
if ! az monitor app-insights component show --app "$APP_INSIGHTS" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az monitor app-insights component create --app "$APP_INSIGHTS" --location "$LOCATION" --resource-group "$RESOURCE_GROUP" --application-type web
fi

# Create Key Vault if it doesn't exist
if ! az keyvault show --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az keyvault create --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION"
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

# Retrieve connection strings and configure app settings
COSMOS_CONN=$(az cosmosdb keys list --name "$COSMOS_ACCOUNT" --resource-group "$RESOURCE_GROUP" --type connection-strings --query "connectionStrings[0].connectionString" -o tsv)
STORAGE_CONN=$(az storage account show-connection-string --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" -o tsv)
APPINSIGHTS_KEY=$(az monitor app-insights component show --app "$APP_INSIGHTS" --resource-group "$RESOURCE_GROUP" --query instrumentationKey -o tsv)
APPINSIGHTS_CONN=$(az monitor app-insights component show --app "$APP_INSIGHTS" --resource-group "$RESOURCE_GROUP" --query connectionString -o tsv)

az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    MONGO_URI="$COSMOS_CONN" \
    AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONN" \
    APPINSIGHTS_INSTRUMENTATIONKEY="$APPINSIGHTS_KEY" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CONN"

echo "Deployment complete. Web app URL: https://$APP_NAME.azurewebsites.net"
