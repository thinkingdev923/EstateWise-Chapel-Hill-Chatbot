#!/usr/bin/env bash
set -euo pipefail

echo "🚀  Pushing backend image..."
bash shell/publish_estatewise.sh

echo "🚀  Pushing crawler image..."
bash crawler/publish_crawler.sh

echo "🚀  Pushing newsletters image..."
bash newsletters/publish_newsletters.sh
