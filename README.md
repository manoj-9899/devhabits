<h1 align="center">DevHabits</h1>

<p align="center">
  <strong>The Developer-First Local Habit Tracker</strong>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg" />
  <img alt="Node Version" src="https://img.shields.io/badge/Node.js-%3E%3D22.5.0-green.svg" />
  <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
</p>

## 🚀 Overview

DevHabits is a fast, local-first habit tracker built specifically for developers. It provides a seamless tracking experience by combining a powerful **Command Line Interface (CLI)** with a beautiful, modern **Web Dashboard**.

By treating "Habits as Code," you can instantly log a habit in your terminal without breaking your coding flow, while keeping the Web Dashboard open on a secondary monitor for visual analytics.

### Key Features
*   **Dual Interface:** Manage your daily habits directly from the terminal or interact with the web UI simultaneously.
*   **Local-First & Private:** All data is stored locally on your machine in a lightweight SQLite database (using Node.js native SQLite). No cloud, no subscriptions, no tracking.
*   **Zero Database Configuration:** Works out of the box with zero external dependencies.
*   **True Concurrency:** Powered by SQLite's WAL mode, the web dashboard and CLI interact with your data concurrently without locking.

---

## ⚡ Quick Start

### Prerequisites
* **Node.js (v22.5.0+)**: Critical requirement. The backend relies on `--experimental-sqlite`.
* **Git**

### Installation (1 Minute Setup)

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/devhabits.git
cd devhabits
```

**2. Automated Setup**
Run the setup script to install all dependencies and link the CLI globally.
```bash
npm run setup
```

**3. Launch the Application**
Start both the web dashboard and the backend API simultaneously:
```bash
npm run dev
```

The web dashboard is now running at **`http://localhost:5173`**.

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

*Updates made in the CLI reflect instantly in the Web Dashboard!*

---

## 🏗️ Architecture

*   **Backend:** Node.js API server utilizing `--experimental-sqlite` for native, dependency-free database management.
*   **Frontend:** React Single Page Application (SPA) built with Vite and Tailwind CSS.
*   **State Management:** React Query (TanStack Query) for optimistic updates and caching, ensuring a zero-lag UI experience.

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding new features, or improving documentation, please read our [Contributing Guide](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
