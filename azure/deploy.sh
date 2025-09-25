#!/usr/bin/env bash
# Deploy EstateWise backend to Azure Container Apps using the modular Bicep stack.
#
# Prerequisites:
#   - Azure CLI >= 2.49 logged in (`az login`)
#   - Azure CLI extensions: containerapp, log-analytics
#   - Docker (if using local builds)
#
# Usage:
#   ./deploy.sh \
#     --resource-group estatewise-rg \
#     --location eastus \
#     --env estatewise \
#     --image-tag $(git rev-parse --short HEAD)
#
set -euo pipefail

RESOURCE_GROUP="estatewise-rg"
LOCATION="eastus"
ENVIRONMENT_NAME="estatewise"
IMAGE_TAG="latest"
IMAGE_NAME="estatewise-backend"
JWT_SECRET=""
GOOGLE_AI_API_KEY=""
PINECONE_API_KEY=""
OPENAI_API_KEY=""
PINECONE_INDEX="estatewise-index"
DATABASE_NAME="estatewisedb"
PARAM_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource-group)
      RESOURCE_GROUP="$2"; shift 2 ;;
    --location)
      LOCATION="$2"; shift 2 ;;
    --env|--environment-name)
      ENVIRONMENT_NAME="$2"; shift 2 ;;
    --image-tag)
      IMAGE_TAG="$2"; shift 2 ;;
    --image-name)
      IMAGE_NAME="$2"; shift 2 ;;
    --jwt-secret)
      JWT_SECRET="$2"; shift 2 ;;
    --google-ai-api-key)
      GOOGLE_AI_API_KEY="$2"; shift 2 ;;
    --pinecone-api-key)
      PINECONE_API_KEY="$2"; shift 2 ;;
    --openai-api-key)
      OPENAI_API_KEY="$2"; shift 2 ;;
    --pinecone-index)
      PINECONE_INDEX="$2"; shift 2 ;;
    --database-name)
      DATABASE_NAME="$2"; shift 2 ;;
    --parameters)
      PARAM_FILE="$2"; shift 2 ;;
    *)
      echo "Unknown flag: $1" >&2; exit 1 ;;
  esac
done

az config set defaults.group="$RESOURCE_GROUP" defaults.location="$LOCATION" >/dev/null

echo "➡️  Ensuring resource group $RESOURCE_GROUP exists in $LOCATION"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" >/dev/null

# Build + push container into ACR once registry exists (Bicep will create it if needed)
BUILD_TAG="$IMAGE_TAG"

# Deploy infrastructure first (ACR is provisioned here)
BICEP_ARGS=(
  --template-file infra/main.bicep
  --parameters environmentName="$ENVIRONMENT_NAME" \
               imageName="$IMAGE_NAME" \
               imageTag="$BUILD_TAG" \
               databaseName="$DATABASE_NAME" \
               pineconeIndex="$PINECONE_INDEX"
)

if [[ -n "$JWT_SECRET" ]]; then
  BICEP_ARGS+=(jwtSecret="$JWT_SECRET")
fi
if [[ -n "$GOOGLE_AI_API_KEY" ]]; then
  BICEP_ARGS+=(googleAiApiKey="$GOOGLE_AI_API_KEY")
fi
if [[ -n "$PINECONE_API_KEY" ]]; then
  BICEP_ARGS+=(pineconeApiKey="$PINECONE_API_KEY")
fi
if [[ -n "$OPENAI_API_KEY" ]]; then
  BICEP_ARGS+=(openAiApiKey="$OPENAI_API_KEY")
fi
if [[ -n "$PARAM_FILE" ]]; then
  BICEP_ARGS+=("@${PARAM_FILE}")
fi

DEPLOYMENT_NAME="estatewise-$(date +%s)"

echo "🚀 Deploying infrastructure via Bicep (deployment $DEPLOYMENT_NAME)"
az deployment group create --name "$DEPLOYMENT_NAME" "${BICEP_ARGS[@]}"

ACR_NAME=$(az deployment group show --name "$DEPLOYMENT_NAME" --query "properties.outputs.acrLoginServer.value" -o tsv)
ACR_REGISTRY=${ACR_NAME%%.*}
FULL_REGISTRY="${ACR_NAME}"
IMAGE_URI="$FULL_REGISTRY/$IMAGE_NAME:$BUILD_TAG"

# Build & push container image
if ! az acr show --name "$ACR_REGISTRY" >/dev/null 2>&1; then
  echo "Waiting for ACR $ACR_REGISTRY to finish provisioning..."
  az acr show --name "$ACR_REGISTRY" --query name -o tsv >/dev/null
fi

echo "🔐 Logging in to Azure Container Registry $FULL_REGISTRY"
az acr login --name "$ACR_REGISTRY" >/dev/null

echo "🐳 Building Docker image $IMAGE_URI"
docker build -t "$IMAGE_URI" -f backend/Dockerfile .

echo "📦 Pushing image to ACR"
docker push "$IMAGE_URI"

echo "📡 Forcing Container Apps revision update"
az containerapp revision list --name "${ENVIRONMENT_NAME}-backend-ca" --environment "${ENVIRONMENT_NAME}-aca-env" >/dev/null 2>&1 || true
az containerapp update \
  --name "${ENVIRONMENT_NAME}-backend-ca" \
  --environment "${ENVIRONMENT_NAME}-aca-env" \
  --image "$IMAGE_URI" \
  --set-env-vars VERSION="$BUILD_TAG" >/dev/null

APP_FQDN=$(az containerapp show --name "${ENVIRONMENT_NAME}-backend-ca" --output tsv --query properties.configuration.ingress.fqdn)

echo "✅ Deployment complete: https://$APP_FQDN"
