#!/usr/bin/env python3
"""
mc.py — CLI interface to Mission Control SQLite.
Works whether or not the Next.js app is running.

Usage:
  python3 mc.py top3                       # Show current Top 3
  python3 mc.py overdue                    # Show overdue tasks
  python3 mc.py status                     # Session start check (Top 3 + overdue + energy)
  python3 mc.py tasks [--status STATUS]    # List tasks
  python3 mc.py create "Task title"        # Create a new task
  python3 mc.py update ID field=value      # Update a task field
  python3 mc.py complete ID                # Mark task completed
  python3 mc.py projects                   # List projects with tiers
  python3 mc.py set-tier ID L1|L2|L3       # Set project tier
  python3 mc.py query "SQL"                # Raw SQL query
"""

import sqlite3
import json
import sys
import os
from datetime import date

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "mission-control.db")
CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
EXAMPLE_CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.example.json")


def get_config():
    """Load config.json, falling back to config.example.json."""
    for path in [CONFIG_PATH, EXAMPLE_CONFIG_PATH]:
        if os.path.exists(path):
            with open(path) as f:
                return json.load(f)
    return {"defaultOrganization": "My Company", "owner": "User", "energyTypes": []}


def get_db():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        print("Run 'npm run dev' once to initialize the database.")
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def cmd_top3():
    db = get_db()
    rows = db.execute("""
        SELECT t.*, p.project_name FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.status = 'Top 3'
        ORDER BY t.priority = 'High' DESC, t.due_date ASC
    """).fetchall()

    if not rows:
        print("No Top 3 set. Time for the Monday ritual?")
        return

    print("Top 3:")
    print("=" * 50)
    for i, r in enumerate(rows, 1):
        overdue = ""
        if r["due_date"] and r["due_date"] < str(date.today()):
            overdue = " [OVERDUE]"
        energy = f" [{r['energy_type']}]" if r["energy_type"] else ""
        due = f" (due {r['due_date']})" if r["due_date"] else ""
        print(f"  {i}. {r['task_title']}{energy}{due}{overdue}")
    db.close()


def cmd_overdue():
    db = get_db()
    rows = db.execute("""
        SELECT * FROM tasks
        WHERE due_date < date('now') AND status != 'Completed'
        ORDER BY due_date ASC
    """).fetchall()

    if not rows:
        print("No overdue tasks.")
        return

    print(f"Overdue Tasks ({len(rows)}):")
    print("=" * 50)
    for r in rows:
        days = (date.today() - date.fromisoformat(r["due_date"])).days
        print(f"  - {r['task_title']} ({days}d overdue, {r['status']})")
    db.close()


def cmd_status():
    """Session start check."""
    db = get_db()
    config = get_config()

    # Top 3
    top3 = db.execute("""
        SELECT t.*, p.project_name FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.status = 'Top 3'
        ORDER BY t.priority = 'High' DESC, t.due_date ASC
    """).fetchall()

    # Overdue
    overdue = db.execute("""
        SELECT COUNT(*) as count FROM tasks
        WHERE due_date < date('now') AND status != 'Completed'
    """).fetchone()["count"]

    # Energy balance
    energy = {}
    for row in db.execute("""
        SELECT energy_type, COUNT(*) as count FROM tasks
        WHERE status NOT IN ('Completed', 'Maybe') AND energy_type IS NOT NULL
        GROUP BY energy_type
    """).fetchall():
        energy[row["energy_type"]] = row["count"]

    print("Mission Control Status")
    print("=" * 40)
    print()

    if not top3:
        print("Top 3: NOT SET")
        today = date.today()
        if today.weekday() == 0:
            print("  It's Monday — time for the Top 3 ritual!")
    else:
        print("Top 3:")
        for i, r in enumerate(top3, 1):
            energy_str = f" [{r['energy_type']}]" if r["energy_type"] else ""
            due_str = f" - Due {r['due_date']}" if r["due_date"] else ""
            print(f"  {i}. {r['task_title']}{due_str}{energy_str}")

    print()
    if overdue > 0:
        print(f"Overdue: {overdue} items")
    else:
        print("Overdue: None")

    # Dynamic energy display from config
    energy_types = config.get("energyTypes", [])
    if energy_types:
        parts = []
        for et in energy_types:
            name = et["name"] if isinstance(et, dict) else et
            parts.append(f"{energy.get(name, 0)} {name}")
        print(f"Energy: {' / '.join(parts)}")

    # Warnings
    warnings = []
    if not top3:
        warnings.append("No Top 3 set")

    if overdue >= 1:
        old_overdue = db.execute("""
            SELECT COUNT(*) as count FROM tasks
            WHERE due_date < date('now', '-7 days') AND status != 'Completed'
        """).fetchone()["count"]
        if old_overdue > 0:
            warnings.append(f"{old_overdue} tasks overdue by 7+ days — suggest cleanup")

    if warnings:
        print()
        for w in warnings:
            print(f"  WARNING: {w}")

    db.close()


