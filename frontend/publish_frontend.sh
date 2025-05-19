#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------
# Configuration
# ---------------------------------------------
IMAGE="ghcr.io/hoangsonww/estatewise-frontend:latest"

: "${GITHUB_ACTOR:?Please export GITHUB_ACTOR=<your GitHub username>}"
: "${GH_TOKEN:?Please export GH_TOKEN=<your PAT with write:packages>}"

# ---------------------------------------------
# 1) Build the Docker image
# ---------------------------------------------
echo "🔨 Building Docker image ${IMAGE}"
docker build -t "${IMAGE}" .

# ---------------------------------------------
# 2) Authenticate with GitHub Container Registry
# ---------------------------------------------
echo "🔐 Logging in to GHCR as ${GITHUB_ACTOR}"
echo "${GH_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

# ---------------------------------------------
# 3) Push the image
# ---------------------------------------------
echo "📤 Pushing ${IMAGE}"
docker push "${IMAGE}"

echo "✅ Done! Frontend image available at ${IMAGE}"
