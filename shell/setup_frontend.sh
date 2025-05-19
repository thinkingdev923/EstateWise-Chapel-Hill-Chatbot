#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../frontend"

echo "🛠  Installing frontend dependencies..."
npm install

echo "🔨  Building frontend..."
npm run build

echo "🚀  Starting frontend (dev mode)..."
npm run dev
