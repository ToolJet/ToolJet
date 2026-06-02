#!/usr/bin/env bash
# ToolJet Security Audit Script
# Run locally: bash scripts/security-audit.sh
# This is the same set of checks that CI runs, so you can catch issues before pushing.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}❌ FAIL${NC} $1"; ((FAIL++)); }
warn() { echo -e "${YELLOW}⚠️  WARN${NC} $1"; ((WARN++)); }
header() { echo -e "\n${BLUE}── $1 ──────────────────────────────────${NC}"; }

# ── 1. Dependency Audit ───────────────────────────────────────────────────────
header "Dependency Audit (npm audit)"

for pkg in server frontend plugins; do
  cd "$ROOT/$pkg"
  if npm audit --audit-level=high --omit=dev --json 2>/dev/null | \
     node -e "
       const d=require('/dev/stdin');
       const v=Object.values(d.vulnerabilities||{}).filter(x=>x.severity==='high'||x.severity==='critical');
       process.exit(v.length>0?1:0)
     " 2>/dev/null; then
    pass "$pkg: no high/critical vulnerabilities"
  else
    fail "$pkg: high/critical vulnerabilities found — run: npm audit --audit-level=high --omit=dev --prefix $pkg"
  fi
  cd "$ROOT"
done

# ── 2. Secret Scanning ────────────────────────────────────────────────────────
header "Secret Scanning"

if command -v gitleaks &>/dev/null; then
  if gitleaks detect --source "$ROOT" --redact --no-git 2>/dev/null; then
    pass "Gitleaks: no secrets detected"
  else
    fail "Gitleaks: potential secrets found — run: gitleaks detect --source . --redact"
  fi
else
  warn "Gitleaks not installed — install with: brew install gitleaks"
fi

# ── 3. SAST (Semgrep) ─────────────────────────────────────────────────────────
header "SAST (Semgrep custom rules)"

if command -v semgrep &>/dev/null; then
  FINDINGS=$(semgrep --config "$ROOT/.semgrep/rules/" \
    --severity ERROR --json --quiet \
    "$ROOT/server/src" "$ROOT/frontend/src" "$ROOT/plugins/packages" 2>/dev/null \
    | node -e "const d=require('/dev/stdin'); process.stdout.write(String(d.results?.length||0))")
  if [ "$FINDINGS" = "0" ]; then
    pass "Semgrep: no ERROR-level findings"
  else
    fail "Semgrep: $FINDINGS finding(s) — run: semgrep --config .semgrep/rules/ --severity ERROR server/src frontend/src"
  fi
else
  warn "Semgrep not installed — install with: pip install semgrep"
fi

# ── 4. Quick grep patterns (no tool required) ─────────────────────────────────
header "Quick Pattern Checks (grep)"

# dangerouslySetInnerHTML without DOMPurify
UNSAFE_HTML=$(grep -rn "dangerouslySetInnerHTML" "$ROOT/frontend/src" \
  --include="*.jsx" --include="*.tsx" --include="*.js" \
  | grep -v "DOMPurify\|nosemgrep\|node_modules" | wc -l | tr -d ' ')
if [ "$UNSAFE_HTML" = "0" ]; then
  pass "No dangerouslySetInnerHTML without DOMPurify"
else
  fail "$UNSAFE_HTML instance(s) of dangerouslySetInnerHTML without DOMPurify.sanitize()"
  grep -rn "dangerouslySetInnerHTML" "$ROOT/frontend/src" \
    --include="*.jsx" --include="*.tsx" \
    | grep -v "DOMPurify\|nosemgrep\|node_modules" | head -5
fi

# QueryBuilder template literal injection
QB_INJECTION=$(grep -rn "\.where(\`\|\.andWhere(\`\|\.orWhere(\`" "$ROOT/server/src" \
  --include="*.ts" | grep -v "spec\|nosemgrep" | wc -l | tr -d ' ')
if [ "$QB_INJECTION" = "0" ]; then
  pass "No QueryBuilder template literal WHERE clauses"
else
  warn "$QB_INJECTION QueryBuilder template literal(s) — review for SQL injection risk"
  grep -rn "\.where(\`\|\.andWhere(\`" "$ROOT/server/src" --include="*.ts" \
    | grep -v "spec\|nosemgrep" | head -5
fi

# eval() usage
EVAL_COUNT=$(grep -rn "\beval(" "$ROOT/frontend/src" "$ROOT/server/src" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  | grep -v "nosemgrep\|node_modules\|spec" | wc -l | tr -d ' ')
if [ "$EVAL_COUNT" = "0" ]; then
  pass "No eval() usage"
else
  fail "$EVAL_COUNT eval() call(s) found"
fi

# Controller decrypt routes without ValidateDataSourceGuard
if grep -q "decryptOptions\|@Post('decrypt')" "$ROOT/server/src/modules/data-sources/controller.ts" 2>/dev/null; then
  if grep -B5 "@Post('decrypt')" "$ROOT/server/src/modules/data-sources/controller.ts" \
     | grep -q "ValidateDataSourceGuard"; then
    pass "decrypt endpoint has ValidateDataSourceGuard"
  else
    fail "POST /api/data-sources/decrypt is missing ValidateDataSourceGuard (IDOR risk)"
  fi
fi

# ── 5. Summary ────────────────────────────────────────────────────────────────
header "Summary"
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}WARN: $WARN${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}Security audit FAILED. Fix the issues above before merging.${NC}"
  exit 1
else
  echo -e "${GREEN}Security audit passed.${NC}"
  exit 0
fi
