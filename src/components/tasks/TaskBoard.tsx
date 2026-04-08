"use client";

import { useState, useCallback, useEffect } from "react";
import type { Task, TaskStatus, EnergyType } from "@/lib/types";
import { TASK_STATUS_ORDER } from "@/lib/types";
import { useConfig } from "@/lib/useConfig";
import Badge from "@/components/ui/Badge";
import EnergyDot from "@/components/ui/EnergyDot";
import TaskDrawer from "./TaskDrawer";
import Toast from "@/components/ui/Toast";
import { Plus, Eye, EyeOff, Filter, LayoutGrid, List } from "lucide-react";

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

export default function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const config = useConfig();
  const [tasks, setTasks] = useState(initialTasks);
  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterEnergy, setFilterEnergy] = useState<string>("");
  const [filterPerson, setFilterPerson] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "saved" } | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<TaskStatus | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const filteredTasks = tasks.filter((t) => {
    if (!showCompleted && t.status === "Completed") return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterEnergy && t.energy_type !== filterEnergy) return false;
    if (filterPerson && t.person !== filterPerson) return false;
    return true;
  });

  const columns = (showCompleted ? TASK_STATUS_ORDER : TASK_STATUS_ORDER.filter((s) => s !== "Completed")).map(
    (status) => ({ status, tasks: filteredTasks.filter((t) => t.status === status) })
  );

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
        body: JSON.stringify({ task_title: title, status }),
      });
      if (!res.ok) throw new Error();
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setToast({ message: "Created", type: "saved" });
    } catch {
      setToast({ message: "Failed", type: "error" });
    }
  }, [quickAddTitle]);

  const handleDelete = useCallback(async (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
    try { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); } catch { /* ok */ }
  }, []);

  // Shared task card renderer
  const TaskCard = ({ task }: { task: Task }) => (
    <div
      onClick={() => setSelectedTask(task)}
      className="bg-surface-1 rounded-lg border border-surface-3/50 p-2.5 cursor-pointer hover:border-surface-3 hover:shadow-sm group"
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[13px] font-medium text-text-primary leading-snug group-hover:text-mc-accent">
          {task.task_title}
        </p>
        <Badge status={task.status} size="sm" onClick={(e) => { e.stopPropagation(); cycleStatus(task.id, task.status); }} />
      </div>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <EnergyDot type={task.energy_type as EnergyType} showLabel />
        {task.due_date && (
          <span className={`text-[10px] font-ui ${isOverdue(task.due_date) ? "text-red-500 font-medium" : "text-text-tertiary"}`}>
            {formatDate(task.due_date)}
          </span>
        )}
        {!task.due_date && task.status !== "Maybe" && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-amber-600 bg-amber-50">No date</span>
        )}
        {task.person && task.person !== config.owner && (
          <span className="text-[10px] font-ui text-text-tertiary">{task.person}</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-text-tertiary" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-[11px] font-ui border border-surface-3/60 rounded-lg px-2 py-1 bg-surface-1 text-text-secondary">
          <option value="">All categories</option>
          {config.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterEnergy} onChange={(e) => setFilterEnergy(e.target.value)} className="text-[11px] font-ui border border-surface-3/60 rounded-lg px-2 py-1 bg-surface-1 text-text-secondary">
          <option value="">All energy</option>
          {config.energyTypes.map((e) => <option key={e.name} value={e.name}>{e.name}</option>)}
        </select>
        <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className="text-[11px] font-ui border border-surface-3/60 rounded-lg px-2 py-1 bg-surface-1 text-text-secondary">
          <option value="">All people</option>
          {config.people.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-1 text-[11px] font-ui text-text-tertiary hover:text-text-secondary">
            {showCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showCompleted ? "Hide done" : "Show done"}
          </button>
          <div className="flex items-center bg-surface-2/50 rounded-lg p-0.5 border border-surface-3/40">
            <button onClick={() => setViewMode("kanban")} className={`p-1 rounded-md ${viewMode === "kanban" ? "bg-surface-1 shadow-sm text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1 rounded-md ${viewMode === "list" ? "bg-surface-1 shadow-sm text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Kanban View ── */}
      {viewMode === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
          {columns.map(({ status, tasks: colTasks }) => (
            <div key={status} className="flex flex-col w-60 shrink-0 bg-surface-2/30 rounded-xl border border-surface-3/30">
              <div className="flex items-center justify-between px-3 py-2 border-b border-surface-3/30">
                <div className="flex items-center gap-1.5">
                  <Badge status={status} size="sm" />
                  <span className="text-[10px] font-ui text-text-tertiary">{colTasks.length}</span>
                </div>
                <button onClick={() => setQuickAddColumn(quickAddColumn === status ? null : status)} className="p-0.5 rounded hover:bg-surface-3/50 text-text-tertiary hover:text-text-secondary">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 min-h-[180px]">
                {quickAddColumn === status && (
                  <div className="bg-surface-1 rounded-lg border border-mc-accent/30 p-2">
                    <input
                      autoFocus
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(status); if (e.key === "Escape") { setQuickAddColumn(null); setQuickAddTitle(""); } }}
                      onBlur={() => { if (quickAddTitle.trim()) handleQuickAdd(status); else { setQuickAddColumn(null); setQuickAddTitle(""); } }}
                      placeholder="Task title..."
                      className="w-full text-[13px] font-ui border-0 outline-none bg-transparent placeholder:text-text-muted text-text-primary"
                    />
                  </div>
                )}
                {colTasks.map((task) => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <div className="bg-surface-1 rounded-xl border border-surface-3/50 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_90px_80px_80px_70px_70px] gap-2 px-3 py-2 border-b border-surface-3/40 text-[10px] font-ui font-semibold text-text-tertiary uppercase tracking-wider">
            <span>Task</span>
            <span>Status</span>
            <span>Due</span>
            <span>Energy</span>
            <span>Priority</span>
            <span>Person</span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-surface-3/30">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="grid grid-cols-[1fr_90px_80px_80px_70px_70px] gap-2 px-3 py-2 cursor-pointer hover:bg-surface-2/30 items-center group"
              >
                <span className="text-[13px] text-text-primary truncate group-hover:text-mc-accent">{task.task_title}</span>
                <Badge status={task.status} size="sm" onClick={(e) => { e.stopPropagation(); cycleStatus(task.id, task.status); }} />
                <span className={`text-[11px] font-ui ${task.due_date && isOverdue(task.due_date) ? "text-red-500" : "text-text-tertiary"}`}>
                  {formatDate(task.due_date) || "—"}
                </span>
                <EnergyDot type={task.energy_type as EnergyType} showLabel />
                <Badge status={task.priority} size="sm" />
                <span className="text-[11px] font-ui text-text-tertiary truncate">{task.person || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleTaskUpdate} onDelete={handleDelete} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
