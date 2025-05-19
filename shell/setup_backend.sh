#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../server"

echo "🛠  Installing backend dependencies..."
npm install

echo "🌱  Generating build artifacts..."
npm run build

echo "🚀  Starting backend (dev mode)..."
npm run start
