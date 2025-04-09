#!/bin/bash
set -e

VERSIONS_FILE="versions.json"

# Ensure versions.json exists
if [ ! -f "$VERSIONS_FILE" ]; then
  echo "Error: $VERSIONS_FILE not found."
  exit 1
fi

# Output existing versions from versions.json for reference
echo "Using versions from $VERSIONS_FILE:"
jq . "$VERSIONS_FILE"

# Install dependencies and build the project
npm i && npm run build

exec "$@"