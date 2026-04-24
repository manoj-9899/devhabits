# Developer-First Local Habit Tracker: Complete Product Plan

## 1. Final Feature Set

### MVP (Minimum Viable Product)
- **Local SQLite Storage**: 100% offline-first, absolute privacy. No accounts required.
- **Dual Interface**: Core CLI for fast logging + Web UI for rich visualization.
- **3-State Completion**: `Done` (✔️), `Skipped` (➖), `Missed` (❌) – skipping an entry does not penalize streaks.
- **Keyboard-First UX**: Keyboard shortcuts in Web UI (`Cmd+N`, `Space` to toggle), fast alias commands in CLI (`h d coding`).
- **GitHub-style Heatmap**: Global contribution graph to visualize year-long consistency at a glance.

### V1 (Core Release)
- **"Habits as Code" API**: Local REST API allowing habit logging via custom scripts, curl, or IoT.
- **Planned Absences**: Pre-schedule skip days for vacations or sickness to pause streaks without breaking them.
- **Advanced Visualizations**: Current/Best streaks, % completion rates, and custom intervals (e.g., every 3 days).
- **Export/Import**: JSON and CSV export/import capabilities for data portability.
- **Developer Aesthetics**: Dark mode default, minimal glassmorphism UI.

### Advanced (V2 & Beyond)
- **Git & IDE Integration**: Automatically log habits via VS Code extensions (time spent coding) or scanning Git commits.
- **AI Insights**: Local pattern analysis proposing better schedules or predicting burnout.
- **CLI TUI Dashboard**: Full-screen terminal dashboard (ASCII sparklines, chains) similar to `taskwarrior`.
- **Desktop Build**: Tauri wrapper for a native macOS/Windows/Linux application.

## 2. UI Structure

### Web Dashboard Layout (React)
- **Global Layout**:
  - Top Navigation: Quick search/command palette (`Cmd+K`), Theme Toggle, Settings.
  - Left Sidebar (collapsible): Category filters (e.g., Coding, Health, Reading), Analytics link.
- **Pages & Components**:
  - **"Today" Inbox**:
    - Action-oriented list of due habits.
    - Tactile quick-action toggles (Done/Skip/Missed) with zero-lag optimistic updates.
  - **The Grid (Heatmap)**:
    - Central GitHub-style grid.
    - Tooltips on hover showing date and specific logged items.
    - Clickable cells to retroactively edit past days.
  - **Analytics View**:
    - Streak counters (Current, Longest) and adherence percentage.
    - Multi-line charts or bar charts for custom frequency tracking.

### CLI Interface
- **Interactive & Fast**: Colored terminal outputs, no heavy prompts.
- **Core Views**:
  - `habit status`: Lists today's tasks with clear checkmarks or crosses.
  - `habit heatmap`: Prints an ASCII 100-day sparkline.
  - `habit add <name> --daily`: Fast creation flow.

## 3. User Flow

### First-Time Flow
1. **Installation**: User installs via package manager (e.g., `brew install devhabits` or `npm i -g`).
2. **Initialization**: Running `habit init` creates `~/.config/devhabits/data.db` and starts the local API background service.
3. **Creation**: User types `habit add "DSA Practice" --daily` in the terminal.
4. **First Dashboard Visit**: User runs `habit web` to open `localhost:4224`. They are greeted with a clean slate, explaining keyboard shortcuts.

### Daily Flow
1. **Morning Check**: User opens terminal, types `h status` to see what is due.
2. **Execution**: After a coding session, user quickly types `h done "DSA Practice"`.
3. **Automated Logs**: In the background, a VS Code extension pings the local API to check off "Code for 1 hour".
4. **Weekly Review**: User opens the web dashboard to view their heatmaps and analyze consistency trends over the month.

## 4. Data Model (SQLite)

Tables designed to support 3-state tracking, custom frequencies, and offline integrity.

