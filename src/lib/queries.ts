import { getDb } from "./db";
import { getConfig } from "./config";
import type { Task, Project, Rock, Meeting, Decision, ActivityLog, TaskStatus } from "./types";

// ── Tasks ──────────────────────────────────────────────

export function getTop3Tasks(): Task[] {
  return getDb().prepare(`
    SELECT t.*, p.project_name, m.meeting_title FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN meetings m ON t.meeting_id = m.id
    WHERE t.status = 'Top 3'
    ORDER BY t.priority = 'High' DESC, t.due_date ASC
  `).all() as Task[];
}

export function getOverdueTasks(): Task[] {
  return getDb().prepare(`
    SELECT t.*, p.project_name, m.meeting_title FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN meetings m ON t.meeting_id = m.id
    WHERE t.due_date < date('now') AND t.status != 'Completed'
    ORDER BY t.due_date ASC
  `).all() as Task[];
}

export function getTasksDueThisWeek(): Task[] {
  return getDb().prepare(`
    SELECT t.*, p.project_name, m.meeting_title FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN meetings m ON t.meeting_id = m.id
    WHERE t.due_date BETWEEN date('now') AND date('now', '+7 days')
      AND t.status != 'Completed'
    ORDER BY t.due_date ASC
  `).all() as Task[];
}

export function getAllTasks(includeCompleted = false): Task[] {
  const where = includeCompleted ? "" : "WHERE t.status != 'Completed'";
  return getDb().prepare(`
    SELECT t.*, p.project_name, m.meeting_title FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN meetings m ON t.meeting_id = m.id
    ${where}
    ORDER BY
      CASE t.status
        WHEN 'Top 3' THEN 1
        WHEN 'In Progress' THEN 2
        WHEN 'To Do' THEN 3
        WHEN 'Backlog' THEN 4
        WHEN 'Maybe' THEN 5
        WHEN 'Completed' THEN 6
      END,
      t.priority = 'High' DESC,
      t.due_date ASC NULLS LAST
  `).all() as Task[];
}

export function getTasksByStatus(status: TaskStatus): Task[] {
  return getDb().prepare(`
    SELECT t.*, p.project_name, m.meeting_title FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN meetings m ON t.meeting_id = m.id
    WHERE t.status = ?
    ORDER BY t.priority = 'High' DESC, t.due_date ASC NULLS LAST
  `).all(status) as Task[];
}

export function getTaskById(id: number): Task | undefined {
  return getDb().prepare(`
    SELECT t.*, p.project_name, m.meeting_title FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN meetings m ON t.meeting_id = m.id
    WHERE t.id = ?
  `).get(id) as Task | undefined;
}

export function getTasksByProject(projectId: number): Task[] {
  return getDb().prepare(`
    SELECT t.*, p.project_name, m.meeting_title FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN meetings m ON t.meeting_id = m.id
    WHERE t.project_id = ?
    ORDER BY
      CASE t.status WHEN 'Top 3' THEN 1 WHEN 'In Progress' THEN 2 WHEN 'To Do' THEN 3 WHEN 'Backlog' THEN 4 WHEN 'Maybe' THEN 5 WHEN 'Completed' THEN 6 END,
      t.due_date ASC NULLS LAST
  `).all(projectId) as Task[];
}

export function getTasksByMeeting(meetingId: number): Task[] {
  return getDb().prepare(`
    SELECT t.*, p.project_name, m.meeting_title FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN meetings m ON t.meeting_id = m.id
    WHERE t.meeting_id = ?
    ORDER BY t.status, t.due_date ASC NULLS LAST
  `).all(meetingId) as Task[];
}

export function createTask(task: Partial<Task>): number {
  const config = getConfig();
  const result = getDb().prepare(`
    INSERT INTO tasks (task_title, task_description, due_date, priority, status, notes, project_id, category, energy_type, person, organization, resources)
    VALUES (@task_title, @task_description, @due_date, @priority, @status, @notes, @project_id, @category, @energy_type, @person, @organization, @resources)
  `).run({
    task_title: task.task_title,
    task_description: task.task_description || null,
    due_date: task.due_date || null,
    priority: task.priority || "Medium",
    status: task.status || "To Do",
    notes: task.notes || null,
    project_id: task.project_id || null,
    category: task.category || null,
    energy_type: task.energy_type || null,
    person: task.person || null,
    organization: task.organization || config.defaultOrganization,
    resources: task.resources || null,
  });
  logActivity("task", Number(result.lastInsertRowid), "created", task.task_title || "");
  return Number(result.lastInsertRowid);
}

