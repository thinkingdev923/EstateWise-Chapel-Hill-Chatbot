#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "📦  Building backend image..."
bash publish_estatewise.sh

echo "📦  Building frontend crawler image..."
bash crawler/publish_crawler.sh

echo "📦  Building newsletters image..."
bash newsletters/publish_newsletters.sh
