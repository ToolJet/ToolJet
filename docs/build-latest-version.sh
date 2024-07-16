#!/bin/bash
set -e

# Extract lastVersion from docusaurus.config.js
LAST_VERSION=$(grep -Po '(?<=lastVersion: ")[^"]*' docusaurus.config.js)

if [ -z "$LAST_VERSION" ]; then
  echo "Error: lastVersion not found in docusaurus.config.js"
  exit 1
fi

echo "Found lastVersion: $LAST_VERSION"

# Update versions.json to include only lastVersion
jq -n --arg version "$LAST_VERSION" '[$version]' > tmp_versions.json
mv tmp_versions.json versions.json

# Install dependencies and build the project
npm i && npm run build

exec "$@"