export function updateTask(id: number, updates: Partial<Task>): void {
  const fields = Object.entries(updates)
    .filter(([k]) => k !== "id" && k !== "created_at" && k !== "project_name" && k !== "meeting_title")
    .map(([k]) => `${k} = @${k}`);
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");

  const params = { ...updates, id };
  getDb().prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = @id`).run(params);

  if (updates.status) {
    logActivity("task", id, "status_changed", `→ ${updates.status}`);
  } else {
    const changed = Object.keys(updates).filter((k) => k !== "id" && k !== "project_name" && k !== "meeting_title");
    logActivity("task", id, "updated", changed.join(", "));
  }
}

export function deleteTask(id: number): void {
  logActivity("task", id, "deleted", "");
  getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id);
}

// ── Projects ───────────────────────────────────────────

export function getAllProjects(): Project[] {
  return getDb().prepare(`
    SELECT p.*, r.rock_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'Completed') as completed_task_count
    FROM projects p
    LEFT JOIN rocks r ON p.rock_id = r.id
    ORDER BY p.status = 'In Progress' DESC, p.priority = 'High' DESC, p.due_date ASC NULLS LAST
  `).all() as Project[];
}

export function getProjectById(id: number): Project | undefined {
  return getDb().prepare(`
    SELECT p.*, r.rock_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'Completed') as completed_task_count
    FROM projects p
    LEFT JOIN rocks r ON p.rock_id = r.id
    WHERE p.id = ?
  `).get(id) as Project | undefined;
}

export function createProject(project: Partial<Project>): number {
  const result = getDb().prepare(`
    INSERT INTO projects (project_name, rock_id, status, due_date, priority, category, energy_type, person, tier, notes, resources)
    VALUES (@project_name, @rock_id, @status, @due_date, @priority, @category, @energy_type, @person, @tier, @notes, @resources)
  `).run({
    project_name: project.project_name,
    rock_id: project.rock_id || null,
    status: project.status || "Not Started",
    due_date: project.due_date || null,
    priority: project.priority || "Medium",
    category: project.category || null,
    energy_type: project.energy_type || null,
    person: project.person || null,
    tier: project.tier || "L2",
    notes: project.notes || null,
    resources: project.resources || null,
  });
  logActivity("project", Number(result.lastInsertRowid), "created", project.project_name || "");
  return Number(result.lastInsertRowid);
}

export function updateProject(id: number, updates: Partial<Project>): void {
  const fields = Object.entries(updates)
    .filter(([k]) => !["id", "created_at", "rock_name", "task_count", "completed_task_count"].includes(k))
    .map(([k]) => `${k} = @${k}`);
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  getDb().prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = @id`).run({ ...updates, id });
  const changed = Object.keys(updates).filter((k) => !["id", "rock_name", "task_count", "completed_task_count"].includes(k));
  logActivity("project", id, "updated", changed.join(", "));
}

export function deleteProject(id: number): void {
  logActivity("project", id, "deleted", "");
  const db = getDb();
  db.prepare("UPDATE tasks SET project_id = NULL WHERE project_id = ?").run(id);
  db.prepare("UPDATE decisions SET project_id = NULL WHERE project_id = ?").run(id);
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

// ── Rocks ──────────────────────────────────────────────

export function getAllRocks(): Rock[] {
  return getDb().prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM projects p WHERE p.rock_id = r.id) as project_count
    FROM rocks r
    ORDER BY r.quarter DESC, r.status = 'In Progress' DESC
  `).all() as Rock[];
}

export function getRockById(id: number): Rock | undefined {
  return getDb().prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM projects p WHERE p.rock_id = r.id) as project_count
    FROM rocks r
    WHERE r.id = ?
  `).get(id) as Rock | undefined;
}

