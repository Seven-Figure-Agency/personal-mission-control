import type { ProjectTier } from "@/lib/types";
import { Target } from "lucide-react";

const TIER_CONFIG: Record<ProjectTier, { label: string; color: string; dot: string; desc: string }> = {
  L1: { label: "L1", color: "text-violet-600 bg-violet-50", dot: "bg-violet-500", desc: "Major" },
  L2: { label: "L2", color: "text-blue-600 bg-blue-50", dot: "bg-blue-500", desc: "Sprint" },
  L3: { label: "L3", color: "text-emerald-600 bg-emerald-50", dot: "bg-emerald-500", desc: "Quick Win" },
};

export default function TierBadge({
  tier,
  showLabel = false,
  isRock = false,
}: {
  tier: ProjectTier | null;
  showLabel?: boolean;
  isRock?: boolean;
}) {
  if (!tier) return null;
  const cfg = TIER_CONFIG[tier];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full text-[10px] font-ui font-semibold px-1.5 py-[1px] ${cfg.color}`}>
      {isRock && <Target className="w-2.5 h-2.5" />}
      <span className={`w-[5px] h-[5px] rounded-full ${cfg.dot}`} />
      {cfg.label}
      {showLabel && <span className="font-normal ml-0.5">{cfg.desc}</span>}
    </span>
  );
}

export function TierDot({ tier }: { tier: ProjectTier | null }) {
  if (!tier) return null;
  const cfg = TIER_CONFIG[tier];
  return <span className={`w-[6px] h-[6px] rounded-full ${cfg.dot} shrink-0`} />;
}
