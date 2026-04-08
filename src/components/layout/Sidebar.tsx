"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Target,
  Calendar,
  FileText,
} from "lucide-react";
import type { ProjectTier } from "@/lib/types";
import { TierDot } from "@/components/ui/TierBadge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface WorkspaceProject {
  id: number;
  project_name: string;
  status: string;
  tier: ProjectTier;
  rock_id: number | null;
}

const navGroups: NavGroup[] = [
  {
    title: "",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "WORK",
    items: [
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Rocks", href: "/rocks", icon: Target },
    ],
  },
  {
    title: "REFERENCE",
    items: [
      { label: "Meetings", href: "/meetings", icon: Calendar },
      { label: "Decisions", href: "/decisions", icon: FileText },
    ],
  },
];

export default function Sidebar({ badges }: { badges?: Record<string, number> }) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(
          data
            .filter((p: WorkspaceProject) => p.status === "In Progress" || p.status === "Not Started")
            .sort((a: WorkspaceProject, b: WorkspaceProject) => {
              const tierOrder: Record<string, number> = { L1: 0, L2: 1, L3: 2 };
              return (tierOrder[a.tier] ?? 1) - (tierOrder[b.tier] ?? 1);
            })
            .slice(0, 10)
        );
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-52 bg-dark-0 shrink-0 overflow-y-auto border-r border-dark-3/30">
      <nav className="py-3 px-2.5 space-y-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <div className="px-2.5 mb-1.5 text-[9px] font-ui font-semibold tracking-[0.15em] text-text-tertiary/60 uppercase">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.href === "/"
                  ? pathname === "/"
                  : item.href === "/projects"
                  ? pathname === "/projects"
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                const badge = badges?.[item.href];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-ui font-medium ${
                      isActive
                        ? "bg-mc-accent/15 text-mc-accent"
                        : "text-text-tertiary hover:text-text-muted hover:bg-dark-2/50"
                    }`}
                  >
                    <Icon className="w-[15px] h-[15px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className={`ml-auto text-[10px] font-semibold min-w-[18px] text-center py-0.5 rounded-full ${
                        isActive ? "bg-mc-accent/20 text-mc-accent" : "bg-mc-accent/10 text-mc-accent/80"
                      }`}>
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Workspaces — grouped by tier */}
        {projects.length > 0 && (
          <div>
            <div className="px-2.5 mb-1.5 text-[9px] font-ui font-semibold tracking-[0.15em] text-text-tertiary/60 uppercase">
              Workspaces
            </div>
            <div className="space-y-0.5">
              {projects.map((p) => {
                const isActive = pathname === `/projects/${p.id}`;
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-ui ${
                      isActive
                        ? "bg-mc-accent/15 text-mc-accent font-medium"
                        : "text-text-tertiary hover:text-text-muted hover:bg-dark-2/50"
                    }`}
                  >
                    <TierDot tier={p.tier} />
                    {p.rock_id && <Target className="w-2.5 h-2.5 text-mc-accent/60 shrink-0 -ml-0.5" />}
                    <span className="truncate">{p.project_name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
