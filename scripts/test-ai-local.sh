#!/usr/bin/env bash
# Dedicated disposable PostgreSQL; no .env files, application reset, or shared DB.
set -euo pipefail
cd "$(dirname "$0")/.."
container="tooljet-ai-tests-$$-$RANDOM"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
docker run --rm -d --name "$container" \
  -e POSTGRES_USER=ai_test -e POSTGRES_PASSWORD=ai_test -e POSTGRES_DB=tooljet_ai_test_local \
  -p 127.0.0.1::5432 postgres:16-alpine >/dev/null
ready=false
for attempt in {1..60}; do
  if docker exec "$container" pg_isready -U ai_test -d tooljet_ai_test_local >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
if [[ "$ready" != true ]]; then echo 'Disposable PostgreSQL did not start' >&2; exit 1; fi
port=$(docker port "$container" 5432/tcp | sed 's/.*://')
export ATTACHMENT_TEST_DATABASE_URL="postgresql://ai_test:ai_test@127.0.0.1:${port}/tooljet_ai_test_local"
export TOOLJET_EDITION="${TOOLJET_EDITION:-ee}"
node scripts/check-ai-tests.cjs
for package in server frontend; do
  mkdir -p "$package/coverage-ai/$TOOLJET_EDITION"
  npm --prefix "$package" run test:ai -- --coverage --json --outputFile="coverage-ai/$TOOLJET_EDITION/results.json" "$@"
  node scripts/check-ai-test-results.cjs "$package" "$package/coverage-ai/$TOOLJET_EDITION/results.json"
  node scripts/report-ai-coverage.cjs "$package" "$package/coverage-ai/$TOOLJET_EDITION/coverage-final.json" "$package/coverage-ai/$TOOLJET_EDITION/report"
done
