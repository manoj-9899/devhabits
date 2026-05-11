# scripts/bootstrap.ps1
# ─────────────────────────────────────────────────────────────────────────────
# One-command Windows bootstrap. Verifies prerequisites, installs all
# dependencies, links the CLI globally, and prints a friendly next-steps card.
#
# Usage (from project root):
#   powershell -ExecutionPolicy Bypass -File scripts\bootstrap.ps1
# Or via npm:
#   npm run bootstrap
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Step($msg) { Write-Host ""; Write-Host "→ $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║              DevHabits — first-time setup            ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ── 1. Node ─────────────────────────────────────────────────────────────────
Step "Checking Node.js"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail "Node.js is not installed. Get v22.5.0+ from https://nodejs.org" }

$nodeVersion = (node --version).TrimStart('v')
$parts = $nodeVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
if ($major -lt 22 -or ($major -eq 22 -and $minor -lt 5)) {
  Fail "Node v$nodeVersion is too old. node:sqlite needs v22.5.0+. Upgrade: https://nodejs.org"
}
Ok "Node v$nodeVersion"

# ── 2. Install ──────────────────────────────────────────────────────────────
Step "Installing dependencies (this can take a couple of minutes the first time)"
npm install --silent
Ok "root dependencies"

Push-Location backend
npm install --silent
Pop-Location
Ok "backend dependencies"

Push-Location frontend
npm install --silent
Pop-Location
Ok "frontend dependencies"

# ── 3. Link CLI ─────────────────────────────────────────────────────────────
Step "Linking the 'habit' command globally"
Push-Location backend
try {
  npm link --silent
  Ok "linked — try 'habit --help' from any new PowerShell window"
} catch {
  Warn "npm link failed. You can still run the CLI via 'node backend/src/cli.js'."
  Warn "If you want the global 'habit' command, retry from an Admin PowerShell:"
  Warn "  cd backend; npm link"
}
Pop-Location

# ── 4. Doctor ───────────────────────────────────────────────────────────────
Step "Installing daily shell aliases"
npm run aliases:install --silent

# ── 5. Doctor ───────────────────────────────────────────────────────────────
Step "Running 'npm run doctor' to verify the install"
$doctor = Start-Process -FilePath 'npm' -ArgumentList 'run','doctor','--silent' `
  -NoNewWindow -PassThru -Wait
if ($doctor.ExitCode -ne 0) {
  Warn "doctor reported issues — see the output above."
  Warn "You can still try 'npm run dev' or 'habit' to keep going."
}

# ── Done ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ┌──────────────────────────────────────────────────┐" -ForegroundColor Green
Write-Host "  │ Setup complete. Pick your next move:             │" -ForegroundColor Green
Write-Host "  ├──────────────────────────────────────────────────┤" -ForegroundColor Green
Write-Host "  │  habit                  → terminal dashboard     │" -ForegroundColor Green
Write-Host "  │  habit ui               → interactive TUI mode   │" -ForegroundColor Green
Write-Host "  │  npm run dev            → web app + API server   │" -ForegroundColor Green
Write-Host "  │  npm run doctor         → re-run health checks   │" -ForegroundColor Green
Write-Host "  └──────────────────────────────────────────────────┘" -ForegroundColor Green
Write-Host ""
Write-Host "  Tip: open a fresh PowerShell window so PATH picks up 'habit'." -ForegroundColor DarkGray
Write-Host ""
