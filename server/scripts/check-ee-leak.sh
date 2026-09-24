#!/usr/bin/env bash
# Fails when the public test tree imports EE code. Warn-only until the EE test
# extraction lands; flip WARN_ONLY off to enforce.
WARN_ONLY=1

cd "$(dirname "$0")/.." || exit 1
hits=$(grep -rE "@ee/|@licensing/|@instance-settings/" test --include='*.ts' --exclude='jest-*.config.ts' || true)
[ -z "$hits" ] && exit 0

echo "EE imports leaked into the public test tree:"
echo "$hits"
[ "$WARN_ONLY" = 1 ] && exit 0
exit 1
