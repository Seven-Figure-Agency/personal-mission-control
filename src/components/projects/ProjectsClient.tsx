"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Project, EnergyType, ProjectTier } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import EnergyDot from "@/components/ui/EnergyDot";
import TierBadge from "@/components/ui/TierBadge";
import ProjectDrawer from "./ProjectDrawer";
import Toast from "@/components/ui/Toast";
import { FolderKanban, Target, ArrowRight, Plus } from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  useEffect(() => { setProjects(initialProjects); }, [initialProjects]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "saved" } | null>(null);

  const handleUpdate = useCallback(async (id: number, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : null);
    try {
      const res = await fetch(`/api/projects/${id}`, {
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

  const handleCreate = useCallback(async (data: Partial<Project>) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const newProject = await res.json();
      setProjects((prev) => [...prev, newProject]);
      setShowCreate(false);
      setToast({ message: "Created", type: "saved" });
    } catch {
      setToast({ message: "Failed", type: "error" });
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSelected(null);
    try { await fetch(`/api/projects/${id}`, { method: "DELETE" }); } catch { /* ok */ }
  }, []);

  const active = projects.filter((p) => p.status === "In Progress");
  const other = projects.filter((p) => p.status !== "In Progress" && p.status !== "Complete");
  const done = projects.filter((p) => p.status === "Complete");

  // Sort by tier within each group
  const sortByTier = (a: Project, b: Project) => {
    const order: Record<string, number> = { L1: 0, L2: 1, L3: 2 };
    return (order[a.tier] ?? 1) - (order[b.tier] ?? 1);
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const pct = project.task_count && project.task_count > 0
      ? Math.round(((project.completed_task_count || 0) / project.task_count) * 100)
      : 0;

    return (
      <div className="bg-surface-1 rounded-xl border border-surface-3/50 p-4 group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderKanban className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <h4
              onClick={() => setSelected(project)}
              className="text-sm font-heading font-bold text-text-primary truncate cursor-pointer hover:text-mc-accent"
            >
              {project.project_name}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <TierBadge tier={project.tier as ProjectTier} isRock={!!project.rock_id} />
            <Badge status={project.status} size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-ui text-text-tertiary mb-2">
          <EnergyDot type={project.energy_type as EnergyType} showLabel />
          {project.due_date && <span>Due {formatDate(project.due_date)}</span>}
          {project.person && <span>{project.person}</span>}
        </div>

        {project.task_count !== undefined && project.task_count > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-ui text-text-tertiary">
              {project.completed_task_count || 0}/{project.task_count}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          {project.rock_name ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-ui text-text-tertiary bg-surface-2/50 px-1.5 py-0.5 rounded-full">
              <Target className="w-2.5 h-2.5 text-mc-accent/60" />
              {project.rock_name}
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={() => router.push(`/projects/${project.id}`)}
            className="flex items-center gap-1 text-[10px] font-ui text-text-tertiary hover:text-mc-accent opacity-0 group-hover:opacity-100"
          >
            Open workspace <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between -mt-3 mb-1">
        <div />
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-mc-accent text-white text-xs font-ui rounded-lg hover:bg-mc-accent/90"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      {active.length > 0 && (
        <div>
          <h3 className="text-[10px] font-ui font-semibold tracking-[0.15em] text-text-tertiary/60 uppercase mb-2">In Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.sort(sortByTier).map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}
      {other.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[10px] font-ui font-semibold tracking-[0.15em] text-text-tertiary/60 uppercase mb-2">Other</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {other.sort(sortByTier).map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[10px] font-ui font-semibold tracking-[0.15em] text-text-tertiary/60 uppercase mb-2">Complete</h3>
          <div className="space-y-1">
            {done.map((p) => (
              <div key={p.id} onClick={() => setSelected(p)} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-surface-1 border border-surface-3/30 cursor-pointer hover:bg-surface-2/30 opacity-60 hover:opacity-80">
                <TierBadge tier={p.tier as ProjectTier} />
                <Badge status="Complete" size="sm" />
                <span className="text-sm text-text-secondary">{p.project_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && <ProjectDrawer project={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} onDelete={handleDelete} />}
      {showCreate && <ProjectDrawer project={null} onClose={() => setShowCreate(false)} onUpdate={handleUpdate} onCreate={handleCreate} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
