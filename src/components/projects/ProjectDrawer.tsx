"use client";

import { useState, useEffect } from "react";
import type { Project, Task, Rock, ProjectStatus, ProjectTier, Priority, Category, EnergyType, Person } from "@/lib/types";
import { PROJECT_STATUS_ORDER, PROJECT_TIERS } from "@/lib/types";
import { useConfig } from "@/lib/useConfig";
import SideDrawer from "@/components/ui/SideDrawer";
import Badge from "@/components/ui/Badge";
import EnergyDot from "@/components/ui/EnergyDot";
import TierBadge from "@/components/ui/TierBadge";
import DrawerField, { inputClass, selectClass } from "@/components/ui/DrawerField";
import { Trash2 } from "lucide-react";

const TIER_LABELS: Record<ProjectTier, string> = {
  L1: "L1 — Major (weeks–months)",
  L2: "L2 — Sprint (under 2 weeks)",
  L3: "L3 — Quick Win (one session)",
};

export default function ProjectDrawer({
  project,
  onClose,
  onUpdate,
  onDelete,
  onCreate,
}: {
  project: Project | null;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Project>) => void;
  onDelete?: (id: number) => void;
  onCreate?: (data: Partial<Project>) => void;
}) {
  const config = useConfig();
  const isCreate = !project;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<Partial<Project>>({
    project_name: "",
    status: "Not Started",
    tier: "L2",
    priority: "Medium",
  });

  useEffect(() => {
    if (project) {
      fetch(`/api/tasks?project_id=${project.id}`)
        .then((r) => r.json())
        .then(setTasks)
        .catch(() => {});
    }
  }, [project]);

  useEffect(() => {
    fetch("/api/rocks")
      .then((r) => r.json())
      .then(setRocks)
      .catch(() => {});
  }, []);

  const handleCreate = () => {
    if (!draft.project_name?.trim()) return;
    onCreate?.(draft);
  };

  return (
    <SideDrawer
      isOpen
      onClose={onClose}
      title={isCreate ? "New Project" : project.project_name}
      subtitle={
        isCreate
          ? undefined
          : [project.rock_name, project.category].filter(Boolean).join(" · ") || undefined
      }
      badge={
        isCreate ? undefined : (
          <div className="flex items-center gap-1.5">
            <TierBadge tier={project.tier as ProjectTier} isRock={!!project.rock_id} />
            <Badge status={project.status} size="sm" />
          </div>
        )
      }
      width="lg"
      footer={
        isCreate ? (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-ui text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 bg-mc-accent text-white text-xs font-ui rounded-lg hover:bg-mc-accent/90"
            >
              Create Project
            </button>
          </div>
        ) : onDelete ? (
          <div className="flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-ui">Delete this project?</span>
                <button
                  onClick={() => onDelete(project.id)}
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
        ) : undefined
      }
    >
      <div className="space-y-4">
        <DrawerField label="Name">
          {isCreate ? (
            <input
              type="text"
              autoFocus
              value={draft.project_name || ""}
              onChange={(e) => setDraft((d) => ({ ...d, project_name: e.target.value }))}
              placeholder="Project name..."
              className={inputClass}
            />
          ) : (
            <input
              type="text"
              defaultValue={project.project_name}
              onBlur={(e) => {
                if (e.target.value !== project.project_name)
                  onUpdate(project.id, { project_name: e.target.value });
              }}
              className={inputClass}
            />
          )}
        </DrawerField>

        <div className="grid grid-cols-3 gap-3">
          <DrawerField label="Tier">
            <select
              value={isCreate ? draft.tier || "L2" : project.tier || "L2"}
              onChange={(e) => {
                const val = e.target.value as ProjectTier;
                if (isCreate) setDraft((d) => ({ ...d, tier: val }));
                else onUpdate(project.id, { tier: val });
              }}
              className={selectClass}
            >
              {PROJECT_TIERS.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
            </select>
          </DrawerField>
          <DrawerField label="Status">
            <select
              value={isCreate ? draft.status || "Not Started" : project.status}
              onChange={(e) => {
                const val = e.target.value as ProjectStatus;
                if (isCreate) setDraft((d) => ({ ...d, status: val }));
                else onUpdate(project.id, { status: val });
              }}
              className={selectClass}
            >
              {PROJECT_STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </DrawerField>
          <DrawerField label="Priority">
            <select
              value={isCreate ? draft.priority || "Medium" : project.priority}
              onChange={(e) => {
                const val = e.target.value as Priority;
                if (isCreate) setDraft((d) => ({ ...d, priority: val }));
                else onUpdate(project.id, { priority: val });
              }}
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
              value={isCreate ? draft.due_date || "" : project.due_date || ""}
              onChange={(e) => {
                const val = e.target.value || null;
                if (isCreate) setDraft((d) => ({ ...d, due_date: val }));
                else onUpdate(project.id, { due_date: val });
              }}
              className={inputClass}
            />
          </DrawerField>
          <DrawerField label="Energy">
            <select
              value={isCreate ? draft.energy_type || "" : project.energy_type || ""}
              onChange={(e) => {
                const val = (e.target.value || null) as EnergyType | null;
                if (isCreate) setDraft((d) => ({ ...d, energy_type: val }));
                else onUpdate(project.id, { energy_type: val });
              }}
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
              value={isCreate ? draft.category || "" : project.category || ""}
              onChange={(e) => {
                const val = (e.target.value || null) as Category | null;
                if (isCreate) setDraft((d) => ({ ...d, category: val }));
                else onUpdate(project.id, { category: val });
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {config.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </DrawerField>
          <DrawerField label="Person">
            <select
              value={isCreate ? draft.person || "" : project.person || ""}
              onChange={(e) => {
                const val = (e.target.value || null) as Person | null;
                if (isCreate) setDraft((d) => ({ ...d, person: val }));
                else onUpdate(project.id, { person: val });
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {config.people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </DrawerField>
        </div>

        <DrawerField label="Rock">
          <select
            value={isCreate ? draft.rock_id || "" : project.rock_id || ""}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              if (isCreate) setDraft((d) => ({ ...d, rock_id: val }));
              else onUpdate(project.id, { rock_id: val });
            }}
            className={selectClass}
          >
            <option value="">No rock</option>
            {rocks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.rock_name}{r.quarter ? ` (${r.quarter})` : ""}
              </option>
            ))}
          </select>
        </DrawerField>

        <DrawerField label="Notes">
          {isCreate ? (
            <textarea
              rows={3}
              value={draft.notes || ""}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value || null }))}
              placeholder="Project notes..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={3}
              defaultValue={project.notes || ""}
              onBlur={(e) => {
                if (e.target.value !== (project.notes || ""))
                  onUpdate(project.id, { notes: e.target.value || null });
              }}
              placeholder="Project notes..."
              className={`${inputClass} resize-none`}
            />
          )}
        </DrawerField>

        <DrawerField label="Resources">
          {isCreate ? (
            <input
              type="text"
              value={draft.resources || ""}
              onChange={(e) => setDraft((d) => ({ ...d, resources: e.target.value || null }))}
              placeholder="URL or reference..."
              className={inputClass}
            />
          ) : (
            <input
              type="text"
              defaultValue={project.resources || ""}
              onBlur={(e) => {
                if (e.target.value !== (project.resources || ""))
                  onUpdate(project.id, { resources: e.target.value || null });
              }}
              placeholder="URL or reference..."
              className={inputClass}
            />
          )}
        </DrawerField>

        {/* Linked Tasks - only in edit mode */}
        {!isCreate && (
          <div className="pt-3 border-t border-surface-3/40">
            <h4 className="text-[10px] font-ui font-semibold text-text-tertiary uppercase tracking-wider mb-2">
              Tasks ({tasks.length})
            </h4>
            {tasks.length === 0 ? (
              <p className="text-xs text-text-tertiary italic">No linked tasks</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-1 px-2 rounded-md bg-surface-2/40">
                    <Badge status={t.status} size="sm" />
                    <span className="text-xs text-text-primary truncate flex-1">{t.task_title}</span>
                    <EnergyDot type={t.energy_type as EnergyType} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
