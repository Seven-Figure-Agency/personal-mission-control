"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus, EnergyType, Category, Person, Priority, Organization, Project } from "@/lib/types";
import { TASK_STATUS_ORDER } from "@/lib/types";
import { useConfig } from "@/lib/useConfig";
import SideDrawer from "@/components/ui/SideDrawer";
import Badge from "@/components/ui/Badge";
import DrawerField, { inputClass, selectClass } from "@/components/ui/DrawerField";
import { Trash2, FileText } from "lucide-react";

export default function TaskDrawer({
  task,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Task>) => void;
  onDelete: (id: number) => void;
}) {
  const config = useConfig();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  return (
    <SideDrawer
      isOpen
      onClose={onClose}
      title={task.task_title}
      subtitle={[task.category, task.project_name].filter(Boolean).join(" · ") || undefined}
      badge={<Badge status={task.status} size="sm" />}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-ui">Delete this task?</span>
              <button
                onClick={() => onDelete(task.id)}
                className="px-2.5 py-1 bg-red-600 text-white text-xs font-ui rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1 bg-surface-2 text-text-secondary text-xs font-ui rounded-lg hover:bg-surface-3"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-ui text-text-tertiary hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <DrawerField label="Title">
          <input
            type="text"
            defaultValue={task.task_title}
            onBlur={(e) => {
              if (e.target.value !== task.task_title)
                onUpdate(task.id, { task_title: e.target.value });
            }}
            className={inputClass}
          />
        </DrawerField>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Status">
            <select
              value={task.status}
              onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
              className={selectClass}
            >
              {TASK_STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </DrawerField>
          <DrawerField label="Priority">
            <select
              value={task.priority}
              onChange={(e) => onUpdate(task.id, { priority: e.target.value as Priority })}
              className={selectClass}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </DrawerField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Due Date">
            <input
              type="date"
              value={task.due_date || ""}
              onChange={(e) => onUpdate(task.id, { due_date: e.target.value || null })}
              className={inputClass}
            />
          </DrawerField>
          <DrawerField label="Energy">
            <select
              value={task.energy_type || ""}
              onChange={(e) => onUpdate(task.id, { energy_type: (e.target.value || null) as EnergyType | null })}
              className={selectClass}
            >
              <option value="">—</option>
              {config.energyTypes.map((e) => <option key={e.name} value={e.name}>{e.name}</option>)}
            </select>
          </DrawerField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Category">
            <select
              value={task.category || ""}
              onChange={(e) => onUpdate(task.id, { category: (e.target.value || null) as Category | null })}
              className={selectClass}
            >
              <option value="">—</option>
              {config.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </DrawerField>
          <DrawerField label="Person">
            <select
              value={task.person || ""}
              onChange={(e) => onUpdate(task.id, { person: (e.target.value || null) as Person | null })}
              className={selectClass}
            >
              <option value="">—</option>
              {config.people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </DrawerField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Project">
            <select
              value={task.project_id || ""}
              onChange={(e) => onUpdate(task.id, { project_id: e.target.value ? Number(e.target.value) : null })}
              className={selectClass}
            >
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
          </DrawerField>
          <DrawerField label="Organization">
            <select
              value={task.organization || config.defaultOrganization}
              onChange={(e) => onUpdate(task.id, { organization: e.target.value as Organization })}
              className={selectClass}
            >
              {config.organizations.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </DrawerField>
        </div>

        <DrawerField label="Notes">
          <textarea
            rows={4}
            defaultValue={task.notes || ""}
            onBlur={(e) => {
              if (e.target.value !== (task.notes || ""))
                onUpdate(task.id, { notes: e.target.value || null });
            }}
            placeholder="Context, meeting source, updates..."
            className={`${inputClass} resize-none`}
          />
        </DrawerField>

        <DrawerField label="Description">
          <textarea
            rows={2}
            defaultValue={task.task_description || ""}
            onBlur={(e) => {
              if (e.target.value !== (task.task_description || ""))
                onUpdate(task.id, { task_description: e.target.value || null });
            }}
            placeholder="What needs to happen..."
            className={`${inputClass} resize-none`}
          />
        </DrawerField>

        <DrawerField label="Resources">
          <input
            type="text"
            defaultValue={task.resources || ""}
            onBlur={(e) => {
              if (e.target.value !== (task.resources || ""))
                onUpdate(task.id, { resources: e.target.value || null });
            }}
            placeholder="URL or reference..."
            className={inputClass}
          />
        </DrawerField>

        {/* Meeting link - read-only */}
        {task.meeting_id && task.meeting_title && (
          <DrawerField label="Meeting">
            <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-md bg-surface-2/40 text-xs text-text-secondary">
              <FileText className="w-3 h-3 text-text-tertiary shrink-0" />
              <span className="truncate">{task.meeting_title}</span>
            </div>
          </DrawerField>
        )}

        {/* Metadata */}
        <div className="pt-3 border-t border-surface-3/40 text-[10px] font-ui text-text-tertiary space-y-0.5">
          <p>Created {new Date(task.created_at).toLocaleDateString()}</p>
          <p>Updated {new Date(task.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </SideDrawer>
  );
}
