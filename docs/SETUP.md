# DevHabits: Beginner Setup Guide 🚀

Welcome! This guide will walk you through exactly how to get this project running on your local machine. Because this project uses both a web interface and a Command Line Interface (CLI), we'll set up both parts.

> **Crucial Prerequisite: Node.js version**
> This backend uses `--experimental-sqlite` which is a native SQLite implementation built directly into Node.js.
> Because of this, **you MUST have Node.js version 22.5.0 or higher installed**. If you are on an older version (like v18 or v20), the backend will crash!
>
> You can check your version by running `node -v` in your terminal.

## Step 1: Set Up the Backend & API

The backend serves the data to the web app and stores your habits locally in a SQLite database.

1. Open a new terminal.
2. Navigate into the `backend` folder:
   ```bash
   cd "backend"
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. _(Optional)_ You can copy `.env.example` to `.env` if you want to configure custom ports or database paths, but the defaults are completely fine for beginners.
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   > **Note:** You should see a message saying "DevHabits API Listening → http://localhost:4224". Leave this terminal open and running!

## Step 2: Set Up the Web Frontend

The frontend is a React application built with Vite and Tailwind CSS.

1. Open a **second, separate terminal** (keep the backend one running).
2. Navigate into the `frontend` folder:
   ```bash
   cd "frontend"
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   > **Tip:** The terminal will give you a local URL (usually `http://localhost:5173`). Ctrl+Click (or Cmd+Click) that link to open the beautiful web dashboard in your browser!

## Step 3: Set Up the CLI (Command Line Interface)

One of the coolest features of this project is the `habit` CLI command. You can mark habits as done right from your terminal without opening the web browser!

1. Open a **third terminal** (or just stop your frontend temporarily and restart it after).
2. Navigate into the `backend` folder:
   ```bash
   cd "backend"
   ```
3. Link the CLI command to your system globally:
   ```bash
   npm link
   ```
4. You're done! Now you can use the `habit` command from **anywhere** on your computer.

### Try out some commands:

- `habit list` — See today's pending habits.
- `habit add "Code for 1 hour"` — Add a new habit.
- `habit done "Code"` — Mark it as done for today (it supports fuzzy matching, so you don't have to type the full name!).
- `habit stats` — View your all-time streaks.

> **Tip:** If you run `habit done "Code"` while having the web dashboard open in your browser, you'll see the UI update automatically!

## Common Issues & Troubleshooting

- **Error: "bad option: --experimental-sqlite"**
  Your Node.js version is too old. Upgrade to at least Node.js v22.5.0.
- **Frontend isn't loading data**
  Make sure your backend server is running on `http://localhost:4224`. The frontend expects the backend to be exactly on that port!
