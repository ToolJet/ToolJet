#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MARKETPLACE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📦 Installing AWS SDK v3 dependencies..."
npm install --no-save --prefix "$MARKETPLACE_DIR" @aws-sdk/client-s3 @aws-sdk/lib-storage

echo ""
echo "🚀 Running upload-to-s3.js..."
node "$SCRIPT_DIR/upload-to-s3.js" "$@"