export function getProjectsByRock(rockId: number): Project[] {
  return getDb().prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'Completed') as completed_task_count
    FROM projects p
    WHERE p.rock_id = ?
    ORDER BY p.status = 'In Progress' DESC, p.priority = 'High' DESC
  `).all(rockId) as Project[];
}

export function createRock(rock: Partial<Rock>): number {
  const config = getConfig();
  const result = getDb().prepare(`
    INSERT INTO rocks (rock_name, quarter, status, due_date, category, owner, notes, resources)
    VALUES (@rock_name, @quarter, @status, @due_date, @category, @owner, @notes, @resources)
  `).run({
    rock_name: rock.rock_name,
    quarter: rock.quarter || null,
    status: rock.status || "Not Started",
    due_date: rock.due_date || null,
    category: rock.category || null,
    owner: rock.owner || config.owner,
    notes: rock.notes || null,
    resources: rock.resources || null,
  });
  logActivity("rock", Number(result.lastInsertRowid), "created", rock.rock_name || "");
  return Number(result.lastInsertRowid);
}

export function updateRock(id: number, updates: Partial<Rock>): void {
  const fields = Object.entries(updates)
    .filter(([k]) => k !== "id" && k !== "created_at" && k !== "project_count")
    .map(([k]) => `${k} = @${k}`);
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  getDb().prepare(`UPDATE rocks SET ${fields.join(", ")} WHERE id = @id`).run({ ...updates, id });
  const changed = Object.keys(updates).filter((k) => !["id", "project_count"].includes(k));
  logActivity("rock", id, "updated", changed.join(", "));
}

export function deleteRock(id: number): void {
  logActivity("rock", id, "deleted", "");
  const db = getDb();
  db.prepare("UPDATE projects SET rock_id = NULL WHERE rock_id = ?").run(id);
  db.prepare("DELETE FROM rocks WHERE id = ?").run(id);
}

// ── Meetings ───────────────────────────────────────────

export function getAllMeetings(): Meeting[] {
  return getDb().prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM tasks t WHERE t.meeting_id = m.id) as task_count,
      (SELECT COUNT(*) FROM decisions d WHERE d.meeting_id = m.id) as decision_count
    FROM meetings m ORDER BY date DESC NULLS LAST
  `).all() as Meeting[];
}

export function getMeetingById(id: number): Meeting | undefined {
  return getDb().prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM tasks t WHERE t.meeting_id = m.id) as task_count,
      (SELECT COUNT(*) FROM decisions d WHERE d.meeting_id = m.id) as decision_count
    FROM meetings m WHERE m.id = ?
  `).get(id) as Meeting | undefined;
}

export function getUpcomingMeetings(): Meeting[] {
  return getDb().prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM tasks t WHERE t.meeting_id = m.id) as task_count,
      (SELECT COUNT(*) FROM decisions d WHERE d.meeting_id = m.id) as decision_count
    FROM meetings m
    WHERE date >= date('now') AND date <= date('now', '+7 days')
    ORDER BY date ASC
  `).all() as Meeting[];
}

// ── Decisions ──────────────────────────────────────────

export function getAllDecisions(): Decision[] {
  return getDb().prepare(`
    SELECT d.*, m.meeting_title
    FROM decisions d
    LEFT JOIN meetings m ON d.meeting_id = m.id
    ORDER BY d.date DESC NULLS LAST
  `).all() as Decision[];
}

export function getDecisionById(id: number): Decision | undefined {
  return getDb().prepare(`
    SELECT d.*, m.meeting_title
    FROM decisions d
    LEFT JOIN meetings m ON d.meeting_id = m.id
    WHERE d.id = ?
  `).get(id) as Decision | undefined;
}

export function getDecisionsByMeeting(meetingId: number): Decision[] {
  return getDb().prepare(`
    SELECT d.*, m.meeting_title
    FROM decisions d
    LEFT JOIN meetings m ON d.meeting_id = m.id
    WHERE d.meeting_id = ?
    ORDER BY d.date DESC
  `).all(meetingId) as Decision[];
}

