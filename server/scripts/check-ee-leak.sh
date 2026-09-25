#!/usr/bin/env bash
# Fails when the public test tree imports EE code. Specs that need EE live in
# the ee submodule's test/ tree instead.
cd "$(dirname "$0")/.." || exit 1
hits=$(grep -rE "@ee/|@licensing/|@instance-settings/|['\"](\.\./)+ee/" test --include='*.ts' --exclude='jest-*.config.ts' || true)
[ -z "$hits" ] && exit 0

echo "EE imports leaked into the public test tree:"
echo "$hits"
exit 1
