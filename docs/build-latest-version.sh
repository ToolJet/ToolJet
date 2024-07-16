#!/bin/bash
set -e

# Extract lastVersion from docusaurus.config.js using sed
LAST_VERSION=$(sed -n 's/.*lastVersion:[[:space:]]*'\''\([^'\'']*\)'\''.*/\1/p' docusaurus.config.js)

if [ -z "$LAST_VERSION" ]; then
  echo "Error: lastVersion not found in docusaurus.config.js"
  exit 1
fi

echo "Found lastVersion: $LAST_VERSION"

# Update versions.json to include only lastVersion
jq -n --arg version "$LAST_VERSION" '[$version]' > versions.json

# Install dependencies and build the project
npm i && npm run build

exec "$@"
