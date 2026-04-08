"use client";

import { useState, useEffect } from "react";
import type { Meeting, Task, Decision, EnergyType, MeetingType, MeetingStatus, Category } from "@/lib/types";
import { MEETING_STATUS_ORDER } from "@/lib/types";
import { useConfig } from "@/lib/useConfig";
import SideDrawer from "@/components/ui/SideDrawer";
import Badge from "@/components/ui/Badge";
import EnergyDot from "@/components/ui/EnergyDot";
import DrawerField, { inputClass, selectClass } from "@/components/ui/DrawerField";
import { CheckSquare, FileText, Trash2 } from "lucide-react";

export default function MeetingDrawer({
  meeting,
  onClose,
  onUpdate,
  onDelete,
  onCreate,
}: {
  meeting: Meeting | null;
  onClose: () => void;
  onUpdate?: (id: number, updates: Partial<Meeting>) => void;
  onDelete?: (id: number) => void;
  onCreate?: (data: Partial<Meeting>) => void;
}) {
  const config = useConfig();
  const isCreate = !meeting;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<Partial<Meeting>>({
    meeting_title: "",
    status: "Unprocessed",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (meeting) {
      fetch(`/api/meetings/${meeting.id}/related`)
        .then((r) => r.json())
        .then((data) => {
          setTasks(data.tasks || []);
          setDecisions(data.decisions || []);
        })
        .catch(() => {});
    }
  }, [meeting]);

  const handleCreate = () => {
    if (!draft.meeting_title?.trim()) return;
    onCreate?.(draft);
  };

  return (
    <SideDrawer
      isOpen
      onClose={onClose}
      title={isCreate ? "New Meeting" : meeting.meeting_title}
      subtitle={
        isCreate
          ? undefined
          : meeting.date
            ? new Date(meeting.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
            : undefined
      }
      badge={isCreate ? undefined : <Badge status={meeting.status} size="sm" />}
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
              Create Meeting
            </button>
          </div>
        ) : onDelete ? (
          <div className="flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-ui">Delete this meeting?</span>
                <button
                  onClick={() => onDelete(meeting.id)}
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
              value={draft.meeting_title || ""}
              onChange={(e) => setDraft((d) => ({ ...d, meeting_title: e.target.value }))}
              placeholder="Meeting title..."
              className={inputClass}
            />
          ) : (
            <input
              type="text"
              defaultValue={meeting.meeting_title}
              onBlur={(e) => {
                if (e.target.value !== meeting.meeting_title)
                  onUpdate?.(meeting.id, { meeting_title: e.target.value });
              }}
              className={inputClass}
            />
          )}
        </DrawerField>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Status">
            <select
              value={isCreate ? draft.status || "Unprocessed" : meeting.status}
              onChange={(e) => {
                const val = e.target.value as MeetingStatus;
                if (isCreate) setDraft((d) => ({ ...d, status: val }));
                else onUpdate?.(meeting.id, { status: val });
              }}
              className={selectClass}
            >
              {MEETING_STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </DrawerField>
          <DrawerField label="Type">
            <select
              value={isCreate ? draft.meeting_type || "" : meeting.meeting_type || ""}
              onChange={(e) => {
                const val = (e.target.value || null) as MeetingType | null;
                if (isCreate) setDraft((d) => ({ ...d, meeting_type: val }));
                else onUpdate?.(meeting.id, { meeting_type: val });
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {config.meetingTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </DrawerField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Date">
            <input
              type="date"
              value={isCreate ? draft.date || "" : meeting.date || ""}
              onChange={(e) => {
                const val = e.target.value || null;
                if (isCreate) setDraft((d) => ({ ...d, date: val }));
                else onUpdate?.(meeting.id, { date: val });
              }}
              className={inputClass}
            />
          </DrawerField>
          <DrawerField label="Category">
            <select
              value={isCreate ? draft.category || "" : meeting.category || ""}
              onChange={(e) => {
                const val = (e.target.value || null) as Category | null;
                if (isCreate) setDraft((d) => ({ ...d, category: val }));
                else onUpdate?.(meeting.id, { category: val });
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {config.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </DrawerField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Duration (min)">
            <input
              type="number"
              value={isCreate ? draft.duration || "" : meeting.duration || ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                if (isCreate) setDraft((d) => ({ ...d, duration: val }));
                else onUpdate?.(meeting.id, { duration: val });
              }}
              placeholder="60"
              className={inputClass}
            />
          </DrawerField>
          <DrawerField label="Attendees">
            {isCreate ? (
              <input
                type="text"
                value={draft.attendees || ""}
                onChange={(e) => setDraft((d) => ({ ...d, attendees: e.target.value || null }))}
                placeholder="Names..."
                className={inputClass}
              />
            ) : (
              <input
                type="text"
                defaultValue={meeting.attendees || ""}
                onBlur={(e) => {
                  if (e.target.value !== (meeting.attendees || ""))
                    onUpdate?.(meeting.id, { attendees: e.target.value || null });
                }}
                placeholder="Names..."
                className={inputClass}
              />
            )}
          </DrawerField>
        </div>

        <DrawerField label="Summary">
          {isCreate ? (
            <textarea
              rows={2}
              value={draft.summary || ""}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value || null }))}
              placeholder="Meeting summary..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={2}
              defaultValue={meeting.summary || ""}
              onBlur={(e) => {
                if (e.target.value !== (meeting.summary || ""))
                  onUpdate?.(meeting.id, { summary: e.target.value || null });
              }}
              placeholder="Meeting summary..."
              className={`${inputClass} resize-none`}
            />
          )}
        </DrawerField>

        <DrawerField label="Key Topics">
          {isCreate ? (
            <textarea
              rows={2}
              value={draft.key_topics || ""}
              onChange={(e) => setDraft((d) => ({ ...d, key_topics: e.target.value || null }))}
              placeholder="Topics discussed..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={2}
              defaultValue={meeting.key_topics || ""}
              onBlur={(e) => {
                if (e.target.value !== (meeting.key_topics || ""))
                  onUpdate?.(meeting.id, { key_topics: e.target.value || null });
              }}
              placeholder="Topics discussed..."
              className={`${inputClass} resize-none`}
            />
          )}
        </DrawerField>

        <DrawerField label="Notes">
          {isCreate ? (
            <textarea
              rows={3}
              value={draft.notes || ""}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value || null }))}
              placeholder="Meeting notes..."
              className={`${inputClass} resize-none`}
            />
          ) : (
            <textarea
              rows={3}
              defaultValue={meeting.notes || ""}
              onBlur={(e) => {
                if (e.target.value !== (meeting.notes || ""))
                  onUpdate?.(meeting.id, { notes: e.target.value || null });
              }}
              placeholder="Meeting notes..."
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
              defaultValue={meeting.resources || ""}
              onBlur={(e) => {
                if (e.target.value !== (meeting.resources || ""))
                  onUpdate?.(meeting.id, { resources: e.target.value || null });
              }}
              placeholder="URL or reference..."
              className={inputClass}
            />
          )}
        </DrawerField>

        {/* Tasks spawned - only in edit mode */}
        {!isCreate && (
          <div className="pt-3 border-t border-surface-3/40">
            <h4 className="flex items-center gap-1.5 text-[10px] font-ui font-semibold text-text-tertiary uppercase tracking-wider mb-2">
              <CheckSquare className="w-3 h-3" />
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

        {/* Decisions spawned - only in edit mode */}
        {!isCreate && (
          <div className="pt-3 border-t border-surface-3/40">
            <h4 className="flex items-center gap-1.5 text-[10px] font-ui font-semibold text-text-tertiary uppercase tracking-wider mb-2">
              <FileText className="w-3 h-3" />
              Decisions ({decisions.length})
            </h4>
            {decisions.length === 0 ? (
              <p className="text-xs text-text-tertiary italic">No linked decisions</p>
            ) : (
              <div className="space-y-1.5">
                {decisions.map((d) => (
                  <div key={d.id} className="py-1.5 px-2 rounded-md bg-surface-2/40">
                    <div className="flex items-center gap-2">
                      <Badge status={d.status} size="sm" />
                      <span className="text-xs text-text-primary truncate">{d.decision_title}</span>
                    </div>
                    {d.decision && (
                      <p className="text-[11px] text-text-tertiary mt-1 ml-5 line-clamp-2">{d.decision}</p>
                    )}
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
