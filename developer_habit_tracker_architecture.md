# Tech Architecture: Developer-First Local Habit Tracker

Based on the product plan, here is the implementation-ready software architecture designed for simplicity, scalability, and an optimal developer experience.

## 1. Tech Stack

To ensure a seamless dual Web + CLI experience with local SQLite storage, we use a single-binary approach.

*   **Backend & CLI Engine:** **Go (Golang)**. Go produces incredibly fast, self-contained, cross-platform binaries. It handles both the CLI command execution and the background HTTP server for the dashboard.
*   **Database:** **SQLite3** (`mattn/go-sqlite3`). A local, file-based SQL database that requires zero configuration.
*   **Frontend:** **React + TypeScript + Vite**. A fast, static Single Page Application (SPA).
*   **Styling:** **Tailwind CSS**. Perfect for rapid, developer-focused UI construction (dark mode, glassmorphism).
*   **Delivery:** **Go `embed`**. The Vite-built React frontend is compiled into static assets (HTML/JS/CSS) which are embedded directly into the Go binary. The user downloads exactly **one** file.

## 2. Folder Structure

The project is structured as a standard Go monorepo with an embedded frontend.

```text
devhabits/
├── cmd/
│   └── devhabits/
│       └── main.go             # Entry point: routes to CLI or Web server
├── internal/
│   ├── api/                    # REST API layer (e.g., using Chi or standard lib)
│   │   ├── handlers.go         # HTTP request/response logic
│   │   └── server.go           # HTTP server initialization
│   ├── db/
│   │   ├── schema.sql          # SQLite table definitions
│   │   ├── connection.go       # SQLite init (enables WAL mode)
│   │   └── queries.go          # SQL queries (CRUD logic)
│   ├── models/
│   │   └── types.go            # Shared Go structs (Habit, Log)
│   └── cli/                    # CLI Commands (using spf13/cobra)
│       ├── root.go             # Base command config
│       ├── add.go              # `habit add`
│       ├── logs.go             # `habit done`, `habit skip`
│       ├── status.go           # `habit status`
│       └── web.go              # `habit web` (starts the embedded API server)
├── ui/                         # Vite + React Frontend Workspace
│   ├── src/
│   │   ├── components/         # Heatmap, Inbox, Buttons
│   │   ├── pages/              # Dashboard
│   │   ├── api/                # Axios API client functions
│   │   ├── store/              # State management
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── embed.go                    # The go:embed directive linking `./ui/dist`
├── go.mod
└── go.sum
```

## 3. API Design (REST)

The local API serves the web dashboard and enables the "Habits as Code" capability.

### Routes

*   `GET /api/habits` - List all active habits.
*   `POST /api/habits` - Create a new habit.
*   `GET /api/habits/:id/logs` - Get completion logs for a specific habit.
*   `POST /api/logs` - Record an action (Done, Skip, Miss).
*   `GET /api/analytics/heatmap` - Fetch aggregated 365-day data for the UI contribution graph.

### Request/Response Example: Logging a Habit

**`POST /api/logs`**

*Request:*
```json
{
  "habit_id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-04-23",
  "state": "DONE",
  "source": "API"
}
```

*Response (200 OK):*
```json
{
  "status": "success",
  "data": {
    "log_id": "a1b2c3d4-...",
    "habit_id": "550e8400-e29b-41d4-a716-446655440000",
    "current_streak": 14,
    "best_streak": 21
  }
}
```

## 4. CLI Command Design

Built with `spf13/cobra` in Go for robust, discoverable subcommands.

*   `habit init`
    *   Creates `~/.config/devhabits/habits.db` (or OS equivalent) and applies the initial SQL schema.
*   `habit add "Read 10 pages" [--frequency=daily]`
    *   Creates a new habit.
*   `habit done <habit_name_or_id> [--date=YYYY-MM-DD]`
    *   Marks a habit as Done. Defaults to today. Can optionally pass yesterday's date if logging late.
*   `habit skip <habit_name_or_id>`
    *   Marks a habit as Skipped. Preserves the current streak.
*   `habit status`
    *   Prints a colored ASCII table showing today's tasks and their states (Pending, Done, Skipped).
*   `habit web [--port=4224]`
    *   Boots up the local HTTP server, exposes the API, and serves the embedded React dashboard at `http://localhost:4224`.

## 5. State Management Approach

**Frontend (React)**
1.  **Server State & Data Fetching:** **TanStack Query (React Query)**.
    *   *Why?* It handles caching, loading states, and background refetching automatically.
    *   *Optimistic Updates:* When a user clicks "Done" on the web UI, React Query instantly updates the local cache to show a checkmark (zero-lag UX) while making the `POST /api/logs` request in the background. If the network request fails, it rolls back the UI.
2.  **Local UI State:** **Zustand** (or React Context).
    *   Used only for transient UI state that doesn't belong in the database (e.g., dark/light theme toggle, current selected sidebar tab, search bar text).

## 6. Local-First Data Strategy

To ensure data integrity when a user has the web dashboard running in the background while typing commands in their CLI, the database strategy must be robust.

1.  **Location:** The SQLite file is stored exclusively on the user's machine in their OS-specific config directory (e.g., `~/.config/devhabits/habits.db`).
2.  **Concurrency (The WAL Mode):** 
    *   SQLite locks the entire database on writes by default, which would cause "database is locked" errors if the CLI tries to write while the API is reading.
    *   *Solution:* We will execute `PRAGMA journal_mode=WAL;` (Write-Ahead Logging) on initialization. WAL mode allows simultaneous readers and a writer, meaning the CLI can log a habit while the web server is actively polling or serving the dashboard.
3.  **Portability & Backup:** 
    *   Because it is local-first, backups are as simple as copying the `.db` file.
    *   We will provide a `habit export` CLI command that dumps the SQLite data into a flat JSON file for easy version control via Git.
4.  **No-Setup Deployment:** By leveraging Go's `embed`, there is no `node_modules`, no Docker container, and no cloud service required. The user runs the binary, and the database and web server live entirely within that single process context.
