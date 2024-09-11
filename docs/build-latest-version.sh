#!/bin/bash
set -e

CONFIG_FILE="docusaurus.config.js"

# Extract lastVersion from docusaurus.config.js using sed
LAST_VERSION=$(sed -n "s/.*lastVersion: *'\\([^']*\\)'.*/\\1/p" "$CONFIG_FILE")
if [ -z "$LAST_VERSION" ]; then
  echo "Error: lastVersion not found in $CONFIG_FILE"
  exit 1
fi
echo "Found lastVersion: $LAST_VERSION"

# Extract all version numbers from the entire file
ALL_VERSIONS=$(grep -oE "'[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z]+)?'" "$CONFIG_FILE" | sed "s/'//g" | sort -u -V -r)
if [ -z "$ALL_VERSIONS" ]; then
  echo "Error: No versions found in $CONFIG_FILE"
  exit 1
fi
echo "Found raw versions:"
echo "$ALL_VERSIONS"

# Convert the extracted versions into a JSON array format
VERSION_ARRAY=$(echo "$ALL_VERSIONS" | jq -R -s -c 'split("\n")[:-1] + ["'"$LAST_VERSION"'"] | unique')
echo "Updating versions.json with: $VERSION_ARRAY"

# Update versions.json with combined data
echo $VERSION_ARRAY | jq . > versions.json

# Install dependencies and build the project
npm i && npm run build

exec "$@"