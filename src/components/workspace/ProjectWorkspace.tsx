"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Task, Project, TaskStatus, EnergyType, ProjectTier } from "@/lib/types";
import { TASK_STATUS_ORDER } from "@/lib/types";
import { useConfig } from "@/lib/useConfig";
import Badge from "@/components/ui/Badge";
import EnergyDot from "@/components/ui/EnergyDot";
import TierBadge from "@/components/ui/TierBadge";
import TaskDrawer from "@/components/tasks/TaskDrawer";
import Toast from "@/components/ui/Toast";
import {
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  FolderKanban,
  Target,
  ArrowLeft,
} from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d + "T00:00:00") < new Date(new Date().toDateString());
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  Maybe: "Backlog",
  Backlog: "To Do",
  "To Do": "Top 3",
  "Top 3": "In Progress",
  "In Progress": "Completed",
  Completed: "To Do",
};

export default function ProjectWorkspace({
  project,
  initialTasks,
  allProjects,
}: {
  project: Project;
  initialTasks: Task[];
  allProjects: Project[];
}) {
  const router = useRouter();
  const config = useConfig();
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "saved" } | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<TaskStatus | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (!showCompleted && t.status === "Completed") return false;
    return true;
  });

  const statuses = showCompleted
    ? TASK_STATUS_ORDER
    : TASK_STATUS_ORDER.filter((s) => s !== "Completed");

  const columns = statuses.map((status) => ({
    status,
    tasks: filteredTasks.filter((t) => t.status === status),
  }));

  const cycleStatus = useCallback(async (taskId: number, currentStatus: TaskStatus) => {
    const newStatus = NEXT_STATUS[currentStatus];
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setToast({ message: newStatus, type: "saved" });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t)));
      setToast({ message: "Failed", type: "error" });
    }
  }, []);

  const handleTaskUpdate = useCallback(async (id: number, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    if (selectedTask?.id === id) setSelectedTask((prev) => prev ? { ...prev, ...updates } : null);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      setToast({ message: "Saved", type: "saved" });
    } catch {
      setToast({ message: "Failed", type: "error" });
    }
  }, [selectedTask]);

  const handleQuickAdd = useCallback(async (status: TaskStatus) => {
    if (!quickAddTitle.trim()) return;
    const title = quickAddTitle.trim();
    setQuickAddTitle("");
    setQuickAddColumn(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_title: title,
          status,
          project_id: project.id,
          category: project.category,
          energy_type: project.energy_type,
        }),
      });
      if (!res.ok) throw new Error();
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setToast({ message: "Added to project", type: "saved" });
    } catch {
      setToast({ message: "Failed", type: "error" });
    }
  }, [quickAddTitle, project]);

  const handleDelete = useCallback(async (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
    try { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); } catch { /* ok */ }
  }, []);

  return (
    <div className="space-y-4">
      {/* Project header */}
      <div>
        {/* Back + Switcher */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1 text-xs font-ui text-text-tertiary hover:text-text-secondary"
          >
            <ArrowLeft className="w-3 h-3" />
            Projects
          </button>
          <span className="text-text-muted">/</span>
          <div className="relative">
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="flex items-center gap-1.5 text-xs font-ui text-text-secondary hover:text-text-primary"
            >
              <FolderKanban className="w-3 h-3" />
              {project.project_name}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showSwitcher && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSwitcher(false)} />
                <div className="absolute top-full left-0 mt-1 w-64 bg-surface-1 border border-surface-3/60 rounded-lg shadow-lg z-20 py-1 animate-scale-in">
                  {allProjects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setShowSwitcher(false);
                        router.push(`/projects/${p.id}`);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-ui hover:bg-surface-2/50 flex items-center gap-2 ${
                        p.id === project.id ? "text-mc-accent font-medium" : "text-text-secondary"
                      }`}
                    >
                      <TierBadge tier={(p.tier || "L2") as ProjectTier} />
                      <span className="truncate">{p.project_name}</span>
                      <Badge status={p.status} size="sm" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Project info bar */}
        <div className="bg-surface-1 rounded-xl border border-surface-3/50 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-heading font-bold text-text-primary">{project.project_name}</h2>
              <TierBadge tier={project.tier as ProjectTier} showLabel isRock={!!project.rock_id} />
              <Badge status={project.status} />
            </div>
            <div className="flex items-center gap-3 text-xs font-ui text-text-tertiary">
              <EnergyDot type={project.energy_type as EnergyType} showLabel />
              {project.due_date && <span>Due {formatDate(project.due_date)}</span>}
              {project.person && <span>{project.person}</span>}
              {project.rock_name && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-surface-2/50 rounded text-[10px]">
                  <Target className="w-2.5 h-2.5" />
                  {project.rock_name}
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-ui text-text-tertiary">
              {completedTasks}/{totalTasks} tasks · {pct}%
            </span>
          </div>

          {project.notes && (
            <p className="text-xs text-text-tertiary mt-3 pt-3 border-t border-surface-3/30">
              {project.notes}
            </p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-ui font-semibold tracking-[0.15em] text-text-tertiary/60 uppercase">
          Project Board
        </span>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-1 text-[11px] font-ui text-text-tertiary hover:text-text-secondary"
        >
          {showCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showCompleted ? "Hide done" : `Show done (${completedTasks})`}
        </button>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
        {columns.map(({ status, tasks: colTasks }) => (
          <div key={status} className="flex flex-col w-60 shrink-0 bg-surface-2/30 rounded-xl border border-surface-3/30">
            <div className="flex items-center justify-between px-3 py-2 border-b border-surface-3/30">
              <div className="flex items-center gap-1.5">
                <Badge status={status} size="sm" />
                <span className="text-[10px] font-ui text-text-tertiary">{colTasks.length}</span>
              </div>
              <button
                onClick={() => setQuickAddColumn(quickAddColumn === status ? null : status)}
                className="p-0.5 rounded hover:bg-surface-3/50 text-text-tertiary hover:text-text-secondary"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 min-h-[150px]">
              {quickAddColumn === status && (
                <div className="bg-surface-1 rounded-lg border border-mc-accent/30 p-2">
                  <input
                    autoFocus
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleQuickAdd(status);
                      if (e.key === "Escape") { setQuickAddColumn(null); setQuickAddTitle(""); }
                    }}
                    onBlur={() => {
                      if (quickAddTitle.trim()) handleQuickAdd(status);
                      else { setQuickAddColumn(null); setQuickAddTitle(""); }
                    }}
                    placeholder="Task title..."
                    className="w-full text-[13px] font-ui border-0 outline-none bg-transparent placeholder:text-text-muted text-text-primary"
                  />
                </div>
              )}
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-surface-1 rounded-lg border border-surface-3/50 p-2.5 cursor-pointer hover:border-surface-3 hover:shadow-sm group"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="text-[13px] font-medium text-text-primary leading-snug group-hover:text-mc-accent">
                      {task.task_title}
                    </p>
                    <Badge
                      status={task.status}
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); cycleStatus(task.id, task.status); }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <EnergyDot type={task.energy_type as EnergyType} showLabel />
                    {task.due_date && (
                      <span className={`text-[10px] font-ui ${isOverdue(task.due_date) ? "text-red-500 font-medium" : "text-text-tertiary"}`}>
                        {formatDate(task.due_date)}
                      </span>
                    )}
                    {task.person && task.person !== config.owner && (
                      <span className="text-[10px] font-ui text-text-tertiary">{task.person}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleDelete}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
