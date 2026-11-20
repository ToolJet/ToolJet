#!/usr/bin/env bash
# Fails when the public test tree needs EE code. Specs that need EE live in
# the ee submodule's test/ tree instead.
cd "$(dirname "$0")/.." || exit 1

# 1. Static EE imports.
import_hits=$(grep -rE "@ee/|@licensing/|@instance-settings/|['\"](\.\./)+ee/" test --include='*.ts' --exclude='jest-*.config.ts' || true)

# 2. Runtime EE requirements the import scan can't see: initTestApp({ edition: 'ee'|'cloud' })
# and non-CE license plans. The CE helper only registers the 'basic' plan and resolves
# modules under src/ (no ee/ on disk in the CE/no-submodules job), so these specs can only
# pass in the ee/test tree. Keep in sync with PLAN_TO_TERMS in test/helpers/setup.ts.
runtime_hits=$(grep -rnE "edition: ?['\"](ee|cloud)['\"]|plan: ?['\"](starter|pro|team|enterprise|trial)['\"]" test --include='*.ts' --exclude='jest-*.config.ts' || true)

[ -z "$import_hits" ] && [ -z "$runtime_hits" ] && exit 0

echo "EE code leaked into the public test tree (move these specs to ee/test):"
[ -n "$import_hits" ] && { echo "— EE imports:"; echo "$import_hits"; }
[ -n "$runtime_hits" ] && { echo "— EE edition / non-CE plan at runtime:"; echo "$runtime_hits"; }
exit 1
