"use client";

import { useState } from "react";
import type { Decision, DecisionStatus, Category, Person } from "@/lib/types";
import { useConfig } from "@/lib/useConfig";
import SideDrawer from "@/components/ui/SideDrawer";
import Badge from "@/components/ui/Badge";
import DrawerField, { inputClass, selectClass } from "@/components/ui/DrawerField";
import { Trash2 } from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DecisionDrawer({
  decision,
  onClose,
  onUpdate,
  onDelete,
  onCreate,
}: {
  decision: Decision | null;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Decision>) => void;
  onDelete?: (id: number) => void;
  onCreate?: (data: Partial<Decision>) => void;
}) {
  const config = useConfig();
  const isCreate = !decision;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<Partial<Decision>>({
    decision_title: "",
    status: "Active",
    date: new Date().toISOString().split("T")[0],
  });

  const handleCreate = () => {
    if (!draft.decision_title?.trim()) return;
    onCreate?.(draft);
  };

  return (
    <SideDrawer
      isOpen
      onClose={onClose}
      title={isCreate ? "New Decision" : decision.decision_title}
      subtitle={
        isCreate
          ? undefined
          : [formatDate(decision.date), decision.meeting_title].filter(Boolean).join(" · ") || undefined
      }
      badge={isCreate ? undefined : <Badge status={decision.status} size="sm" />}
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
              Create Decision
            </button>
          </div>
        ) : onDelete ? (
          <div className="flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-ui">Delete this decision?</span>
                <button
                  onClick={() => onDelete(decision.id)}
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
        <DrawerField label="Title">
          {isCreate ? (
            <input
              type="text"
              autoFocus
              value={draft.decision_title || ""}
              onChange={(e) => setDraft((d) => ({ ...d, decision_title: e.target.value }))}
              placeholder="Decision title..."
              className={inputClass}
            />
          ) : (
            <input
              type="text"
              defaultValue={decision.decision_title}
              onBlur={(e) => {
                if (e.target.value !== decision.decision_title)
                  onUpdate(decision.id, { decision_title: e.target.value });
              }}
              className={inputClass}
            />
          )}
        </DrawerField>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Status">
            <select
              value={isCreate ? draft.status || "Active" : decision.status}
              onChange={(e) => {
                const val = e.target.value as DecisionStatus;
                if (isCreate) setDraft((d) => ({ ...d, status: val }));
                else onUpdate(decision.id, { status: val });
              }}
              className={selectClass}
            >
              <option value="Active">Active</option>
              <option value="Superseded">Superseded</option>
              <option value="Reversed">Reversed</option>
            </select>
          </DrawerField>
          <DrawerField label="Owner">
            <select
              value={isCreate ? draft.owner || "" : decision.owner || ""}
              onChange={(e) => {
                const val = (e.target.value || null) as Person | null;
                if (isCreate) setDraft((d) => ({ ...d, owner: val }));
                else onUpdate(decision.id, { owner: val });
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {config.people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </DrawerField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Date">
            <input
              type="date"
              value={isCreate ? draft.date || "" : decision.date || ""}
              onChange={(e) => {
                const val = e.target.value || null;
                if (isCreate) setDraft((d) => ({ ...d, date: val }));
                else onUpdate(decision.id, { date: val });
              }}
              className={inputClass}
            />
          </DrawerField>
          <DrawerField label="Category">
            <select
              value={isCreate ? draft.category || "" : decision.category || ""}
              onChange={(e) => {
                const val = (e.target.value || null) as Category | null;
                if (isCreate) setDraft((d) => ({ ...d, category: val }));
                else onUpdate(decision.id, { category: val });
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {config.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </DrawerField>
        </div>

        <DrawerField label="Context">
          {isCreate ? (
            <textarea
              rows={2}
              value={draft.context || ""}
              onChange={(e) => setDraft((d) => ({ ...d, context: e.target.value || null }))}
              placeholder="Why was this decision needed..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={2}
              defaultValue={decision.context || ""}
              onBlur={(e) => {
                if (e.target.value !== (decision.context || ""))
                  onUpdate(decision.id, { context: e.target.value || null });
              }}
              placeholder="Why was this decision needed..."
              className={`${inputClass} resize-none`}
            />
          )}
        </DrawerField>

        <DrawerField label="Decision">
          {isCreate ? (
            <textarea
              rows={2}
              value={draft.decision || ""}
              onChange={(e) => setDraft((d) => ({ ...d, decision: e.target.value || null }))}
              placeholder="What was decided..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={2}
              defaultValue={decision.decision || ""}
              onBlur={(e) => {
                if (e.target.value !== (decision.decision || ""))
                  onUpdate(decision.id, { decision: e.target.value || null });
              }}
              placeholder="What was decided..."
              className={`${inputClass} resize-none`}
            />
          )}
        </DrawerField>

        <DrawerField label="Rationale">
          {isCreate ? (
            <textarea
              rows={2}
              value={draft.rationale || ""}
              onChange={(e) => setDraft((d) => ({ ...d, rationale: e.target.value || null }))}
              placeholder="Why this choice..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={2}
              defaultValue={decision.rationale || ""}
              onBlur={(e) => {
                if (e.target.value !== (decision.rationale || ""))
                  onUpdate(decision.id, { rationale: e.target.value || null });
              }}
              placeholder="Why this choice..."
              className={`${inputClass} resize-none`}
            />
          )}
        </DrawerField>

        <DrawerField label="Impact">
          {isCreate ? (
            <textarea
              rows={2}
              value={draft.impact || ""}
              onChange={(e) => setDraft((d) => ({ ...d, impact: e.target.value || null }))}
              placeholder="Expected implications..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={2}
              defaultValue={decision.impact || ""}
              onBlur={(e) => {
                if (e.target.value !== (decision.impact || ""))
                  onUpdate(decision.id, { impact: e.target.value || null });
              }}
              placeholder="Expected implications..."
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
              defaultValue={decision.resources || ""}
              onBlur={(e) => {
                if (e.target.value !== (decision.resources || ""))
                  onUpdate(decision.id, { resources: e.target.value || null });
              }}
              placeholder="URL or reference..."
              className={inputClass}
            />
          )}
        </DrawerField>

        {/* Metadata - only in edit mode */}
        {!isCreate && (
          <div className="pt-3 border-t border-surface-3/40 text-[10px] font-ui text-text-tertiary space-y-0.5">
            {decision.meeting_title && <p>From: {decision.meeting_title}</p>}
            <p>Created {new Date(decision.created_at).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