def cmd_tasks(status_filter=None):
    db = get_db()
    if status_filter:
        rows = db.execute(
            "SELECT * FROM tasks WHERE status = ? ORDER BY due_date ASC NULLS LAST",
            (status_filter,)
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM tasks WHERE status != 'Completed' ORDER BY status, due_date ASC NULLS LAST"
        ).fetchall()

    for r in rows:
        energy = f" [{r['energy_type']}]" if r["energy_type"] else ""
        due = f" (due {r['due_date']})" if r["due_date"] else ""
        print(f"  [{r['status']}] {r['task_title']}{energy}{due}  (id:{r['id']})")
    db.close()


def cmd_create(title, **kwargs):
    config = get_config()
    db = get_db()
    fields = {"task_title": title, "status": "To Do", "organization": config["defaultOrganization"]}
    fields.update(kwargs)

    cols = ", ".join(fields.keys())
    placeholders = ", ".join("?" * len(fields))
    db.execute(f"INSERT INTO tasks ({cols}) VALUES ({placeholders})", list(fields.values()))
    db.commit()
    task_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    print(f"Created task #{task_id}: {title}")
    db.close()
    return task_id


def cmd_update(task_id, **kwargs):
    db = get_db()
    sets = ", ".join(f"{k} = ?" for k in kwargs.keys())
    vals = list(kwargs.values()) + [task_id]
    db.execute(f"UPDATE tasks SET {sets}, updated_at = datetime('now') WHERE id = ?", vals)
    db.commit()
    print(f"Updated task #{task_id}: {kwargs}")
    db.close()


def cmd_complete(task_id):
    cmd_update(int(task_id), status="Completed")


def cmd_projects():
    db = get_db()
    rows = db.execute("""
        SELECT p.id, p.project_name, p.tier, p.status, p.priority, r.rock_name,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'Completed') as done
        FROM projects p
        LEFT JOIN rocks r ON p.rock_id = r.id
        ORDER BY
          CASE p.tier WHEN 'L1' THEN 1 WHEN 'L2' THEN 2 WHEN 'L3' THEN 3 END,
          p.status = 'In Progress' DESC
    """).fetchall()
    print(f"Projects ({len(rows)}):")
    print("=" * 60)
    for r in rows:
        rock = f" [Rock: {r['rock_name']}]" if r["rock_name"] else ""
        progress = f" ({r['done']}/{r['task_count']} tasks)" if r["task_count"] > 0 else ""
        print(f"  [{r['tier']}] {r['project_name']} — {r['status']}{rock}{progress}  (id:{r['id']})")
    db.close()


def cmd_set_tier(project_id, tier):
    if tier not in ("L1", "L2", "L3"):
        print("Tier must be L1, L2, or L3")
        return
    db = get_db()
    db.execute("UPDATE projects SET tier = ?, updated_at = datetime('now') WHERE id = ?", (tier, int(project_id)))
    db.commit()
    name = db.execute("SELECT project_name FROM projects WHERE id = ?", (int(project_id),)).fetchone()
    print(f"Set {name['project_name']} → {tier}")
    db.close()


def cmd_query(sql):
    db = get_db()
    try:
        cursor = db.execute(sql)
        stripped = sql.strip().upper()
        if stripped.startswith(("UPDATE", "INSERT", "DELETE")):
            db.commit()
            print(f"Executed: {sql[:80]}{'...' if len(sql) > 80 else ''} ({cursor.rowcount} rows affected)")
        else:
            rows = cursor.fetchall()
            if rows:
                cols = rows[0].keys()
                print("\t".join(cols))
                print("-" * 60)
                for r in rows:
                    print("\t".join(str(r[c]) for c in cols))
            else:
                print("(no results)")
    except Exception as e:
        print(f"Error: {e}")
    db.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1]

    if cmd == "top3":
        cmd_top3()
    elif cmd == "overdue":
        cmd_overdue()
    elif cmd == "status":
        cmd_status()
    elif cmd == "tasks":
        status = None
        if "--status" in sys.argv:
            idx = sys.argv.index("--status")
            if idx + 1 < len(sys.argv):
                status = sys.argv[idx + 1]
        cmd_tasks(status)
    elif cmd == "create":
        if len(sys.argv) < 3:
            print("Usage: mc.py create \"Task title\" [field=value ...]")
            return
        title = sys.argv[2]
        kwargs = {}
        for arg in sys.argv[3:]:
            if "=" in arg:
                k, v = arg.split("=", 1)
                kwargs[k] = v
        cmd_create(title, **kwargs)
    elif cmd == "update":
        if len(sys.argv) < 4:
            print("Usage: mc.py update ID field=value [field=value ...]")
            return
        task_id = int(sys.argv[2])
        kwargs = {}
        for arg in sys.argv[3:]:
            if "=" in arg:
                k, v = arg.split("=", 1)
                kwargs[k] = v
        cmd_update(task_id, **kwargs)
    elif cmd == "complete":
        if len(sys.argv) < 3:
            print("Usage: mc.py complete ID")
            return
        cmd_complete(sys.argv[2])
    elif cmd == "projects":
        cmd_projects()
    elif cmd == "set-tier":
        if len(sys.argv) < 4:
            print("Usage: mc.py set-tier ID L1|L2|L3")
            return
        cmd_set_tier(sys.argv[2], sys.argv[3])
    elif cmd == "query":
        if len(sys.argv) < 3:
            print("Usage: mc.py query \"SQL\"")
            return
        cmd_query(sys.argv[2])
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()
