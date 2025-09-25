#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$ROOT_DIR/terraform"

KUBECONFIG_PATH="${KUBECONFIG:-$HOME/.kube/config}"
KUBE_CONTEXT=""
ESTATEWISE_NAMESPACE="estatewise"
MESH_NAMESPACE="estatewise-mesh"
PLAN_ONLY=1
TF_ACTION_ARGS=()

usage() {
  cat <<USAGE
HashiCorp Terraform deployment helper

Usage: ./deploy.sh [options]

Options:
  --kubeconfig <path>       Path to kubeconfig (default: $HOME/.kube/config)
  --context <name>          kubeconfig context to use (optional)
  --namespace <name>        Kubernetes namespace for EstateWise apps (default: estatewise)
  --mesh-namespace <name>   Namespace for Consul components (default: estatewise-mesh)
  --var key=value           Forward extra Terraform variables
  --do-apply                Run terraform apply (otherwise plan only)
  --destroy                 Destroy the stack instead of apply
  -h, --help                Show this help message
USAGE
}

ACTION="plan"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --kubeconfig)
      KUBECONFIG_PATH="$2"; shift 2 ;;
    --context)
      KUBE_CONTEXT="$2"; shift 2 ;;
    --namespace)
      ESTATEWISE_NAMESPACE="$2"; shift 2 ;;
    --mesh-namespace)
      MESH_NAMESPACE="$2"; shift 2 ;;
    --var)
      TF_ACTION_ARGS+=(-var "$2"); shift 2 ;;
    --do-apply)
      PLAN_ONLY=0; ACTION="apply"; shift ;;
    --destroy)
      PLAN_ONLY=0; ACTION="destroy"; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown flag: $1" >&2; usage; exit 1 ;;
  esac
done

export KUBE_CONFIG_PATH="$KUBECONFIG_PATH"

pushd "$TF_DIR" >/dev/null

terraform init -upgrade

BASE_VARS=(
  -var "kubeconfig_path=$KUBECONFIG_PATH"
  -var "kube_context=$KUBE_CONTEXT"
  -var "estatewise_namespace=$ESTATEWISE_NAMESPACE"
  -var "hashicorp_namespace=$MESH_NAMESPACE"
)

if [[ $PLAN_ONLY -eq 1 ]]; then
  terraform plan "${BASE_VARS[@]}" "${TF_ACTION_ARGS[@]}"
else
  terraform "$ACTION" "${BASE_VARS[@]}" "${TF_ACTION_ARGS[@]}"
fi

popd >/dev/null
