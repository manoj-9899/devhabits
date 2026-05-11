<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />

  <h1>🚀 DevHabits</h1>
  <p><strong>The Developer-First Local Habit Tracker</strong></p>
  <p>
    DevHabits is a fast, local-first habit tracker built specifically for developers. It provides a seamless tracking experience by combining a powerful <b>Command Line Interface (CLI)</b> with a beautiful, modern <b>Web Dashboard</b>. By treating "Habits as Code," you can instantly log a habit in your terminal without breaking your coding flow, while keeping the Web Dashboard open for visual analytics.
  </p>
  
  <p>
    <a href="#-key-features">Key Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-cli-usage">CLI Usage</a> •
    <a href="#%EF%B8%8F-web-dashboard-shortcuts">Shortcuts</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

## ✨ Key Features

- **💻 Dual Interface**: Manage your daily habits directly from the terminal or interact with the sleek web UI simultaneously — every change is instantly visible on both surfaces.
- **🔒 Local-First & Private**: All data is stored locally on your machine in a lightweight SQLite database. No cloud, no subscriptions, no tracking.
- **⚙️ Zero Database Configuration**: Works out of the box with zero external dependencies using Node.js native SQLite (`--experimental-sqlite`).
- **⚡ True Concurrency**: Powered by SQLite's WAL mode, the web dashboard and CLI interact with your data concurrently without locking or lagging.
- **📈 Advanced Analytics**: Real-time streak tracking, GitHub-style heatmaps, weekday consistency bars, and per-habit "fingerprints" via the React dashboard.
- **🎯 Command Palette**: Press `Ctrl+/` (`Cmd+/` on macOS) anywhere in the web app to fuzzy-search every action — navigation, new habit, archive — without lifting your hands.
- **⌨️ Keyboard-First UX**: Single-key navigation (`1`–`4`), quick actions (`N` to add, `D`/`S`/`M` to log on the Today page), and a built-in shortcuts dialog (`?`).
- **🖼 Interactive Terminal UI**: A full-screen TUI mode (`habit ui`) built with Ink — navigate with `j`/`k`, log with `d`/`s`/`m`, no typing habit names.
- **🌈 Rich CLI Visualizations**: Time-aware greetings, 7-day streak strips per habit, GitHub-style year heatmap (`habit year`), per-habit charts (`habit chart`), and milestone celebration banners on streak hits.
- **♿ Accessible by Design**: Full keyboard navigation, ARIA landmarks, focus management, skip-to-content link, and `prefers-reduced-motion` support throughout the web app.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js (v22.5.0+)**: Critical requirement. The backend relies heavily on the new `--experimental-sqlite` feature.
- **Git**

### Installation (1 Minute Setup)

1. **Clone the repository**
   ```bash
   git clone https://github.com/manoj-9899/devhabits.git
   cd devhabits
   ```

2. **Bootstrap**
   One command, cross-platform — verifies Node, installs everything, links the CLI, and runs a health check.
   ```bash
   npm run bootstrap
   ```
   > Calls `scripts/bootstrap.ps1` on Windows or `scripts/bootstrap.sh` on macOS/Linux.
   > Prefer manual? `npm run setup` is the install-and-link-only equivalent.

3. **Launch the Application**
   Start both the web dashboard and the backend API simultaneously:
   ```bash
   npm run dev
   ```
   > The web dashboard is now running at **`http://localhost:5173`**.

### Maintenance commands

| Command | What it does |
| --- | --- |
| `npm run doctor` | Validate Node version, deps, CLI link, DB path, ports — with OS-specific fix hints. |
| `npm run aliases:install` | Install daily shell aliases (`hl`, `hq`, `hm`, `hd`, etc.) and a compact startup brief. |
| `npm run aliases:remove` | Remove the guarded DevHabits block from your shell profile. |
| `npm run db:where` | Print the location of the SQLite database. |
| `npm run db:reset` | Wipe all habits and logs (with confirmation). Add `-- --yes` to skip the prompt. |
| `npm run check` | Run lint + production build for the frontend. |
| `npm run cli:link` | Re-link the global `habit` command if PATH lost it. |

---

## 💻 CLI Usage

Because the setup script linked the command globally, you can run `habit` from any terminal window. Fuzzy name matching means you don't need to type full habit names.

### Daily ritual

```bash
habit                  # Today's dashboard (default command)
habit quick            # Multi-select what you did, then Enter to log all DONE
habit morning          # Startup-friendly summary of today + yesterday
habit done read        # Mark a habit as DONE
habit skip water       # Skip without breaking the streak
habit miss workout     # Mark as missed (breaks streak)
```

