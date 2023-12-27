#!/bin/bash
set -e

jq '[.[0]]' versions.json > tmp_versions.json
mv tmp_versions.json versions.json

npm i && npm run build

exec "$@"
