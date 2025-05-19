#!/usr/bin/env bash
set -euo pipefail

echo "🔄  Running backend & frontend concurrently"
concurrently \
  "bash shell/setup_backend.sh" \
  "bash shell/setup_frontend.sh"
