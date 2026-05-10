# DevHabits — Terminal Cheat Sheet

> Print it. Pin it. You'll never need anything else.

---

## One-time setup

The fastest path — verifies Node, installs everything, links the CLI globally, and runs a health check:

```powershell
cd "C:\Users\manoj\Desktop\habit tracker"
npm run bootstrap
```

> Internally calls `scripts\bootstrap.ps1` on Windows or `scripts/bootstrap.sh` on macOS/Linux.
> If you prefer the manual path: `npm run setup` does the install + link only.

Then **open a fresh PowerShell window** and confirm:

```powershell
habit --help
```

> Requires Node.js v22.5.0 or newer. Check with `node --version`.
> For the best visuals on Windows, use **Windows Terminal** (not legacy `cmd.exe`).
> If the first `habit` shows nothing, it'll offer to seed a starter habit interactively.

### Health check anytime

```powershell
npm run doctor       # validates Node, deps, CLI link, DB path, ports
```

---

## Daily ritual (90 seconds total)

```powershell
habit                  # See today's dashboard
habit done read        # Log things as you finish them
habit done water
habit done workout
habit                  # Confirm you're at 100%
```

---

## Core commands

| What you want | Command |
| --- | --- |
| Today's dashboard (greeting + 7-day strip per habit + progress bar) | `habit` |
| Add a habit | `habit add "Read 30 minutes"` |
| Add with category | `habit add "Workout" -c Health` |
| Add weekly habit | `habit add "Plan week" -f WEEKLY` |
| Add with custom color | `habit add "Run" --color "#f97316"` |
| Mark done | `habit done read` |
| Skip (legit skip, no streak break) | `habit skip water` |
| Mark missed | `habit miss workout` |
| All-time stats + streaks | `habit stats` |
| Help on anything | `habit <command> --help` |

---

## Visual commands

| What you want | Command |
| --- | --- |
| 7-day grid across all habits | `habit week` |
| Year-long heatmap (GitHub-style) | `habit year` |
| Custom heatmap window | `habit year --days 90` |
| 30-day strip for one habit | `habit chart read` |
| Custom strip window | `habit chart read --days 60` |
| **Full-screen interactive UI** | `habit ui` |

### Inside `habit ui` (interactive mode)

| Key | Action |
| --- | --- |
| `j` / `↓` | Next habit |
| `k` / `↑` | Previous habit |
| `d` | Mark Done |
| `s` | Mark Skipped |
| `m` | Mark Missed |
| `r` | Refresh from disk |
| `?` | Toggle help overlay |
| `q` / `Esc` | Quit |

---

## Things that make life easier

- **Fuzzy match.** Don't type `"Read 30 minutes"` — `habit done read` works.
- **Multiple matches?** The CLI lists them and asks you to be specific. No accidents.
- **Order doesn't matter.** Flags can come before or after the name.
- **Default frequency** is `DAILY`. Default category is `General`.
- **Default command** is `list`. Just typing `habit` shows today.
- **Streaks of 7 / 30 / 100 / 365 days** trigger a celebration banner on `done`.

---

## What the icons mean

| Icon | Meaning | Streak impact |
| --- | --- | --- |
| `✓ DONE` (green) | Logged today | Builds streak |
| `⟶ SKIP` (blue) | Intentional skip (rest day, sick) | Pauses, doesn't break |
| `✗ MISS` (red) | Missed it | **Breaks** streak |
| `· PEND` (gray) | Not logged yet | Decide before midnight |

Streak strip cells (under each habit on `habit list`):

| Cell | Meaning |
| --- | --- |
| `█` (habit color) | Done that day |
| `▒` (gray) | Skipped |
| `×` (red) | Missed |
| `·` (dim gray) | Pending / no log |

Streak flame tier (next to streak number):

| Tier | Streak |
| --- | --- |
| (no flame) | 1–6 days |
| `🔥` | 7–29 days |
| `🔥🔥` | 30–99 days |
| `💯` | 100–364 days |
| `🏆` | 365 days+ |

---

## If something goes wrong

```powershell
# Run the diagnostic — it will tell you exactly what's wrong
npm run doctor

# "habit not recognized" → re-link the CLI
npm run cli:link

# See where the database actually lives
npm run db:where

# Wipe everything and start fresh (asks for confirmation)
npm run db:reset
# Or skip the prompt: npm run db:reset -- --yes

# Want the web dashboard too? (runs at http://localhost:5173)
npm run dev
```

> The database lives in your OS config dir, **not** inside the project folder:
> - Windows: `%APPDATA%\devhabits\habits.db`
> - macOS:   `~/Library/Application Support/devhabits/habits.db`
> - Linux:   `~/.config/devhabits/habits.db`
> Override with the `DB_PATH` environment variable.

---

## CLI and dashboard share the same data

Anything you log in PowerShell shows up on the web dashboard within a second.
Anything you click on the dashboard shows up next time you run `habit`.
Use whichever fits your moment — keyboard for speed, dashboard for reflection.
