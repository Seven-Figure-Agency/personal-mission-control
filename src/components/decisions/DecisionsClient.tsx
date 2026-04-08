"use client";

import { useState, useCallback, useEffect } from "react";
import type { Decision } from "@/lib/types";
import { useConfig } from "@/lib/useConfig";
import Badge from "@/components/ui/Badge";
import DecisionDrawer from "./DecisionDrawer";
import Toast from "@/components/ui/Toast";
import { FileText, Search, Plus } from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DecisionsClient({ initialDecisions }: { initialDecisions: Decision[] }) {
  const config = useConfig();
  const [decisions, setDecisions] = useState(initialDecisions);
  useEffect(() => { setDecisions(initialDecisions); }, [initialDecisions]);
  const [selected, setSelected] = useState<Decision | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "saved" } | null>(null);

  const handleUpdate = useCallback(async (id: number, updates: Partial<Decision>) => {
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : null);
    try {
      const res = await fetch(`/api/decisions/${id}`, {
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

  const handleCreate = useCallback(async (data: Partial<Decision>) => {
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      // API returns { id }, so fetch the full list to get the complete object
      const listRes = await fetch("/api/decisions");
      if (listRes.ok) {
        const allDecisions = await listRes.json();
        setDecisions(allDecisions);
      } else {
        // Fallback: add a minimal object
        setDecisions((prev) => [...prev, { ...data, id: result.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Decision]);
      }
      setShowCreate(false);
      setToast({ message: "Created", type: "saved" });
    } catch {
      setToast({ message: "Failed", type: "error" });
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    setDecisions((prev) => prev.filter((d) => d.id !== id));
    setSelected(null);
    try { await fetch(`/api/decisions/${id}`, { method: "DELETE" }); } catch { /* ok */ }
  }, []);

  const filtered = decisions.filter((d) => {
    if (filterCategory && d.category !== filterCategory) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.decision_title.toLowerCase().includes(q) ||
        (d.decision || "").toLowerCase().includes(q) ||
        (d.context || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-1 border border-surface-3/60 rounded-lg">
          <Search className="w-3 h-3 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="text-[11px] font-ui bg-transparent outline-none text-text-primary placeholder:text-text-muted w-40"
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-[11px] font-ui border border-surface-3/60 rounded-lg px-2 py-1 bg-surface-1 text-text-secondary">
          <option value="">All categories</option>
          {config.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-[11px] font-ui border border-surface-3/60 rounded-lg px-2 py-1 bg-surface-1 text-text-secondary">
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Superseded">Superseded</option>
          <option value="Reversed">Reversed</option>
        </select>
        <span className="text-[10px] font-ui text-text-tertiary ml-auto">{filtered.length} results</span>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-mc-accent text-white text-xs font-ui rounded-lg hover:bg-mc-accent/90"
        >
          <Plus className="w-3.5 h-3.5" />
          New Decision
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((d) => (
          <div
            key={d.id}
            onClick={() => setSelected(d)}
            className={`bg-surface-1 rounded-xl border border-surface-3/50 p-4 cursor-pointer hover:border-surface-3 hover:shadow-sm group ${
              d.status !== "Active" ? "opacity-50 hover:opacity-70" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-text-tertiary shrink-0 group-hover:text-mc-accent" />
                <h4 className="text-sm font-heading font-bold text-text-primary truncate group-hover:text-mc-accent">
                  {d.decision_title}
                </h4>
              </div>
              <Badge status={d.status} size="sm" />
            </div>
            <div className="flex items-center gap-3 text-[10px] font-ui text-text-tertiary mb-1.5">
              <span>{formatDate(d.date)}</span>
              {d.owner && <span>{d.owner}</span>}
              {d.category && <span>{d.category}</span>}
              {d.meeting_title && <span className="px-1.5 py-0.5 bg-surface-2/50 rounded text-[9px]">{d.meeting_title}</span>}
            </div>
            {d.decision && (
              <p className="text-xs text-text-secondary line-clamp-2">{d.decision}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-text-tertiary font-ui italic py-6 text-center">No decisions match</p>
        )}
      </div>

      {selected && <DecisionDrawer decision={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} onDelete={handleDelete} />}
      {showCreate && <DecisionDrawer decision={null} onClose={() => setShowCreate(false)} onUpdate={handleUpdate} onCreate={handleCreate} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
