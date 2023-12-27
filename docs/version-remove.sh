#!/bin/bash
set -e

# Use head to extract the first version
jq -r '.[0]' versions.json > tmp_versions.json
mv tmp_versions.json versions.json

npm i && npm run build

exec "$@"