"use client";

import { useState, useCallback, useEffect } from "react";
import type { Meeting } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import MeetingDrawer from "./MeetingDrawer";
import Toast from "@/components/ui/Toast";
import { Calendar, Clock, Users, CheckSquare, FileText, Plus } from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function MeetingsClient({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [meetings, setMeetings] = useState(initialMeetings);
  useEffect(() => { setMeetings(initialMeetings); }, [initialMeetings]);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "saved" } | null>(null);

  const handleUpdate = useCallback(async (id: number, updates: Partial<Meeting>) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : null);
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      setToast({ message: "Saved", type: "saved" });
    } catch {
      setToast({ message: "Failed", type: "error" });
    }
  }, [selected]);

  const handleCreate = useCallback(async (data: Partial<Meeting>) => {
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      // API returns { id }, so fetch the full list to get the complete object
      const listRes = await fetch("/api/meetings");
      if (listRes.ok) {
        const allMeetings = await listRes.json();
        setMeetings(allMeetings);
      } else {
        setMeetings((prev) => [...prev, { ...data, id: result.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Meeting]);
      }
      setShowCreate(false);
      setToast({ message: "Created", type: "saved" });
    } catch {
      setToast({ message: "Failed", type: "error" });
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
    try { await fetch(`/api/meetings/${id}`, { method: "DELETE" }); } catch { /* ok */ }
  }, []);

  const filtered = filter
    ? meetings.filter((m) => m.category === filter || m.meeting_type === filter)
    : meetings;

  const categories = [...new Set(meetings.map((m) => m.category).filter(Boolean))];

  return (
    <>
      {/* Filter */}
      <div className="flex items-center gap-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-[11px] font-ui border border-surface-3/60 rounded-lg px-2 py-1 bg-surface-1 text-text-secondary">
          <option value="">All meetings</option>
          {categories.map((c) => <option key={c} value={c!}>{c}</option>)}
        </select>
        <div className="ml-auto">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-mc-accent text-white text-xs font-ui rounded-lg hover:bg-mc-accent/90"
          >
            <Plus className="w-3.5 h-3.5" />
            New Meeting
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelected(m)}
            className="bg-surface-1 rounded-xl border border-surface-3/50 p-4 cursor-pointer hover:border-surface-3 hover:shadow-sm group"
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-text-tertiary shrink-0 group-hover:text-mc-accent" />
                <h4 className="text-sm font-heading font-bold text-text-primary truncate group-hover:text-mc-accent">
                  {m.meeting_title}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge status={m.status} size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-ui text-text-tertiary flex-wrap">
              <span>{formatDate(m.date)}</span>
              {m.meeting_type && <span className="px-1.5 py-0.5 bg-surface-2/50 rounded text-[9px]">{m.meeting_type}</span>}
              {m.duration && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{m.duration}m</span>}
              {m.attendees && <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{m.attendees}</span>}
              {(m.task_count ?? 0) > 0 && <span className="flex items-center gap-0.5"><CheckSquare className="w-2.5 h-2.5" />{m.task_count} tasks</span>}
              {(m.decision_count ?? 0) > 0 && <span className="flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" />{m.decision_count} decisions</span>}
            </div>
            {m.summary && <p className="text-xs text-text-tertiary mt-2 line-clamp-2">{m.summary}</p>}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-text-tertiary font-ui italic py-6 text-center">No meetings</p>
        )}
      </div>

      {selected && <MeetingDrawer meeting={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} onDelete={handleDelete} />}
      {showCreate && <MeetingDrawer meeting={null} onClose={() => setShowCreate(false)} onUpdate={handleUpdate} onCreate={handleCreate} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
