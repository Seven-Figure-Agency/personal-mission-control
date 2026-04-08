# BUILD GUIDE — Mission Control Setup

This guide is designed to be read by an AI assistant (Claude, ChatGPT, etc.) to help you set up and personalize your Mission Control instance. It can also be followed manually.

---

## What Is This?

Mission Control is a personal productivity system that runs entirely on your machine. It combines:

- **Rocks** — quarterly goals (OKRs) that define what you're working toward
- **Projects** — organized into 3 tiers of importance (L1 Major, L2 Sprint, L3 Quick Win)
- **Tasks** — with a 6-status Kanban workflow and weekly Top 3 focus
- **Meetings** — logged with task and decision extraction
- **Decisions** — captured with context, rationale, and impact for audit trails
- **Energy tracking** — every task has an energy type so you can balance your workload

The system is opinionated about workflow (the statuses, tiers, and weekly rhythm are fixed) but flexible about your domain (categories, team members, energy types, and organizations are all configurable).

---

## Prerequisites

A setup script is included that checks everything automatically. If the user is comfortable with the terminal, they can run:

```bash
bash setup.sh
```

This checks for Node.js, npm, C++ build tools, and Python — installs what's missing (with permission), and gets the app ready to run.

If the user is NOT comfortable with the terminal, the AI assistant should walk them through each step below. On macOS, the Terminal app is in Applications → Utilities → Terminal.

### Required

### Required

