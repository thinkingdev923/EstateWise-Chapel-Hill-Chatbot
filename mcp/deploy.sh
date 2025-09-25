#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)

target="${MCP_DEPLOY_TARGET:-}"

usage() {
  cat <<USAGE
Deploy the EstateWise MCP server.

Usage: ./mcp/deploy.sh --target <aws|azure|gcp|compose|k8s>
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      target="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown flag: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$target" ]]; then
  echo "Missing --target; set MCP_DEPLOY_TARGET or pass --target" >&2
  exit 1
fi

case "$target" in
  aws)
    : "${MCP_AWS_CLUSTER:?Set MCP_AWS_CLUSTER}"
    : "${MCP_AWS_EXEC_ROLE:?Set MCP_AWS_EXEC_ROLE}"
    : "${MCP_AWS_IMAGE:?Set MCP_AWS_IMAGE}"
    : "${MCP_AWS_SUBNETS:?Set MCP_AWS_SUBNETS}"
    : "${MCP_AWS_SECURITY_GROUPS:?Set MCP_AWS_SECURITY_GROUPS}"
    REGION=${MCP_AWS_REGION:-us-east-1}
    STACK=${MCP_AWS_STACK:-estatewise-mcp}
    ENV=${MCP_AWS_ENV:-estatewise}
    PARAMS=(
      EnvironmentName=$ENV
      ClusterName=$MCP_AWS_CLUSTER
      ExecutionRoleArn=$MCP_AWS_EXEC_ROLE
      ContainerImage=$MCP_AWS_IMAGE
      SubnetIds=$MCP_AWS_SUBNETS
      SecurityGroupIds=$MCP_AWS_SECURITY_GROUPS
      ApiBaseUrl=${MCP_AWS_API_BASE_URL:-https://estatewise-backend.vercel.app}
      FrontendBaseUrl=${MCP_AWS_FRONTEND_BASE_URL:-https://estatewise.vercel.app}
      CacheTtlMs=${MCP_AWS_CACHE_TTL_MS:-30000}
      CacheMax=${MCP_AWS_CACHE_MAX:-200}
    )
    aws cloudformation deploy \
      --region "$REGION" \
      --stack-name "$STACK" \
      --template-file "$SCRIPT_DIR/aws/ecs-service.yaml" \
      --capabilities CAPABILITY_NAMED_IAM \
      --parameter-overrides "${PARAMS[@]}"
    ;;
  azure)
    : "${MCP_AZURE_RG:?Set MCP_AZURE_RG}"
    : "${MCP_AZURE_IMAGE:?Set MCP_AZURE_IMAGE}"
    : "${MCP_AZURE_REGISTRY_SERVER:?Set MCP_AZURE_REGISTRY_SERVER}"
    : "${MCP_AZURE_LAW_ID:?Set MCP_AZURE_LAW_ID}"
    : "${MCP_AZURE_LAW_CUSTOMER_ID:?Set MCP_AZURE_LAW_CUSTOMER_ID}"
    : "${MCP_AZURE_LAW_SHARED_KEY:?Set MCP_AZURE_LAW_SHARED_KEY}"
    az deployment group create \
      --resource-group "$MCP_AZURE_RG" \
      --template-file "$SCRIPT_DIR/azure/containerapp.bicep" \
      --parameters \
        containerImage="$MCP_AZURE_IMAGE" \
        registryServer="$MCP_AZURE_REGISTRY_SERVER" \
        logAnalyticsWorkspaceId="$MCP_AZURE_LAW_ID" \
        logAnalyticsCustomerId="$MCP_AZURE_LAW_CUSTOMER_ID" \
        logAnalyticsSharedKey="$MCP_AZURE_LAW_SHARED_KEY" \
        apiBaseUrl="${MCP_AZURE_API_BASE_URL:-https://estatewise-backend.vercel.app}" \
        frontendBaseUrl="${MCP_AZURE_FRONTEND_BASE_URL:-https://estatewise.vercel.app}" \
        cacheTtlMs=${MCP_AZURE_CACHE_TTL_MS:-30000} \
        cacheMax=${MCP_AZURE_CACHE_MAX:-200}
    ;;
  gcp)
    : "${MCP_GCP_PROJECT:?Set MCP_GCP_PROJECT}"
    : "${MCP_GCP_REGION:?Set MCP_GCP_REGION}"
    : "${MCP_GCP_SERVICE_ACCOUNT:?Set MCP_GCP_SERVICE_ACCOUNT}"
    : "${MCP_GCP_IMAGE:?Set MCP_GCP_IMAGE}"
    DEPLOY=${MCP_GCP_DEPLOYMENT:-estatewise-mcp}
    if gcloud deployment-manager deployments describe "$DEPLOY" --project "$MCP_GCP_PROJECT" >/dev/null 2>&1; then
      ACTION=update
    else
      ACTION=create
    fi
    gcloud deployment-manager deployments "$ACTION" "$DEPLOY" \
      --project "$MCP_GCP_PROJECT" \
      --config "$SCRIPT_DIR/gcp/cloudrun.yaml" \
      --properties "region=${MCP_GCP_REGION},image=${MCP_GCP_IMAGE},serviceAccount=${MCP_GCP_SERVICE_ACCOUNT},apiBaseUrl=${MCP_GCP_API_BASE_URL:-https://estatewise-backend.vercel.app},frontendBaseUrl=${MCP_GCP_FRONTEND_BASE_URL:-https://estatewise.vercel.app},cacheTtlMs=${MCP_GCP_CACHE_TTL_MS:-30000},cacheMax=${MCP_GCP_CACHE_MAX:-200}"
    ;;
  compose)
    docker compose -f "$SCRIPT_DIR/docker-compose.yaml" up -d --build
    ;;
  k8s)
    kubectl apply -f "$SCRIPT_DIR/k8s/sidecar-example.yaml"
    ;;
  *)
    echo "Unknown target: $target" >&2
    usage
    exit 1
    ;;
esac
