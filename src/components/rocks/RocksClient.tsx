"use client";

import { useState, useCallback, useEffect } from "react";
import type { Rock } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import RockDrawer from "./RockDrawer";
import Toast from "@/components/ui/Toast";
import { Target, Plus } from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function progressPercent(status: string) {
  switch (status) {
    case "Not Started": return 0;
    case "In Progress": return 50;
    case "Complete": return 100;
    case "Blocked": return 25;
    default: return 0;
  }
}

export default function RocksClient({ initialRocks }: { initialRocks: Rock[] }) {
  const [rocks, setRocks] = useState(initialRocks);
  useEffect(() => { setRocks(initialRocks); }, [initialRocks]);
  const [selected, setSelected] = useState<Rock | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "saved" } | null>(null);

  const handleUpdate = useCallback(async (id: number, updates: Partial<Rock>) => {
    setRocks((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : null);
    try {
      const res = await fetch(`/api/rocks/${id}`, {
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

  const handleCreate = useCallback(async (data: Partial<Rock>) => {
    try {
      const res = await fetch("/api/rocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const newRock = await res.json();
      setRocks((prev) => [...prev, newRock]);
      setShowCreate(false);
      setToast({ message: "Created", type: "saved" });
    } catch {
      setToast({ message: "Failed", type: "error" });
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    setRocks((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);
    try { await fetch(`/api/rocks/${id}`, { method: "DELETE" }); } catch { /* ok */ }
  }, []);

  const byQuarter = rocks.reduce<Record<string, Rock[]>>((acc, r) => {
    const q = r.quarter || "No Quarter";
    if (!acc[q]) acc[q] = [];
    acc[q].push(r);
    return acc;
  }, {});

  const quarters = Object.keys(byQuarter).sort().reverse();

  return (
    <>
      <div className="flex items-center justify-between -mt-3 mb-1">
        <div />
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-mc-accent text-white text-xs font-ui rounded-lg hover:bg-mc-accent/90"
        >
          <Plus className="w-3.5 h-3.5" />
          New Rock
        </button>
      </div>

      {quarters.map((quarter) => (
        <div key={quarter}>
          <h3 className="text-[10px] font-ui font-semibold tracking-[0.15em] text-text-tertiary/60 uppercase mb-2">{quarter}</h3>
          <div className="space-y-2">
            {byQuarter[quarter].map((rock) => {
              const pct = progressPercent(rock.status);
              return (
                <div
                  key={rock.id}
                  onClick={() => setSelected(rock)}
                  className="bg-surface-1 rounded-xl border border-surface-3/50 p-4 cursor-pointer hover:border-surface-3 hover:shadow-sm group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-mc-accent shrink-0" />
                      <h4 className="text-sm font-heading font-bold text-text-primary group-hover:text-mc-accent">{rock.rock_name}</h4>
                    </div>
                    <Badge status={rock.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : rock.status === "Blocked" ? "bg-red-400" : "bg-blue-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-ui text-text-tertiary">{pct}%</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-ui text-text-tertiary">
                    {rock.due_date && <span>Due {formatDate(rock.due_date)}</span>}
                    {rock.category && <span>{rock.category}</span>}
                    <span>{rock.project_count} project{rock.project_count !== 1 ? "s" : ""}</span>
                  </div>
                  {rock.notes && (
                    <p className="text-xs text-text-tertiary mt-2 pt-2 border-t border-surface-3/30 line-clamp-2">{rock.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {selected && <RockDrawer rock={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} onDelete={handleDelete} />}
      {showCreate && <RockDrawer rock={null} onClose={() => setShowCreate(false)} onUpdate={handleUpdate} onCreate={handleCreate} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
