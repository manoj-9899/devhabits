#!/usr/bin/env bash
# scripts/bootstrap.sh
# ─────────────────────────────────────────────────────────────────────────────
# One-command bootstrap for macOS and Linux. Verifies prerequisites, installs
# all dependencies, links the CLI globally, runs the doctor, and prints a
# friendly next-steps card.
#
# Usage (from project root):
#   bash scripts/bootstrap.sh
# Or via npm:
#   npm run bootstrap
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# ── colors (skip when not a TTY) ────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_CYAN='\033[36m';  C_GREEN='\033[32m';  C_YELLOW='\033[33m'
  C_RED='\033[31m';   C_DIM='\033[2m';     C_RESET='\033[0m'
else
  C_CYAN='';  C_GREEN=''; C_YELLOW=''; C_RED=''; C_DIM=''; C_RESET=''
fi

step() { printf "\n${C_CYAN}→ %s${C_RESET}\n" "$1"; }
ok()   { printf "  ${C_GREEN}✓${C_RESET} %s\n" "$1"; }
warn() { printf "  ${C_YELLOW}!${C_RESET} %s\n" "$1"; }
fail() { printf "  ${C_RED}✗${C_RESET} %s\n" "$1"; exit 1; }

printf "\n"
printf "  ${C_CYAN}╔══════════════════════════════════════════════════════╗${C_RESET}\n"
printf "  ${C_CYAN}║              DevHabits — first-time setup            ║${C_RESET}\n"
printf "  ${C_CYAN}╚══════════════════════════════════════════════════════╝${C_RESET}\n"

# ── 1. Node ────────────────────────────────────────────────────────────────
step "Checking Node.js"
if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is not installed. Get v22.5.0+ from https://nodejs.org"
fi
NODE_VER="$(node --version | sed 's/^v//')"
NODE_MAJOR="${NODE_VER%%.*}"
NODE_MINOR_RAW="${NODE_VER#*.}"
NODE_MINOR="${NODE_MINOR_RAW%%.*}"
if [[ "$NODE_MAJOR" -lt 22 ]] || { [[ "$NODE_MAJOR" -eq 22 ]] && [[ "$NODE_MINOR" -lt 5 ]]; }; then
  fail "Node v$NODE_VER is too old. node:sqlite needs v22.5.0+. Upgrade: https://nodejs.org"
fi
ok "Node v$NODE_VER"

# ── 2. Install ─────────────────────────────────────────────────────────────
step "Installing dependencies (this can take a couple of minutes the first time)"
npm install --silent
ok "root dependencies"
( cd backend  && npm install --silent ) && ok "backend dependencies"
( cd frontend && npm install --silent ) && ok "frontend dependencies"

# ── 3. Link CLI ─────────────────────────────────────────────────────────────
step "Linking the 'habit' command globally"
(
  cd backend
  if npm link --silent 2>/dev/null; then
    ok "linked — try 'habit --help' from any new shell"
  else
    warn "npm link failed (may need sudo on Linux)."
    warn "Retry: cd backend && sudo npm link"
    warn "Or just use 'node backend/src/cli.js' for now."
  fi
)

# ── 4. Doctor ───────────────────────────────────────────────────────────────
step "Running 'npm run doctor' to verify the install"
if ! npm run doctor --silent; then
  warn "doctor reported issues — see the output above."
  warn "You can still try 'npm run dev' or 'habit' to keep going."
fi

# ── Done ────────────────────────────────────────────────────────────────────
printf "\n"
printf "  ${C_GREEN}┌──────────────────────────────────────────────────┐${C_RESET}\n"
printf "  ${C_GREEN}│ Setup complete. Pick your next move:             │${C_RESET}\n"
printf "  ${C_GREEN}├──────────────────────────────────────────────────┤${C_RESET}\n"
printf "  ${C_GREEN}│  habit                  → terminal dashboard     │${C_RESET}\n"
printf "  ${C_GREEN}│  habit ui               → interactive TUI mode   │${C_RESET}\n"
printf "  ${C_GREEN}│  npm run dev            → web app + API server   │${C_RESET}\n"
printf "  ${C_GREEN}│  npm run doctor         → re-run health checks   │${C_RESET}\n"
printf "  ${C_GREEN}└──────────────────────────────────────────────────┘${C_RESET}\n"
printf "\n"
printf "  ${C_DIM}Tip: open a fresh shell so PATH picks up 'habit'.${C_RESET}\n"
printf "\n"
