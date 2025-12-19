#!/bin/bash
set -euo pipefail

# Detect Cache Policy for Render Preview Deployments
# Determines whether to clear cache based on changed files

# Critical file patterns that require cache clear (regex patterns)
CRITICAL_PATTERNS=(
  "package\.json$"
  "package-lock\.json$"
  "Dockerfile$"
  "\.dockerignore$"
  "\.github/workflows/"
  "\.nvmrc$"
  "\.node-version$"
  "yarn\.lock$"
  "pnpm-lock\.yaml$"
)

# Safe file patterns that can use cached layers (regex patterns)
SAFE_PATTERNS=(
  "\.(js|jsx|ts|tsx)$"
  "\.(css|scss|sass|less)$"
  "\.(md|txt)$"
  "\.(json)$"  # Most JSON files are safe (except package.json which is in CRITICAL)
  "\.(html|svg|png|jpg|jpeg|gif|ico)$"
  "^docs/"
  "^test/"
  "^tests/"
  "\.test\."
  "\.spec\."
)

# Get changed files
# Use git diff to compare current commit with previous commit
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "⚠️  No changed files detected. Defaulting to clearing cache for safety."
  echo "CACHE_POLICY=clear"
  exit 0
fi

echo "📋 Changed files:"
echo "$CHANGED_FILES"
echo ""

# Check for critical changes
HAS_CRITICAL_CHANGES=false
for pattern in "${CRITICAL_PATTERNS[@]}"; do
  if echo "$CHANGED_FILES" | grep -E "$pattern" > /dev/null; then
    MATCHED_FILES=$(echo "$CHANGED_FILES" | grep -E "$pattern" || true)
    if [ -n "$MATCHED_FILES" ]; then
      echo "🔴 Critical change detected (pattern: $pattern):"
      echo "$MATCHED_FILES"
      HAS_CRITICAL_CHANGES=true
    fi
  fi
done

if [ "$HAS_CRITICAL_CHANGES" = true ]; then
  echo ""
  echo "🧹 CACHE_POLICY=clear (critical changes detected)"
  echo "CACHE_POLICY=clear"
  exit 0
fi

# Check if all changes are safe
ALL_SAFE=true
while IFS= read -r file; do
  IS_SAFE=false
  for pattern in "${SAFE_PATTERNS[@]}"; do
    if echo "$file" | grep -E "$pattern" > /dev/null; then
      IS_SAFE=true
      break
    fi
  done

  if [ "$IS_SAFE" = false ]; then
    echo "⚠️  Unrecognized file pattern: $file"
    ALL_SAFE=false
  fi
done <<< "$CHANGED_FILES"

if [ "$ALL_SAFE" = true ]; then
  echo ""
  echo "✅ CACHE_POLICY=preserve (only safe code changes detected)"
  echo "CACHE_POLICY=preserve"
  exit 0
else
  echo ""
  echo "🧹 CACHE_POLICY=clear (unrecognized file patterns, defaulting to safe mode)"
  echo "CACHE_POLICY=clear"
  exit 0
fi
