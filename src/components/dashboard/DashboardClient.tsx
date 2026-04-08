"use client";

import { useState, useCallback, useEffect } from "react";
import type { Task, TaskStatus, EnergyType } from "@/lib/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EnergyDot from "@/components/ui/EnergyDot";
import TaskDrawer from "@/components/tasks/TaskDrawer";
import Toast from "@/components/ui/Toast";

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(d: string | null) {
  if (!d) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  Maybe: "Backlog",
  Backlog: "To Do",
  "To Do": "Top 3",
  "Top 3": "In Progress",
  "In Progress": "Completed",
  Completed: "To Do",
};

export default function DashboardClient({
  top3: initialTop3,
  overdue: initialOverdue,
}: {
  top3: Task[];
  overdue: Task[];
}) {
  const [top3, setTop3] = useState(initialTop3);
  useEffect(() => { setTop3(initialTop3); }, [initialTop3]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "saved" } | null>(null);

  const cycleStatus = useCallback(async (taskId: number, currentStatus: TaskStatus) => {
    const newStatus = NEXT_STATUS[currentStatus];
    setTop3((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setToast({ message: `${newStatus}`, type: "saved" });
    } catch {
      setTop3((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t)));
      setToast({ message: "Failed to update", type: "error" });
    }
  }, []);

  const handleTaskUpdate = useCallback(async (id: number, updates: Partial<Task>) => {
    setTop3((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
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
      setToast({ message: "Failed to save", type: "error" });
    }
  }, [selectedTask]);

  const handleDelete = useCallback(async (id: number) => {
    setTop3((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch { /* silent */ }
  }, []);

  return (
    <>
      <Card title="Top 3">
        {top3.length === 0 ? (
          <p className="text-sm text-text-tertiary font-ui italic">
            No Top 3 set — time for the Monday ritual?
          </p>
        ) : (
          <div className="space-y-2">
            {top3.map((task, i) => {
              const days = daysUntil(task.due_date);
              const isOverdue = days !== null && days < 0;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-surface-2/50 group"
                >
                  <span className="w-5 h-5 rounded-full bg-mc-accent/10 text-mc-accent text-[10px] font-ui font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-text-primary group-hover:text-mc-accent truncate block">
                      {task.task_title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <EnergyDot type={task.energy_type as EnergyType} showLabel />
                      {task.due_date && (
                        <span className={`text-[10px] font-ui ${isOverdue ? "text-red-500 font-medium" : "text-text-tertiary"}`}>
                          {isOverdue ? `${Math.abs(days!)}d overdue` : formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    status={task.status}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleStatus(task.id, task.status);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleDelete}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
