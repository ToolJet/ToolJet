#!/usr/bin/env bash
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
SYM_BLOCK="${FG_CYAN}▌${RESET}"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# Check if running in an interactive terminal
IS_TTY=0
if [ -t 1 ]; then
  IS_TTY=1
fi

# -----------------------------------------------------------------------------
# Step Runner with Spinner
# -----------------------------------------------------------------------------
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
      printf "\r  ${FG_CYAN}%s${RESET} %s ${DIM}running...${RESET}\033[K" "$char" "$title"
      i=$((i + 1))
      sleep 0.08
    done
    tput cnorm 2>/dev/null || true
  else
    printf "  • %s ...\n" "$title"
    wait "$pid" || true
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

echo ""
echo "${SYM_BLOCK} ${BOLD}${FG_CYAN}ToolJet Pre-Push Integrity & Lint Checks${RESET}"
echo "${DIM}──────────────────────────────────────────────────────────────${RESET}"

# Step 1: Root Cleanliness
check_root_clean() {
  if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "Uncommitted changes detected in root repository."
    echo "Please commit or stash changes before pushing."
    return 1
  fi
  return 0
}
run_step "Checking root repository cleanliness" check_root_clean

# Step 2: Submodules Cleanliness
check_submodules_clean() {
  local dirty=0
  local output
  output=$(git submodule foreach '
    if ! git diff --quiet || ! git diff --staged --quiet; then
      echo "Submodule $name has uncommitted changes."
      exit 1
    fi
  ' 2>&1) || dirty=1
  if [ $dirty -ne 0 ]; then
    echo "$output"
    return 1
  fi
  return 0
}
run_step "Checking EE submodule working tree cleanliness" check_submodules_clean

# Step 3: Submodule Pointer Parity
check_pointer_parity() {
  if git submodule status | grep -q '^+'; then
    echo "Submodule pointers in root are out of sync with submodule HEAD."
    echo "Run 'git add server/ee frontend/ee && git commit -m \"chore: update submodule pointers\"'"
    return 1
  fi
  return 0
}
run_step "Verifying submodule pointer parity with HEAD" check_pointer_parity

# Step 4: Submodule Remote Push Parity
check_remote_parity() {
  local unpushed=0
  local output
  output=$(git submodule foreach '
    HEAD_REV=$(git rev-parse HEAD)
    if ! git branch -r --contains "$HEAD_REV" 2>/dev/null | grep -q "origin/"; then
      echo "Submodule $name contains local commit ($HEAD_REV) not pushed to origin."
      echo "Please run: git -C $path push origin HEAD"
      exit 1
    fi
  ' 2>&1) || unpushed=1
  if [ $unpushed -ne 0 ]; then
    echo "$output"
    return 1
  fi
  return 0
}
run_step "Verifying submodule commit remote push parity" check_remote_parity

# Step 5: Affected Linting
BASE_BRANCH="${BASE_BRANCH:-main}"
MERGE_BASE=$(git merge-base HEAD "origin/${BASE_BRANCH}" 2>/dev/null || git rev-parse HEAD~1 2>/dev/null || git rev-parse HEAD)
ALL_CHANGED=$(git diff --name-only "$MERGE_BASE" HEAD 2>/dev/null || true)

if echo "$ALL_CHANGED" | grep -qE "^server"; then
  run_step "Linting Server & Server EE" npm --prefix server run lint
fi

if echo "$ALL_CHANGED" | grep -qE "^frontend"; then
  run_step "Linting Frontend & Frontend EE" npm --prefix frontend run lint
fi

echo "${DIM}──────────────────────────────────────────────────────────────${RESET}"
echo "  ${SYM_CHECK} ${BOLD}${FG_GREEN}All integrity and lint checks passed successfully!${RESET}"
echo ""
