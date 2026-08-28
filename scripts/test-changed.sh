#!/usr/bin/env bash
# Detects changed server modules and runs their Jest tests (unit + e2e).
# Usage: scripts/test-changed.sh

set -euo pipefail

# -----------------------------------------------------------------------------
# Styling & Palette (ANSI-C quoting for portable byte evaluation)
# -----------------------------------------------------------------------------
ESC=$'\033'
RESET="${ESC}[0m"
BOLD="${ESC}[1m"
DIM="${ESC}[2m"

FG_CYAN="${ESC}[38;5;39m"
FG_BLUE="${ESC}[38;5;75m"
FG_GREEN="${ESC}[38;5;78m"
FG_YELLOW="${ESC}[38;5;220m"
FG_RED="${ESC}[38;5;196m"
FG_PURPLE="${ESC}[38;5;141m"
FG_GRAY="${ESC}[38;5;244m"

SYM_CHECK="${FG_GREEN}✔${RESET}"
SYM_CROSS="${FG_RED}✖${RESET}"
SYM_INFO="${FG_BLUE}ℹ${RESET}"
SYM_ARROW="${FG_PURPLE}❯${RESET}"
SYM_BLOCK="${FG_PURPLE}▌${RESET}"

ROOT=$(git rev-parse --show-toplevel)
SERVER_DIR="$ROOT/server"

IS_TTY=0
if [ -t 1 ]; then
  IS_TTY=1
fi

run_step() {
  local title="$1"
  shift
  local log_file
  log_file=$(mktemp)
  local spin_chars=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  
  "$@" > "$log_file" 2>&1 &
  local pid=$!
  local i=0
  local start_time
  start_time=$(date +%s)
  
  if [ $IS_TTY -eq 1 ]; then
    tput civis 2>/dev/null || true
    while kill -0 "$pid" 2>/dev/null; do
      local char="${spin_chars[i % ${#spin_chars[@]}]}"
      local elapsed=$(( $(date +%s) - start_time ))
      printf "\r  ${FG_PURPLE}%s${RESET} %s ${FG_GRAY}(${elapsed}s)${RESET} ${DIM}running...${RESET}\033[K" "$char" "$title"
      i=$((i + 1))
      sleep 0.08
    done
    tput cnorm 2>/dev/null || true
  else
    printf "  • %s ...\n" "$title"
  fi
  
  wait "$pid"
  local exit_code=$?
  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  if [ $exit_code -eq 0 ]; then
    if [ $IS_TTY -eq 1 ]; then
      printf "\r  ${SYM_CHECK} %s ${FG_GRAY}(${duration}s)${RESET}\033[K\n" "$title"
    else
      printf "  ${SYM_CHECK} %s (${duration}s)\n" "$title"
    fi
    rm -f "$log_file"
    return 0
  else
    if [ $IS_TTY -eq 1 ]; then
      printf "\r  ${SYM_CROSS} ${FG_RED}%s${RESET} ${FG_GRAY}(failed after ${duration}s)${RESET}\033[K\n" "$title"
    else
      printf "  ${SYM_CROSS} %s (failed after ${duration}s)\n" "$title"
    fi
    echo ""
    echo "  ${FG_RED}┌─ Error Details ──────────────────────────────────────────┐${RESET}"
    sed 's/^/  │ /' "$log_file"
    echo "  ${FG_RED}└──────────────────────────────────────────────────────────┘${RESET}"
    echo ""
    rm -f "$log_file"
    return $exit_code
  fi
}

