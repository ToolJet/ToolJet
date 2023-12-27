#!/bin/bash
set -e

# Display the un-modified file content
cat docs/versions.json

# Use head to extract the first version
head -n 1 docs/versions.json > tmp_versions.json
mv tmp_versions.json docs/versions.json

npm i && npm run build

exec "$@"