### Shell aliases

`npm run bootstrap` and `npm run setup` install a guarded DevHabits block into your shell profile. Restart the terminal, then use:

| Alias | Expands to |
| --- | --- |
| `hl` | `habit` |
| `hq` | `habit quick` |
| `hm` | `habit morning` |
| `hui` | `habit ui` |
| `hd read` | `habit done read` |
| `hs water` | `habit skip water` |
| `hx workout` | `habit miss workout` |
| `hw` / `hy` | `habit week` / `habit year` |

The same guarded block runs `habit morning --compact` whenever a new shell opens. Disable it with `DEVHABITS_NO_MORNING=1`, or remove everything with `npm run aliases:remove`.

### Visualizations

```bash
habit week                  # 7-day grid across all habits
habit year                  # GitHub-style 365-day activity heatmap
habit chart "Read 30 min"   # 30-day strip for a single habit
habit stats                 # All-time completion rate + streaks
```

### Interactive TUI

For a full-screen experience built with Ink, run:

```bash
habit ui
```

| Key | Action |
| --- | --- |
| `j` / `↓` · `k` / `↑` | Move selection |
| `d` / `s` / `m` | Log Done / Skipped / Missed for the selected habit |
| `r` | Refresh from disk (catches changes made via the web app) |
| `?` | Toggle help overlay |
| `q` / `Esc` | Quit |

> **Tip:** On Windows, **Windows Terminal** (not the legacy `cmd.exe`) is recommended for full Unicode + emoji rendering. The CLI detects the legacy console and shows a hint.

For a printable one-page reference, see [CHEATSHEET.md](CHEATSHEET.md).

---

## ⌨️ Web Dashboard Shortcuts

Open the web dashboard (`npm run dev` → <http://localhost:5173>) and try these:

| Keys | Action |
| --- | --- |
| **`Ctrl+/`** (`Cmd+/`) | Open the **Command Palette** — fuzzy search any action |
| `?` | Show all keyboard shortcuts |
| `N` | New habit |
| `1` / `2` / `3` / `4` | Jump to Dashboard / Today / Habits / Analytics |
| `[` | Toggle the sidebar |
| `D` / `S` / `M` | When a habit card is focused on Today, mark Done / Skip / Miss |
| `Esc` | Close any open dialog |

Updates made in the CLI reflect instantly in the dashboard, and vice versa.

---

## 🏗 Architecture

### Tech Stack
- **Backend**: Node.js API server utilizing `--experimental-sqlite` for native, dependency-free database management. Express.js for routing.
- **Frontend**: React 19 SPA built with Vite, TypeScript, and Tailwind CSS v4. Framer Motion for animation, Zustand for transient UI state, TanStack Query for server state with optimistic updates.
- **CLI Tool**: Commander.js + Chalk + cli-table3 for the static commands, **Ink** + **React** for the interactive `habit ui` TUI. The interactive layer is lazy-loaded so the rest of the CLI starts instantly.
- **Design System**: Custom primitives (`Card`, `Modal`, `Input`, `Select`, `SegmentedControl`, `Toaster`, etc.) plus a unified motion language and design tokens shared across the dashboard and the command palette.

### Repository Structure
```
.
├── backend/
│   └── src/
│       ├── api/            # Express routes
│       ├── cli/            # CLI theme, formatters, and Ink-based TUI
│       ├── db/             # SQLite connection + migrations
│       ├── models/         # Habit / Log data access
│       ├── services/       # Streak engine, etc.
│       └── cli.js          # CLI entry point (linked as `habit`)
├── frontend/
│   └── src/
│       ├── components/     # UI primitives, layout, modals, palette
│       ├── hooks/          # TanStack Query hooks
│       ├── lib/            # Tokens, motion, commands, platform helpers
│       ├── pages/          # Dashboard, Today, Habits, Analytics
│       └── store/          # Zustand stores (UI + toasts)
├── docs/                   # Architecture and workflow docs
├── CHEATSHEET.md           # One-page CLI reference
└── README.md               # You are here
```

---

## 📚 Documentation

- [**CHEATSHEET.md**](CHEATSHEET.md) — One-page printable terminal reference (setup, daily ritual, every command, interactive keys, troubleshooting).
- [Architecture Details](docs/developer_habit_tracker_architecture.md) — Deep-dive on the backend, data layer, and streak engine.

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding new features, or improving documentation, your help is appreciated. 

Please read our [Contributing Guide](CONTRIBUTING.md) and our [Git Workflow](docs/GIT_WORKFLOW.md) to get started.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <i>Built with ❤️ by Developers, for Developers.</i>
</div>