run_test_step() {
  local title="$1"
  shift
  local log_file
  log_file=$(mktemp)
  local spin_chars=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  
  "$@" > "$log_file" 2>&1 &
  local pid=$!
  local tick=0
  local start_time
  start_time=$(date +%s)
  local live_msg="${DIM}executing suites...${RESET}"
  
  if [ $IS_TTY -eq 1 ]; then
    tput civis 2>/dev/null || true
    while kill -0 "$pid" 2>/dev/null; do
      local char="${spin_chars[tick % ${#spin_chars[@]}]}"
      local elapsed=$(( $(date +%s) - start_time ))
      
      # Sample log file once every 1s (tick % 10 == 0) with a single tail+awk pass to prevent CPU contention with Jest
      if (( tick % 10 == 0 )); then
        local stats
        stats=$(tail -n 80 "$log_file" 2>/dev/null | sed -E $'s/\033\\[[0-9;]*[a-zA-Z]//g' | awk '
          /PASS / { pass++ }
          /FAIL / { fail++ }
          /(PASS|FAIL) / { last=$2 }
          END {
            if (pass > 0 || fail > 0) {
              sub(".*/", "", last);
              print pass, fail, last;
            }
          }
        ' || true)
        
        if [ -n "$stats" ]; then
          local p_cnt f_cnt l_suite
          p_cnt=$(echo "$stats" | awk '{print $1}')
          f_cnt=$(echo "$stats" | awk '{print $2}')
          l_suite=$(echo "$stats" | awk '{print $3}')
          p_cnt=${p_cnt:-0}
          f_cnt=${f_cnt:-0}
          if [ "$f_cnt" -gt 0 ] 2>/dev/null; then
            live_msg="${FG_YELLOW}$((p_cnt + f_cnt)) completed${RESET} (${FG_GREEN}${p_cnt} passed${RESET}, ${FG_RED}${f_cnt} failed${RESET}) ${DIM}• ${l_suite}${RESET}"
          elif [ "$p_cnt" -gt 0 ] 2>/dev/null; then
            live_msg="${FG_GREEN}${p_cnt} passed${RESET} ${DIM}• ${l_suite}${RESET}"
          fi
        fi
      fi
      
      printf "\r  ${FG_PURPLE}%s${RESET} %s ${FG_GRAY}(${elapsed}s)${RESET} ${SYM_ARROW} %b\033[K" "$char" "$title" "$live_msg"
      tick=$((tick + 1))
      sleep 0.1
    done
    tput cnorm 2>/dev/null || true
  else
    printf "  • %s ...\n" "$title"
  fi
  
  wait "$pid"
  local exit_code=$?
  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  local clean_final_log
  clean_final_log=$(sed -E $'s/\033\\[[0-9;]*[a-zA-Z]//g' "$log_file" 2>/dev/null || true)
  
  local suite_summary
  suite_summary=$(printf '%s\n' "$clean_final_log" | grep -E '^[[:space:]]*Test Suites:' 2>/dev/null | head -1 | sed 's/^[[:space:]]*Test Suites:[[:space:]]*//' || true)
  local test_summary
  test_summary=$(printf '%s\n' "$clean_final_log" | grep -E '^[[:space:]]*Tests:' 2>/dev/null | head -1 | sed 's/^[[:space:]]*Tests:[[:space:]]*//' || true)
  
  local summary_text=""
  if [ -n "$suite_summary" ]; then
    summary_text="${DIM}• Suites: ${suite_summary}${RESET}"
    if [ -n "$test_summary" ]; then
      summary_text="${summary_text} ${DIM}| Tests: ${test_summary}${RESET}"
    fi
  fi
  
  if [ $exit_code -eq 0 ]; then
    if [ $IS_TTY -eq 1 ]; then
      printf "\r  ${SYM_CHECK} %s ${FG_GRAY}(${duration}s)${RESET} %b\033[K\n" "$title" "$summary_text"
    else
      printf "  ${SYM_CHECK} %s (%ss) %b\n" "$title" "$duration" "$summary_text"
    fi
    rm -f "$log_file"
    return 0
  else
    if [ $IS_TTY -eq 1 ]; then
      printf "\r  ${SYM_CROSS} ${FG_RED}%s${RESET} ${FG_GRAY}(failed after ${duration}s)${RESET}\033[K\n" "$title"
    else
      printf "  ${SYM_CROSS} %s (failed after ${duration}s)\n" "$title"
    fi
    echo ""
    echo "  ${FG_RED}┌─ Jest Test Failures ─────────────────────────────────────┐${RESET}"
    sed 's/^/  │ /' "$log_file"
    echo "  ${FG_RED}└──────────────────────────────────────────────────────────┘${RESET}"
    echo ""
    rm -f "$log_file"
    return $exit_code
  fi
}

echo ""
echo "${SYM_BLOCK} ${BOLD}${FG_PURPLE}ToolJet Changed-Scope Test Runner${RESET}"
echo "${DIM}──────────────────────────────────────────────────────────────${RESET}"

# Resolve merge base against the PR base branch (or main as local fallback).
BASE_BRANCH="${BASE_BRANCH:-main}"
if ! MERGE_BASE=$(git merge-base HEAD "origin/${BASE_BRANCH}" 2>/dev/null); then
  echo "  ${FG_YELLOW}▲ Notice:${RESET} Could not resolve merge base with origin/${BASE_BRANCH} — running all server unit tests."
  RUN_ALL=true
  SERVER_FILES=""
else
  ALL_CHANGED=$(git diff --name-only "$MERGE_BASE" HEAD)
  SERVER_FILES=$(echo "$ALL_CHANGED" | grep "^server" || true)
fi

RUN_ALL="${RUN_ALL:-false}"

if [[ -z "${SERVER_FILES:-}" && "$RUN_ALL" != "true" ]]; then
  echo "  ${SYM_INFO} No server files changed — skipping tests."
  echo ""
  exit 0
fi

MODULES=()

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    server/src/modules/*)
      mod=$(echo "$file" | sed 's|server/src/modules/\([^/]*\)/.*|\1|')
      MODULES+=("$mod")
      ;;
    server/test/modules/*)
      mod=$(echo "$file" | sed 's|server/test/modules/\([^/]*\)/.*|\1|')
      MODULES+=("$mod")
      ;;
    server/test/ee/*)
      echo "  ${SYM_ARROW} EE test change detected in: ${DIM}$file${RESET}"
      RUN_ALL=true
      ;;
    server/ee)
      # Inspect changed modules inside server/ee submodule
      SUB_BASE=$(git -C "$ROOT/server/ee" merge-base HEAD "origin/${BASE_BRANCH}" 2>/dev/null || git -C "$ROOT/server/ee" rev-parse HEAD~1 2>/dev/null || true)
      if [ -n "$SUB_BASE" ]; then
        EE_CHANGED=$(git -C "$ROOT/server/ee" diff --name-only "$SUB_BASE" HEAD 2>/dev/null || true)
        if [ -n "$EE_CHANGED" ]; then
          while IFS= read -r ee_file; do
            [[ -z "$ee_file" ]] && continue
            ee_mod=$(echo "$ee_file" | cut -d'/' -f1)
            MODULES+=("$ee_mod")
          done <<< "$EE_CHANGED"
        else
          RUN_ALL=true
        fi
      else
        RUN_ALL=true
      fi
      ;;
    server/ee/*)
      mod=$(echo "$file" | sed 's|server/ee/\([^/]*\)/.*|\1|')
      MODULES+=("$mod")
      ;;
    server/src/helpers/*|server/src/entities/*|server/src/dto/*|server/lib/*)
      echo "  ${SYM_ARROW} Cross-cutting change in: ${DIM}$file${RESET}"
      RUN_ALL=true
      ;;
    server/test/helpers/*|server/test/test.helper.ts)
      echo "  ${SYM_ARROW} Test helper change in: ${DIM}$file${RESET}"
      RUN_ALL=true
      ;;
    server/test/jest-*.config.ts|server/test/jest-*setup*.ts)
      echo "  ${SYM_ARROW} Test infra change in: ${DIM}$file${RESET}"
      RUN_ALL=true
      ;;
    server/docs/*|server/*.md|server/AGENTS.md|server/scripts/*|server/package.json|server/package-lock.json)
      # Documentation & tooling changes don't affect test selection
      ;;
    *)
      echo "  ${SYM_ARROW} General server change (running full test suite): ${DIM}$file${RESET}"
      RUN_ALL=true
      ;;
  esac
done <<< "${SERVER_FILES:-}"

UNIQUE_MODULES=()
if [[ ${#MODULES[@]} -gt 0 ]]; then
  while IFS= read -r line; do
    UNIQUE_MODULES+=("$line")
  done < <(printf '%s\n' "${MODULES[@]}" | sort -u)
fi

if [[ "$RUN_ALL" == "true" ]]; then
  PATTERN=""
  echo "  ${SYM_INFO} Target Scope: ${BOLD}All Server Tests${RESET}"
elif [[ ${#UNIQUE_MODULES[@]} -eq 0 ]]; then
  echo "  ${SYM_INFO} No test-affecting server changes — skipping."
  echo ""
  exit 0
else
  MODULE_REGEX=$(IFS='|'; echo "${UNIQUE_MODULES[*]}")
  PATTERN="test/modules/(${MODULE_REGEX})/"
  echo "  ${SYM_INFO} Target Scope: ${BOLD}${UNIQUE_MODULES[*]}${RESET}"
fi

cd "$SERVER_DIR"

unit_args=(--colors)
e2e_args=(--ci --colors)
if [[ -n "$PATTERN" ]]; then
  unit_args+=(--testPathPatterns="$PATTERN")
  e2e_args+=(--testPathPatterns "$PATTERN")
fi
if [[ "${CI:-}" == "true" ]]; then
  unit_args+=(--json --outputFile /tmp/tj-unit-results.json)
  mkdir -p /tmp/tj-e2e-json
  e2e_args+=(--json-output-dir /tmp/tj-e2e-json)
else
  unit_args+=(--testPathIgnorePatterns="test/modules/workspace-branches/unit/app-deletion-targeted-removal.spec.ts")
fi

run_typecheck() {
  npx tsc --noEmit -p tsconfig.build.json
}
run_step "TypeScript typecheck (server)" run_typecheck

run_unit_tests() {
  npm run test -- ${unit_args[@]+"${unit_args[@]}"}
}
run_test_step "Server unit tests" run_unit_tests

if [[ "${CI:-}" == "true" ]]; then
  run_e2e_tests() {
    npm run test:e2e -- ${e2e_args[@]+"${e2e_args[@]}"}
  }
  run_test_step "Server e2e tests" run_e2e_tests
fi

echo "${DIM}──────────────────────────────────────────────────────────────${RESET}"
echo "  ${SYM_CHECK} ${BOLD}${FG_GREEN}All server test checks completed successfully!${RESET}"
echo ""
