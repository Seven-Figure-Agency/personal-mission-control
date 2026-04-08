# Mission Control

A personal productivity dashboard for managing tasks, projects, quarterly goals (Rocks), meetings, and decisions. Built with Next.js, SQLite, and Tailwind CSS.

Everything runs locally on your machine. Your data never leaves your computer.

## Features

- **Dashboard** with Top 3 focus tasks, overdue alerts, and energy balance visualization
- **6-status Kanban board** — Maybe, Backlog, To Do, Top 3, In Progress, Completed
- **3-tier project system** — L1 (Major), L2 (Sprint), L3 (Quick Win)
- **Rocks** — quarterly OKR tracking with project linkage
- **Meeting log** with task and decision extraction
- **Decision log** with context, rationale, and audit trail
- **Global search** (Cmd+K)
- **Activity log** for change tracking
- **Python CLI** (`mc.py`) for terminal and AI-assisted management
- **Embedded terminal** (optional) — shell panel inside the dashboard (Cmd+J)
- **Fully configurable** — categories, team members, energy types, meeting types, and organizations all defined in a single config file

## Quick Start

```bash
git clone https://github.com/Seven-Figure-Agency/personal-mission-control.git
cd personal-mission-control
cp config.example.json config.json   # Edit with your details
npm install
npm run dev
```

Open [http://localhost:3100](http://localhost:3100)

## AI-Assisted Setup

For the best setup experience, share this repo with your AI assistant (Claude, ChatGPT, etc.) and point them to **[BUILD_GUIDE.md](BUILD_GUIDE.md)**. The guide includes:

- A setup interview to build your personalized `config.json`
- A walkthrough of the system concepts and weekly rhythm
- Instructions for integrating with AI assistants for ongoing use

Just say: *"Read the BUILD_GUIDE.md in this repo and help me set this up."*

## Configuration

All customizable values live in `config.json` at the project root:

| Field | Description |
|-------|-------------|
| `name` | Dashboard name |
| `owner` | Your name (default task/rock owner) |
| `organizations` | Work contexts you operate in |
| `defaultOrganization` | Primary organization for new items |
| `categories` | Work categories (departments, focus areas) |
| `people` | Team members who can be assigned work |
| `energyTypes` | Energy classifications with colors |
| `meetingTypes` | Types of meetings you have |
| `quarters` | Active quarters for planning |

See `config.example.json` for the full format.

## Python CLI

The CLI works independently of the web app — it reads SQLite directly.

```bash
python3 mc.py status                # Session start: Top 3 + overdue + energy balance
python3 mc.py top3                  # Show current Top 3
python3 mc.py overdue               # Show overdue tasks
python3 mc.py tasks                 # List active tasks
python3 mc.py tasks --status "To Do"  # Filter by status
python3 mc.py create "Task title"   # Create a new task
python3 mc.py update 5 status="In Progress"  # Update a task
python3 mc.py complete 5            # Mark task completed
python3 mc.py projects              # List projects by tier
python3 mc.py set-tier 3 L1         # Set project tier
python3 mc.py query "SELECT ..."    # Raw SQL query
```

## Embedded Terminal (Optional)

Mission Control can include a built-in terminal panel (toggle with Cmd+J). This requires native dependencies that may not compile on all systems.

To enable:

```bash
npm install node-pty ws @xterm/xterm @xterm/addon-fit concurrently @types/ws
```

Then set `"terminal": true` in your `config.json` and use `npm run dev:full` instead of `npm run dev`.

See [BUILD_GUIDE.md](BUILD_GUIDE.md) for platform-specific notes and troubleshooting.

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router, React Server Components)
- [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- Python 3 (CLI)

## Prerequisites

- **Node.js 18+** and **npm** — [nodejs.org](https://nodejs.org) (LTS version)
- **C++ build tools** — needed to compile the SQLite native binding
  - macOS: `xcode-select --install`
  - Linux: `sudo apt install build-essential python3`
  - Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with C++ workload
- **Python 3** (optional, for the `mc.py` CLI)
- **SQLite** is bundled — no separate install needed

See [BUILD_GUIDE.md](BUILD_GUIDE.md) for detailed setup instructions including platform-specific guidance.

## License

MIT
