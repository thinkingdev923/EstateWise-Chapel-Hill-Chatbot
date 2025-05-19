#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🔧  Starting services with Docker Compose..."
docker-compose up -d --build

echo "✅  All services are up and running."
echo " - Backend: http://localhost:3001"
echo " - Frontend: http://localhost:3000"
