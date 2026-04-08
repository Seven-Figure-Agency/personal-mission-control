-- Mission Control SQLite Schema

CREATE TABLE IF NOT EXISTS company_priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  priority TEXT NOT NULL,
  type TEXT CHECK(type IN ('Annual Target', 'Annual Goal', 'Company Rock', 'Leadership Rock', 'Team Rock')),
  owner TEXT,
  quarter TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Complete', 'Carried Forward')),
  notes TEXT,
  supports_id INTEGER REFERENCES company_priorities(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rock_name TEXT NOT NULL,
  quarter TEXT,
  status TEXT DEFAULT 'Not Started' CHECK(status IN ('Not Started', 'In Progress', 'Complete', 'Blocked')),
  due_date TEXT,
  category TEXT,
  owner TEXT,
  notes TEXT,
  resources TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  rock_id INTEGER REFERENCES rocks(id),
  status TEXT DEFAULT 'Not Started' CHECK(status IN ('Not Started', 'In Progress', 'Complete', 'Blocked', 'On Hold')),
  due_date TEXT,
  priority TEXT DEFAULT 'Medium' CHECK(priority IN ('High', 'Medium', 'Low')),
  category TEXT,
  energy_type TEXT,
  person TEXT,
  tier TEXT DEFAULT 'L2' CHECK(tier IN ('L1', 'L2', 'L3')),
  notes TEXT,
  resources TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_title TEXT NOT NULL,
  task_description TEXT,
  due_date TEXT,
  priority TEXT DEFAULT 'Medium' CHECK(priority IN ('High', 'Medium', 'Low')),
  status TEXT DEFAULT 'To Do' CHECK(status IN ('Maybe', 'Backlog', 'To Do', 'Top 3', 'In Progress', 'Completed')),
  notes TEXT,
  project_id INTEGER REFERENCES projects(id),
  category TEXT,
  energy_type TEXT,
  person TEXT,
  priority_id INTEGER REFERENCES company_priorities(id),
  meeting_id INTEGER REFERENCES meetings(id),
  organization TEXT,
  resources TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_title TEXT NOT NULL,
  date TEXT,
  meeting_type TEXT,
  attendees TEXT,
  duration INTEGER,
  summary TEXT,
  key_topics TEXT,
  status TEXT DEFAULT 'Unprocessed' CHECK(status IN ('Unprocessed', 'Processed', 'Complete')),
  category TEXT,
  source_file TEXT,
  recording TEXT,
  notes TEXT,
  resources TEXT,
  organization TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_title TEXT NOT NULL,
  date TEXT,
  context TEXT,
  decision TEXT,
  rationale TEXT,
  impact TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Superseded', 'Reversed')),
  category TEXT,
  owner TEXT,
  notes TEXT,
  resources TEXT,
  meeting_id INTEGER REFERENCES meetings(id),
  project_id INTEGER REFERENCES projects(id),
  organization TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task_decisions (
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  decision_id INTEGER REFERENCES decisions(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, decision_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('task', 'project', 'rock', 'meeting', 'decision')),
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_energy_type ON tasks(energy_type);
CREATE INDEX IF NOT EXISTS idx_tasks_person ON tasks(person);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_decisions_date ON decisions(date);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