| Dependency | Why | How to Install |
|-----------|-----|----------------|
| **Node.js 18+** | Runs the dashboard app | [nodejs.org](https://nodejs.org) — download the LTS version. Or use a version manager: `brew install node` (macOS), `nvm install 18` (any platform) |
| **npm** | Installs packages | Comes bundled with Node.js |
| **C++ build tools** | `better-sqlite3` compiles a native SQLite binding during `npm install` | **macOS:** `xcode-select --install` (installs Command Line Tools). **Linux:** `sudo apt install build-essential python3` (Debian/Ubuntu) or `sudo yum groupinstall "Development Tools"` (RHEL/CentOS). **Windows:** Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with "Desktop development with C++" workload |

### Optional

| Dependency | Why | How to Install |
|-----------|-----|----------------|
| **Python 3** | For the `mc.py` CLI (terminal-based task management) | Most macOS/Linux systems have it. Windows: [python.org](https://python.org) |
| **Git** | To clone the repo | [git-scm.com](https://git-scm.com) |

### What You DON'T Need to Install

- **SQLite** — bundled inside the `better-sqlite3` npm package. No separate install needed. The database file is created automatically on first run.
- **Any cloud accounts** — everything runs locally. No sign-ups, no API keys required for the core app.

### Quick Check

The AI assistant should verify prerequisites by asking the user to run:
```bash
node --version    # Should show v18 or higher
npm --version     # Should show 8+
python3 --version # Optional, for CLI
```

If `node` isn't found, help them install it before proceeding.

---

## For AI Assistants

If a user has shared this repo and asked you to help them set it up, follow these steps. The goal is to make this feel personal — you're building THEIR system, not installing generic software.

**Important: Gauge the user's technical comfort level first.** Ask: "Have you used a terminal/command line before?" If the answer is no or uncertain:
- Explain that a terminal is just a text-based way to run programs on their computer
- On Mac: tell them to open **Terminal** (search for it in Spotlight with Cmd+Space, type "Terminal")
- Give them one command at a time, explain what it does before they run it, and confirm it worked before moving on
- Never dump multiple commands at once
- If you (the AI) have the ability to run commands directly (like in Claude Code), offer to do it for them

**If you can run commands:** The fastest path is `bash setup.sh` — it handles prerequisites, dependencies, and tells you what's missing. Then proceed to the interview.

### Step 0: Verify Prerequisites

Before anything else, check that the user has the required tools installed (see Prerequisites section above). Run the quick check commands. If anything is missing, help them install it before proceeding.

### Step 1: Setup Interview

This is the most important step. Ask these questions conversationally — don't dump them all at once. Explain each concept as you go, and tailor your examples to the user's role. A startup founder gets different suggestions than an engineering manager or a freelancer.

**1. "What's your name?"**
- This becomes the `owner` field — you'll be the default owner for rocks and the implied assignee when no person is specified.

**2. "What organizations or work contexts do you operate across?"**
- Examples: "Acme Corp", "Side Project", "Personal", "Consulting"
- Most people have 2-3. Every task, meeting, and decision gets tagged with one.
- Ask: "Which is your primary?" — this becomes the default for new items.

**3. "What are your main categories of work?"**
- These are the departments or focus areas you organize work by.
- Examples: Engineering, Marketing, Operations, Sales, Product, Design, HR, Finance
- Suggest 4-6 based on their described role. A founder might have: Product, Sales, Operations, Hiring. An engineer might have: Backend, Frontend, Infrastructure, Documentation.

**4. "Who are the people you regularly assign or track work for?"**
- Include the user themselves. Use "First Name" or "First L" format.
- If they work solo, the list is just their name.
- If they manage a team, list the direct reports and key collaborators.

**5. "How do you think about the energy character of your work?"**
- Explain: "Every task has an energy type — it's about what kind of effort it requires, not how hard it is. Tracking this helps you notice when you're spending too much time in one mode."
- Default suggestion: **Deep Work** (focused building, coding, writing), **Reactive** (fires, urgent responses, email), **Creative** (ideation, brainstorming, teaching)
- Some people prefer: **Maker** / **Manager** / **Admin**
- Others: **Build** / **Sell** / **Teach**
- Let them customize or accept the defaults.
- For each type, assign a color: red, blue, emerald, amber, violet, cyan, orange, pink

**6. "What kinds of meetings do you regularly have?"**
- List 4-8 types. Examples: Standup, 1:1, Strategy, All-Hands, Client, Sprint Review, Interview, Workshop
- These become the options when logging meetings.

**7. "What quarters do you want to plan for?"**
- Suggest the current quarter and the next 3.
- Format: "Q2 2026", "Q3 2026", etc.

### Step 2: Generate config.json

Based on their answers, create a `config.json` file in the project root. Example:

```json
{
  "name": "Mission Control",
  "owner": "Jane",
  "organizations": ["Acme Corp", "Personal"],
  "defaultOrganization": "Acme Corp",
  "categories": ["Product", "Engineering", "Sales", "Operations"],
  "people": ["Jane", "Bob", "Alice"],
  "energyTypes": [
    { "name": "Deep Work", "color": "blue" },
    { "name": "Reactive", "color": "red" },
    { "name": "Creative", "color": "emerald" }
  ],
  "meetingTypes": ["Standup", "1:1", "Strategy", "All-Hands", "Client"],
  "quarters": ["Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"]
}
```

Show the user the generated config and confirm it looks right before writing it.

### Step 3: Installation

```bash
npm install
npm run dev
```

The app starts at [http://localhost:3100](http://localhost:3100). The SQLite database is created automatically on first run in `db/mission-control.db`.

### Step 4: First Steps Walkthrough

Guide the user through their first session:

1. **Visit the Dashboard** — it will be empty. That's normal.

2. **Create their first Rock** — go to Rocks, click "New Rock". A Rock is a quarterly goal.
   - Example: "Launch new website" for Q3 2026
   - Pick a category and due date

3. **Create a Project under that Rock** — go to Projects, click "New Project".
   - Link it to the Rock they just created
   - Set the tier: L1 if it's a major multi-week effort, L2 for a sprint-sized deliverable, L3 for a quick win

4. **Create 3-5 tasks** — go to Tasks, use the "+" button in any column.
   - Set energy types, categories, due dates
   - Move exactly 3 to "Top 3" status — these are the focus for the week

5. **Return to Dashboard** — they should now see their Top 3, energy balance, and any upcoming due dates.

### Step 5: Explain the Weekly Rhythm

The system is built around a weekly cadence:

- **Monday: Top 3 Ritual** — Select the 3 most important tasks for the week. Move them to "Top 3" status. This is the core practice. The dashboard shows these prominently.

- **Daily: Work from Top 3** — Focus on your Top 3 tasks. As you start work, move tasks to "In Progress". When done, mark "Completed". If something urgent comes up, it's visible as a task but shouldn't displace your Top 3 unless it truly must.

- **Friday: Weekly Close** — Review what got done. Mark completed items. Move unfinished Top 3 tasks back to "To Do" (deliberate carry-over, not silent drift). Create any new tasks for next week.

- **Quarterly: Rock Review** — Review your Rocks. Which are complete? Which are blocked? Set new Rocks for the next quarter.

### Step 6: Python CLI (Optional)

If the user has Python 3 installed, introduce the CLI:

```bash
python3 mc.py status    # Quick overview: Top 3, overdue, energy balance
python3 mc.py top3      # Just the Top 3
python3 mc.py create "Review Q3 budget" category="Operations" energy_type="Deep Work"
```

The CLI reads the database directly — it works even when the web app isn't running. It's particularly useful for AI-assisted workflows where the AI manages tasks on your behalf.

### Step 7: Enable Terminal (Optional)

Mission Control includes an embedded terminal panel (Cmd+J) that opens a shell right inside the dashboard. This is powerful for AI-assisted workflows — your AI can run CLI commands without switching windows.

**Caveats to explain to the user:**
- Requires `node-pty`, a native Node.js module that compiles C++ code during install
- On macOS: usually works out of the box if Xcode Command Line Tools are installed (`xcode-select --install`)
- On Linux: needs `build-essential` and `python3`
- On Windows: needs Visual Studio Build Tools — this is where it gets tricky
- If the install fails, it does NOT affect the rest of the app — Mission Control works fine without it

**To enable:**

1. Install the terminal dependencies:
```bash
npm install node-pty ws @xterm/xterm @xterm/addon-fit concurrently @types/ws
```

2. Set `"terminal": true` in `config.json`

3. Use `npm run dev:full` instead of `npm run dev` (this starts both the Next.js app and the terminal WebSocket server)

If `npm install node-pty` fails, skip this step. The user can always use their regular terminal alongside the dashboard.

### Step 8: AI Integration (Optional)

If the user works with an AI assistant regularly (Claude Code, etc.), suggest creating a `CLAUDE.md` or equivalent file that:

```markdown
# Mission Control

## Quick Reference
- Dashboard: http://localhost:3100
- CLI: `python3 mc.py status`
- Database: db/mission-control.db (SQLite)
- Config: config.json

## Session Protocol
At the start of each session, run `python3 mc.py status` to check:
- Current Top 3
- Overdue items
- Energy balance

## Weekly Rhythm
- Monday: Set Top 3 for the week
- Friday: Close out completed work
```

### Step 9: Connect Meeting Notes (Optional)

Mission Control has a full meetings system — but meetings need to get into the system somehow. There are two approaches:

**Manual entry:** Create meetings directly in the dashboard (Meetings page → New Meeting). Good for logging key meetings after the fact.

**Automated ingestion:** If the user has a meeting note-taker with an API, you can build a sync script that pulls recordings/transcripts and creates meeting records in SQLite. This is an advanced step.

**Meeting note-takers with APIs:**
- [Fathom](https://fathom.video) — REST API for recordings and transcripts
- [Fireflies.ai](https://fireflies.ai) — API for meeting transcripts and action items
- [Otter.ai](https://otter.ai) — API access on business plans
- [Grain](https://grain.com) — API for highlights and recordings

**Note:** Not all meeting tools have usable APIs. Before committing to a note-taker for this integration, verify their API is actually available and accessible on your plan. Some tools advertise API access but restrict it heavily.

**How to build a meeting sync (for the AI assistant):**

1. Ask the user: "Do you use a meeting note-taker? Which one?"
2. If yes, check if it has an API and help them get an API key
3. Create a sync script (Python is easiest) that:
   - Polls the meeting service API for new recordings
   - Extracts: title, date, attendees, duration, summary, key topics
   - Inserts into the `meetings` table via SQLite (use `mc.py query` or direct SQLite)
   - Optionally extracts action items → creates tasks linked to the meeting
4. Schedule it to run automatically:
   - **macOS:** `launchd` plist (runs on a schedule even without a terminal open)
   - **Linux:** `cron` job (`crontab -e`)
   - **Any platform:** GitHub Actions on a schedule (requires the database to be accessible)

**Example sync script skeleton** (Python):
```python
import sqlite3
import requests
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "db", "mission-control.db")
API_KEY = os.environ.get("MEETING_API_KEY")  # Store in .env, not in code

def sync_meetings():
    # 1. Fetch new meetings from your note-taker's API
    # 2. For each new meeting:
    db = sqlite3.connect(DB_PATH)
    db.execute("""
        INSERT INTO meetings (meeting_title, date, meeting_type, attendees, duration, summary, status, organization)
        VALUES (?, ?, ?, ?, ?, ?, 'Unprocessed', ?)
    """, (title, date, meeting_type, attendees, duration, summary, organization))
    db.commit()
    db.close()

if __name__ == "__main__":
    sync_meetings()
```

Store the API key in a `.env` file (already gitignored) or as an environment variable — never hardcode it.

---

## System Concepts Reference

### The 6-Status Kanban

| Status | Purpose |
|--------|---------|
| **Maybe** | Ideas and possibilities. Low urgency parking lot. No commitment. |
| **Backlog** | Committed but not this week. Roughly prioritized. |
| **To Do** | This week's work queue. Should have due dates. |
| **Top 3** | THE three tasks for this week. Never more than three. |
| **In Progress** | Currently being worked on. |
| **Completed** | Done. |

Click any status badge to advance it to the next status.

### The 3-Tier Project System

| Tier | Name | Scope |
|------|------|-------|
| **L1** | Major | Multi-week projects. Usually linked to a Rock. The big bets. |
| **L2** | Sprint | Under 2 weeks. A contained deliverable with clear boundaries. |
| **L3** | Quick Win | One work session. Often standalone, not part of a bigger project. |

### Rocks (Quarterly Goals)

Rocks are quarterly objectives — the 3-5 big things you want to accomplish this quarter. Each Rock can have Projects underneath it, and Projects have Tasks. This creates a hierarchy: **Rock -> Project -> Task**.

The term comes from the EOS (Entrepreneurial Operating System) methodology, but you can think of them as quarterly OKRs.

### Energy Types

Every task has an energy character. It's not about difficulty — it's about what kind of mental mode the work requires. The dashboard shows your energy balance across all active tasks.

If you notice you're overloaded with reactive/urgent work, that's a signal to delegate or defer some of it so you have space for deep, creative work.

### Meetings & Decisions

Meetings can spawn tasks and decisions. Decisions capture the context, rationale, and impact of choices — creating an audit trail. When someone asks "why did we decide X?", you can trace it back to the meeting where it happened.

---

## Architecture Notes

For AI assistants working with this codebase:

- **Framework**: Next.js 15 with App Router and React Server Components
- **Database**: SQLite via `better-sqlite3` (file: `db/mission-control.db`)
- **Styling**: Tailwind CSS 4
- **Config**: `config.json` at project root (not committed to git — user-specific)
- **CLI**: `mc.py` (Python 3, reads SQLite directly)
- **No authentication** — this is a local-only tool
- **Server components** call database functions directly (no fetch needed)
- **Client components** use `/api/*` routes for mutations
- **Config on client**: Components use `useConfig()` hook (React context, loaded via `/api/config`)
- **Config on server**: Import `getConfig()` from `@/lib/config`

### Key Files

| File | Purpose |
|------|---------|
| `config.json` | All customizable values |
| `db/schema.sql` | Database schema |
| `src/lib/config.ts` | Server-side config loader |
| `src/lib/useConfig.ts` | Client-side config context + hook |
| `src/lib/db.ts` | Database connection + initialization |
| `src/lib/queries.ts` | All database queries |
| `src/lib/types.ts` | TypeScript interfaces + system constants |
| `src/app/page.tsx` | Dashboard (server component) |
| `src/app/api/` | REST API routes |
| `mc.py` | Python CLI |

### Adding New Energy Types or Categories

Just edit `config.json` and restart the dev server. No database migration needed — these fields are free-text in SQLite, validated at the application layer.

Available energy type colors: `red`, `blue`, `emerald`, `amber`, `violet`, `cyan`, `orange`, `pink`.
