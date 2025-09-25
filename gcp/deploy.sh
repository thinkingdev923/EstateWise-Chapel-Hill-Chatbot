#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT=""
REGION="us-east1"
SERVICE_ACCOUNT=""
SKIP_INFRA=0
SKIP_BUILD=0

usage() {
  cat <<USAGE
Deploy EstateWise to Google Cloud (Cloud Run + supporting resources).

Usage: ./deploy.sh --project <PROJECT_ID> [options]

Options:
  --project <id>            GCP project ID (required)
  --region <name>           GCP region (default: us-east1)
  --service-account <email> Cloud Run runtime service account email
  --skip-infra              Skip Deployment Manager (assumes resources exist)
  --skip-build              Skip Cloud Build (deploy previously built image)
  -h, --help                Show this message
USAGE
}

ensure_deployment() {
  local name="$1"
  local config="$2"
  if gcloud deployment-manager deployments describe "$name" --project "$PROJECT" >/dev/null 2>&1; then
    echo "Updating deployment $name"
    gcloud deployment-manager deployments update "$name" --config "$config" --project "$PROJECT"
  else
    echo "Creating deployment $name"
    gcloud deployment-manager deployments create "$name" --config "$config" --project "$PROJECT"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT="$2"; shift 2 ;;
    --region)
      REGION="$2"; shift 2 ;;
    --service-account)
      SERVICE_ACCOUNT="$2"; shift 2 ;;
    --skip-infra)
      SKIP_INFRA=1; shift ;;
    --skip-build)
      SKIP_BUILD=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown flag: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$PROJECT" ]]; then
  echo "Missing --project" >&2
  usage
  exit 1
fi

if [[ -z "$SERVICE_ACCOUNT" ]]; then
  SERVICE_ACCOUNT="estatewise-run@${PROJECT}.iam.gserviceaccount.com"
fi

export CLOUDSDK_CORE_PROJECT="$PROJECT"
export CLOUDSDK_CORE_DISABLE_PROMPTS=1

gcloud config set project "$PROJECT" >/dev/null

echo "Using project: $PROJECT (region: $REGION)"

if [[ $SKIP_INFRA -eq 0 ]]; then
  ensure_deployment estatewise-network "$ROOT_DIR/deployment/networking.yaml"
  ensure_deployment estatewise-service-account "$ROOT_DIR/deployment/service-account.yaml"
  ensure_deployment estatewise-cloudrun "$ROOT_DIR/deployment/cloudrun.yaml"
  ensure_deployment estatewise-storage "$ROOT_DIR/deployment/storage-bucket.yaml"
fi

if [[ $SKIP_BUILD -eq 0 ]]; then
  sa_flag=",_SERVICE_ACCOUNT=$SERVICE_ACCOUNT"
  gcloud builds submit "$ROOT_DIR/.." \
    --config "$ROOT_DIR/cloudbuild.yaml" \
    --substitutions=_REGION=$REGION${sa_flag}
fi

echo "Deployment complete. Current Cloud Run services:"
gcloud run services list --platform=managed --region "$REGION"