**Table: `habits`**
- `id` (UUID, Primary Key)
- `name` (String, e.g., "Read Docs")
- `category` (String, e.g., "Learning")
- `frequency_type` (Enum: 'DAILY', 'WEEKLY', 'INTERVAL')
- `interval_days` (Integer, nullable)
- `created_at` (Timestamp)
- `archived` (Boolean)

**Table: `logs`**
- `id` (UUID, Primary Key)
- `habit_id` (UUID, Foreign Key)
- `date` (Date, YYYY-MM-DD)
- `state` (Enum: 'DONE', 'SKIPPED', 'MISSED')
- `source` (Enum: 'CLI', 'WEB', 'API', 'VSCODE')
- `metadata` (JSON, for attaching commit links or coding time)

**Table: `planned_absences`**
- `id` (UUID, Primary Key)
- `start_date` (Date)
- `end_date` (Date)
- `reason` (String)

## 5. System Design

### Architecture Approach: Local-First Hybrid
- **Backend (Go or lightweight Node/FastAPI)**:
  - Single binary serving as the CLI tool AND the local REST API server.
  - Interacts directly with the local SQLite database (`WAL` mode enabled for concurrency).
  - Exposes a local port (e.g., `localhost:4224`) for webhook integrations ("Habits as Code").
- **Frontend (React + TailwindCSS)**:
  - Static SPA bundled and served by the backend binary.
  - Uses `TanStack Query` for caching and optimistic UI updates (instant feedback).
- **Storage Strategy**:
  - SQLite file stored in user's home directory (`~/.config/devhabits/habits.db`).
  - File permissions locked down to owner-only for privacy.

## 6. Development Plan

### Phase 1: The Core Engine (Weeks 1-2)
- Setup SQLite schema.
- Build the core CLI binary (Go/Rust/Python) with basic CRUD commands (`add`, `done`, `skip`, `status`).
- Implement the streak calculation engine and 3-state tracking logic.

### Phase 2: The Dashboard & API (Weeks 3-4)
- Expose local REST API from the binary.
- Build React SPA with Tailwind and Developer aesthetics (dark mode).
- Implement the "Today" Inbox and the GitHub-style Heatmap views.
- Connect frontend to the local API.

### Phase 3: Automations & Export (Weeks 5-6)
- Stabilize API for external webhooks.
- Build a lightweight VS Code extension that POSTs to the local API automatically.
- Implement JSON/CSV Export and Import for data portability.

### Phase 4: Polish & Packaging (Weeks 7-8)
- Refine terminal UX (ASCII sparklines, colors).
- Add the "Planned Absences" feature logic.
- Package as standalone executables for macOS/Linux/Windows via Homebrew/NPM.

## 7. Feature Prioritization

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| SQLite Local Storage | P0 (Critical) | Medium | High (Privacy/Trust) |
| CLI Logging Engine | P0 (Critical) | Low | High (Dev UX) |
| Web Dashboard & Heatmap | P0 (Critical) | High | High (Visualization) |
| 3-State Tracking (Done/Skip) | P1 (High) | Low | High (Retention) |
| Local REST API | P1 (High) | Medium | High (Extensibility) |
| VS Code Integration | P2 (Medium) | Medium | Medium (Automation) |
| Planned Absences | P2 (Medium) | Low | Medium (User Empathy) |
| Gamification / TUI | P3 (Low) | High | Low (Fluff) |

## 8. Unique Positioning

**The Pitch**: "A habit tracker that treats your consistency like code."

Unlike SaaS trackers (that lock in your data) or generic to-do apps (that lack developer context), this product is uniquely built for the modern engineer:
1. **Zero Cloud, Absolute Privacy**: Your life metrics live strictly on your machine in a SQLite database. 
2. **Frictionless Logging**: Log your habits directly from the terminal, or let your IDE do it automatically via the "Habits as Code" local API.
3. **Developer Mental Models**: Embraces Git-style heatmaps, keyboard shortcuts, and "skip days" that respect real-world developer burnout rather than punishing it with lost streaks.