export function createDecision(decision: Partial<Decision>): number {
  const config = getConfig();
  const result = getDb().prepare(`
    INSERT INTO decisions (decision_title, date, context, decision, rationale, impact, status, category, owner, notes, resources, meeting_id, project_id, organization)
    VALUES (@decision_title, @date, @context, @decision, @rationale, @impact, @status, @category, @owner, @notes, @resources, @meeting_id, @project_id, @organization)
  `).run({
    decision_title: decision.decision_title,
    date: decision.date || null,
    context: decision.context || null,
    decision: decision.decision || null,
    rationale: decision.rationale || null,
    impact: decision.impact || null,
    status: decision.status || "Active",
    category: decision.category || null,
    owner: decision.owner || null,
    notes: decision.notes || null,
    resources: decision.resources || null,
    meeting_id: decision.meeting_id || null,
    project_id: decision.project_id || null,
    organization: decision.organization || config.defaultOrganization,
  });
  logActivity("decision", Number(result.lastInsertRowid), "created", decision.decision_title || "");
  return Number(result.lastInsertRowid);
}

export function updateDecision(id: number, updates: Partial<Decision>): void {
  const fields = Object.entries(updates)
    .filter(([k]) => k !== "id" && k !== "created_at" && k !== "meeting_title")
    .map(([k]) => `${k} = @${k}`);
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  getDb().prepare(`UPDATE decisions SET ${fields.join(", ")} WHERE id = @id`).run({ ...updates, id });
  const changed = Object.keys(updates).filter((k) => !["id", "meeting_title"].includes(k));
  logActivity("decision", id, "updated", changed.join(", "));
}

export function deleteDecision(id: number): void {
  logActivity("decision", id, "deleted", "");
  const db = getDb();
  db.prepare("DELETE FROM task_decisions WHERE decision_id = ?").run(id);
  db.prepare("DELETE FROM decisions WHERE id = ?").run(id);
}

export function createMeeting(meeting: Partial<Meeting>): number {
  const config = getConfig();
  const result = getDb().prepare(`
    INSERT INTO meetings (meeting_title, date, meeting_type, attendees, duration, summary, key_topics, status, category, source_file, recording, notes, resources, organization)
    VALUES (@meeting_title, @date, @meeting_type, @attendees, @duration, @summary, @key_topics, @status, @category, @source_file, @recording, @notes, @resources, @organization)
  `).run({
    meeting_title: meeting.meeting_title,
    date: meeting.date || null,
    meeting_type: meeting.meeting_type || null,
    attendees: meeting.attendees || null,
    duration: meeting.duration || null,
    summary: meeting.summary || null,
    key_topics: meeting.key_topics || null,
    status: meeting.status || "Unprocessed",
    category: meeting.category || null,
    source_file: meeting.source_file || null,
    recording: meeting.recording || null,
    notes: meeting.notes || null,
    resources: meeting.resources || null,
    organization: meeting.organization || config.defaultOrganization,
  });
  logActivity("meeting", Number(result.lastInsertRowid), "created", meeting.meeting_title || "");
  return Number(result.lastInsertRowid);
}

export function updateMeeting(id: number, updates: Partial<Meeting>): void {
  const fields = Object.entries(updates)
    .filter(([k]) => k !== "id" && k !== "created_at" && k !== "task_count" && k !== "decision_count")
    .map(([k]) => `${k} = @${k}`);
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  getDb().prepare(`UPDATE meetings SET ${fields.join(", ")} WHERE id = @id`).run({ ...updates, id });
  const changed = Object.keys(updates).filter((k) => !["id", "task_count", "decision_count"].includes(k));
  logActivity("meeting", id, "updated", changed.join(", "));
}

export function deleteMeeting(id: number): void {
  logActivity("meeting", id, "deleted", "");
  const db = getDb();
  db.prepare("UPDATE tasks SET meeting_id = NULL WHERE meeting_id = ?").run(id);
  db.prepare("UPDATE decisions SET meeting_id = NULL WHERE meeting_id = ?").run(id);
  db.prepare("DELETE FROM meetings WHERE id = ?").run(id);
}

