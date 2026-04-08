import Card from "@/components/ui/Card";
import EnergyDot from "@/components/ui/EnergyDot";
import DashboardClient from "@/components/dashboard/DashboardClient";
import {
  getTop3Tasks,
  getOverdueTasks,
  getTasksDueThisWeek,
  getUpcomingMeetings,
  getRecentActivity,
  getDashboardStats,
} from "@/lib/queries";
import { getConfig } from "@/lib/config";
import type { EnergyType } from "@/lib/types";
import { AlertTriangle, Clock } from "lucide-react";

const TAILWIND_BG: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
};

export default function Dashboard() {
  const config = getConfig();
  const top3 = getTop3Tasks();
  const overdue = getOverdueTasks();
  const dueThisWeek = getTasksDueThisWeek();
  const meetings = getUpcomingMeetings();
  const activity = getRecentActivity(8);
  const stats = getDashboardStats();

  return (
      <div className="space-y-5">
        {/* Page header */}
        <div>
          <h2 className="text-xl font-heading font-bold text-text-primary">Dashboard</h2>
        </div>

        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top 3 — interactive */}
          <div className="lg:col-span-2">
            <DashboardClient top3={top3} overdue={overdue} />
          </div>

          {/* Attention */}
          <Card title="Attention">
            <div className="space-y-3">
              {stats.overdue > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{stats.overdue} overdue</p>
                    <p className="text-[10px] text-text-tertiary font-ui">past due date</p>
                  </div>
                </div>
              )}
              {stats.noDueDate > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{stats.noDueDate} undated</p>
                    <p className="text-[10px] text-text-tertiary font-ui">need due dates</p>
                  </div>
                </div>
              )}
              {stats.overdue === 0 && stats.noDueDate === 0 && (
                <p className="text-sm text-emerald-600 font-ui font-medium">All clear</p>
              )}

              <div className="pt-2 border-t border-surface-3/40">
                <p className="text-[9px] font-ui font-semibold tracking-[0.15em] text-text-tertiary/60 uppercase mb-2">Energy</p>
                <div className="space-y-1.5">
                  {config.energyTypes.map(({ name, color }) => {
                    const count = stats.energyCounts[name] || 0;
                    const bgClass = TAILWIND_BG[color] || "bg-zinc-500";
                    return (
                      <div key={name} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${bgClass} shrink-0`} />
                        <span className="text-[11px] font-ui text-text-secondary w-14">{name}</span>
                        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div className={`h-full ${bgClass} rounded-full`} style={{ width: stats.totalActive > 0 ? `${(count / stats.totalActive) * 100}%` : "0%" }} />
                        </div>
                        <span className="text-[10px] font-ui text-text-tertiary w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Due This Week">
            {dueThisWeek.length === 0 ? (
              <p className="text-sm text-text-tertiary font-ui italic">Nothing due</p>
            ) : (
              <div className="space-y-1.5">
                {dueThisWeek.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <EnergyDot type={task.energy_type as EnergyType} />
                      <span className="text-sm text-text-primary truncate">{task.task_title}</span>
                    </div>
                    <span className="text-[10px] font-ui text-text-tertiary shrink-0 ml-3">
                      {task.due_date && new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Recent Activity">
            {activity.length === 0 ? (
              <p className="text-sm text-text-tertiary font-ui italic">No activity</p>
            ) : (
              <div className="space-y-1.5">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 py-0.5 text-[12px] font-ui">
                    <span className="text-[10px] text-text-tertiary shrink-0 w-14 capitalize">{a.entity_type}</span>
                    <span className="text-text-secondary">{a.action}</span>
                    <span className="text-text-primary truncate">{a.details}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
  );
}
