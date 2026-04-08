"use client";

import { useState, useEffect } from "react";
import type { Rock, Project, RockStatus, Category } from "@/lib/types";
import { ROCK_STATUS_ORDER } from "@/lib/types";
import { useConfig } from "@/lib/useConfig";
import SideDrawer from "@/components/ui/SideDrawer";
import Badge from "@/components/ui/Badge";
import DrawerField, { inputClass, selectClass } from "@/components/ui/DrawerField";
import { Trash2 } from "lucide-react";

export default function RockDrawer({
  rock,
  onClose,
  onUpdate,
  onDelete,
  onCreate,
}: {
  rock: Rock | null;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Rock>) => void;
  onDelete?: (id: number) => void;
  onCreate?: (data: Partial<Rock>) => void;
}) {
  const config = useConfig();
  const isCreate = !rock;
  const [projects, setProjects] = useState<Project[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<Partial<Rock>>({
    rock_name: "",
    status: "Not Started",
    quarter: config.quarters[0] || null,
  });

  useEffect(() => {
    if (rock) {
      fetch(`/api/rocks/${rock.id}/projects`)
        .then((r) => r.json())
        .then(setProjects)
        .catch(() => {});
    }
  }, [rock]);

  const handleCreate = () => {
    if (!draft.rock_name?.trim()) return;
    onCreate?.(draft);
  };

  return (
    <SideDrawer
      isOpen
      onClose={onClose}
      title={isCreate ? "New Rock" : rock.rock_name}
      subtitle={isCreate ? undefined : [rock.quarter, rock.category].filter(Boolean).join(" · ") || undefined}
      badge={isCreate ? undefined : <Badge status={rock.status} size="sm" />}
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
              Create Rock
            </button>
          </div>
        ) : onDelete ? (
          <div className="flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-ui">Delete this rock?</span>
                <button
                  onClick={() => onDelete(rock.id)}
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
              value={draft.rock_name || ""}
              onChange={(e) => setDraft((d) => ({ ...d, rock_name: e.target.value }))}
              placeholder="Rock name..."
              className={inputClass}
            />
          ) : (
            <input
              type="text"
              defaultValue={rock.rock_name}
              onBlur={(e) => {
                if (e.target.value !== rock.rock_name)
                  onUpdate(rock.id, { rock_name: e.target.value });
              }}
              className={inputClass}
            />
          )}
        </DrawerField>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Status">
            <select
              value={isCreate ? draft.status || "Not Started" : rock.status}
              onChange={(e) => {
                const val = e.target.value as RockStatus;
                if (isCreate) setDraft((d) => ({ ...d, status: val }));
                else onUpdate(rock.id, { status: val });
              }}
              className={selectClass}
            >
              {ROCK_STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </DrawerField>
          <DrawerField label="Quarter">
            <select
              value={isCreate ? draft.quarter || "" : rock.quarter || ""}
              onChange={(e) => {
                const val = e.target.value || null;
                if (isCreate) setDraft((d) => ({ ...d, quarter: val }));
                else onUpdate(rock.id, { quarter: val });
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {config.quarters.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </DrawerField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Due Date">
            <input
              type="date"
              value={isCreate ? draft.due_date || "" : rock.due_date || ""}
              onChange={(e) => {
                const val = e.target.value || null;
                if (isCreate) setDraft((d) => ({ ...d, due_date: val }));
                else onUpdate(rock.id, { due_date: val });
              }}
              className={inputClass}
            />
          </DrawerField>
          <DrawerField label="Category">
            <select
              value={isCreate ? draft.category || "" : rock.category || ""}
              onChange={(e) => {
                const val = (e.target.value || null) as Category | null;
                if (isCreate) setDraft((d) => ({ ...d, category: val }));
                else onUpdate(rock.id, { category: val });
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {config.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </DrawerField>
        </div>

        <DrawerField label="Notes">
          {isCreate ? (
            <textarea
              rows={3}
              value={draft.notes || ""}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value || null }))}
              placeholder="Rock notes..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={3}
              defaultValue={rock.notes || ""}
              onBlur={(e) => {
                if (e.target.value !== (rock.notes || ""))
                  onUpdate(rock.id, { notes: e.target.value || null });
              }}
              placeholder="Rock notes..."
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
              defaultValue={rock.resources || ""}
              onBlur={(e) => {
                if (e.target.value !== (rock.resources || ""))
                  onUpdate(rock.id, { resources: e.target.value || null });
              }}
              placeholder="URL or reference..."
              className={inputClass}
            />
          )}
        </DrawerField>

        {/* Linked Projects - only in edit mode */}
        {!isCreate && (
          <div className="pt-3 border-t border-surface-3/40">
            <h4 className="text-[10px] font-ui font-semibold text-text-tertiary uppercase tracking-wider mb-2">
              Projects ({projects.length})
            </h4>
            {projects.length === 0 ? (
              <p className="text-xs text-text-tertiary italic">No linked projects</p>
            ) : (
              <div className="space-y-1.5">
                {projects.map((p) => {
                  const pct = p.task_count && p.task_count > 0
                    ? Math.round(((p.completed_task_count || 0) / p.task_count) * 100)
                    : 0;
                  return (
                    <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-surface-2/40">
                      <Badge status={p.status} size="sm" />
                      <span className="text-xs text-text-primary truncate flex-1">{p.project_name}</span>
                      <span className="text-[10px] font-ui text-text-tertiary">
                        {p.completed_task_count || 0}/{p.task_count || 0} tasks
                      </span>
                      {p.task_count && p.task_count > 0 && (
                        <div className="w-12 h-1 bg-surface-3/50 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