// ── Search ─────────────────────────────────────────────

export interface SearchResult {
  type: "task" | "project" | "rock" | "meeting" | "decision";
  id: number;
  title: string;
  subtitle: string;
  status: string;
}

export function searchAll(query: string): SearchResult[] {
  const q = `%${query}%`;
  const db = getDb();
  const results: SearchResult[] = [];

  const tasks = db.prepare(`
    SELECT id, task_title as title, status, category FROM tasks
    WHERE task_title LIKE ? OR notes LIKE ? OR task_description LIKE ?
    LIMIT 8
  `).all(q, q, q) as Array<{ id: number; title: string; status: string; category: string | null }>;
  tasks.forEach((t) => results.push({ type: "task", id: t.id, title: t.title, subtitle: [t.status, t.category].filter(Boolean).join(" · "), status: t.status }));

  const projects = db.prepare(`
    SELECT id, project_name as title, status, category FROM projects
    WHERE project_name LIKE ? OR notes LIKE ?
    LIMIT 5
  `).all(q, q) as Array<{ id: number; title: string; status: string; category: string | null }>;
  projects.forEach((p) => results.push({ type: "project", id: p.id, title: p.title, subtitle: [p.status, p.category].filter(Boolean).join(" · "), status: p.status }));

  const rocks = db.prepare(`
    SELECT id, rock_name as title, status, quarter FROM rocks
    WHERE rock_name LIKE ? OR notes LIKE ?
    LIMIT 3
  `).all(q, q) as Array<{ id: number; title: string; status: string; quarter: string | null }>;
  rocks.forEach((r) => results.push({ type: "rock", id: r.id, title: r.title, subtitle: [r.status, r.quarter].filter(Boolean).join(" · "), status: r.status }));

  const meetings = db.prepare(`
    SELECT id, meeting_title as title, status, date FROM meetings
    WHERE meeting_title LIKE ? OR summary LIKE ? OR key_topics LIKE ?
    LIMIT 5
  `).all(q, q, q) as Array<{ id: number; title: string; status: string; date: string | null }>;
  meetings.forEach((m) => results.push({ type: "meeting", id: m.id, title: m.title, subtitle: [m.status, m.date].filter(Boolean).join(" · "), status: m.status }));

  const decisions = db.prepare(`
    SELECT id, decision_title as title, status, date FROM decisions
    WHERE decision_title LIKE ? OR decision LIKE ? OR context LIKE ?
    LIMIT 5
  `).all(q, q, q) as Array<{ id: number; title: string; status: string; date: string | null }>;
  decisions.forEach((d) => results.push({ type: "decision", id: d.id, title: d.title, subtitle: [d.status, d.date].filter(Boolean).join(" · "), status: d.status }));

  return results;
}

// ── Activity Log ───────────────────────────────────────

export function getRecentActivity(limit = 10): ActivityLog[] {
  return getDb().prepare(`
    SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?
  `).all(limit) as ActivityLog[];
}

function logActivity(entityType: string, entityId: number, action: string, details: string) {
  getDb().prepare(`
    INSERT INTO activity_log (entity_type, entity_id, action, details)
    VALUES (?, ?, ?, ?)
  `).run(entityType, entityId, action, details);
}

// ── Dashboard Stats ────────────────────────────────────

export function getDashboardStats() {
  const db = getDb();
  const config = getConfig();

  const overdue = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date < date('now') AND status != 'Completed'").get() as { count: number };
  const noDueDate = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date IS NULL AND status NOT IN ('Completed', 'Maybe')").get() as { count: number };
  const totalActive = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('Completed', 'Maybe')").get() as { count: number };

  const energyCounts: Record<string, number> = {};
  for (const et of config.energyTypes) {
    const row = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE energy_type = ? AND status NOT IN ('Completed', 'Maybe')").get(et.name) as { count: number };
    energyCounts[et.name] = row.count;
  }

  return {
    overdue: overdue.count,
    noDueDate: noDueDate.count,
    totalActive: totalActive.count,
    energyCounts,
  };
}
