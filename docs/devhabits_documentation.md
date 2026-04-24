# DevHabits: The Developer-First Habit Tracker

## Project Overview

DevHabits is a fast, local-first habit tracker built specifically for developers. It provides a seamless tracking experience by combining a powerful Command Line Interface (CLI) with a beautiful, modern Web Dashboard. Because it runs locally on your machine, it ensures complete privacy, zero latency, and an uninterrupted workflow.

### Key Features

- **Dual Interface:** Manage your daily habits directly from the terminal or interact with a sleek, interactive web UI.
- **Local-First & Private:** All your data is stored locally on your machine in a lightweight SQLite database (using Node.js native SQLite). No cloud synchronization, no subscriptions, and absolutely no data tracking.
- **Zero Configuration for Databases:** It works out of the box. No complex database setup or external server configurations are required.

## Unique Value Proposition

DevHabits stands out in a crowded market of productivity apps by treating **"Habits as Code."**

- **The Best of Both Worlds:** Unlike traditional trackers that force you to choose between a strictly terminal-based tool or a web-only app, DevHabits gives you both simultaneously. You can instantly log a habit in your terminal (e.g., `habit done "Read documentation"`) without breaking your coding flow, while keeping the Web Dashboard open on a secondary monitor for beautiful visual analytics and contribution graphs.
- **True Data Ownership & Concurrency:** Your data truly belongs to you. Using SQLite's WAL (Write-Ahead Logging) mode, the database allows the web dashboard and the CLI to interact with your data at the exact same time without locking or crashing. Furthermore, backups are as simple as copying your local `.db` file.

---

## Beginner-Friendly Setup Guide

We have completely optimized the local development environment so that you only need **one single command** to start the entire application!

### Prerequisites

Before you begin, ensure you have the following free tools installed on your machine:

1.  **Node.js (version 22.5.0 or higher)** – This is **CRITICAL** because the backend uses native SQLite (`--experimental-sqlite`), which requires newer Node.js versions. Check your version with `node -v`. You can download it from [nodejs.org](https://nodejs.org/).
2.  **Git** – To download the project source code. Download it from [git-scm.com](https://git-scm.com/).

### Installation Steps

**Step 1: Download the Project**
Open your terminal and download the repository to your computer:

```bash
git clone https://github.com/manojpawar/devhabits.git
cd "devhabits"
```

**Step 2: One-Click Setup**
We have created an automated setup command that installs dependencies for the root, frontend, and backend, and automatically links the CLI globally. Run this single command:

```bash
npm install
npm run setup
```

### Running DevHabits

You no longer need to open three different terminals. Everything is handled for you!

**1. Start the Application**
To launch both the web dashboard and the backend API at the exact same time, simply run:

```bash
npm run dev
```

_(This command uses a tool called `concurrently` to run both servers in a single terminal window. Leave this window open while you work.)_

**2. Open the Web Dashboard**
Open your favorite web browser and go to the frontend URL provided in the terminal (usually **`http://localhost:5173`**).

**3. Use the CLI Anywhere**
Because the setup script linked the command globally, you can open a new terminal window (in any folder on your computer) and use the CLI immediately:

```bash
habit add "Code for 1 hour"
habit done "Code"
habit list
```

If you check your web dashboard, you'll see the updates reflected instantly!
