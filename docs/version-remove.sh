#!/bin/bash
set -e

# Use head to extract the first version
head -n 1 versions.json > tmp_versions.json
mv tmp_versions.json versions.json

npm i && npm run build

exec "$@"