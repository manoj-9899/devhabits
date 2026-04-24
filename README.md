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
    <a href="#-architecture">Architecture</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

## ✨ Key Features

- **💻 Dual Interface**: Manage your daily habits directly from the terminal or interact with the sleek web UI simultaneously.
- **🔒 Local-First & Private**: All data is stored locally on your machine in a lightweight SQLite database. No cloud, no subscriptions, no tracking.
- **⚙️ Zero Database Configuration**: Works out of the box with zero external dependencies using Node.js native SQLite (`--experimental-sqlite`).
- **⚡ True Concurrency**: Powered by SQLite's WAL mode, the web dashboard and CLI interact with your data concurrently without locking or lagging.
- **📈 Advanced Analytics**: Real-time streak tracking, completion heatmaps, and habit performance metrics via the React dashboard.

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

2. **Automated Setup**
   Run the setup script to install all dependencies and link the CLI globally.
   ```bash
   npm run setup
   ```

3. **Launch the Application**
   Start both the web dashboard and the backend API simultaneously:
   ```bash
   npm run dev
   ```
   > The web dashboard is now running at **`http://localhost:5173`**.

---

## 💻 CLI Usage

Because the setup script linked the command globally, you can use the CLI from any terminal window on your machine:

```bash
# Add a new habit
habit add "Code for 1 hour"

# Mark a habit as completed today
habit done "Code"

# List today's pending habits
habit list

# View your all-time streaks
habit stats
```

> **Note:** Updates made in the CLI reflect instantly in the Web Dashboard thanks to React Query!

---

## 🏗 Architecture

### Tech Stack
- **Backend**: Node.js API server utilizing `--experimental-sqlite` for native, dependency-free database management. Express.js for routing.
- **Frontend**: React Single Page Application (SPA) built with Vite, TypeScript, and Tailwind CSS.
- **State Management**: React Query (TanStack Query) for optimistic updates and caching, ensuring a zero-lag UI experience.
- **CLI Tool**: Built with Commander.js and Chalk for a premium terminal experience.

### Repository Structure
```
.
├── backend/            # Express API, CLI logic, and SQLite database
├── frontend/           # React + Vite web dashboard application
├── docs/               # Advanced documentation and architectural diagrams
├── package.json        # Root workspace configuration and scripts
└── README.md           # Project overview (You are here)
```

---

## 📚 Documentation

For an in-depth understanding of the product, architecture, and deployment, please refer to the files in the `docs/` directory:
- [Architecture Details](docs/developer_habit_tracker_architecture.md)

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
