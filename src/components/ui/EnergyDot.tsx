"use client";

import { useConfig } from "@/lib/useConfig";

// Static map ensures Tailwind doesn't purge dynamic classes
const TAILWIND_COLORS: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
};

export default function EnergyDot({ type, showLabel = false }: { type: string | null; showLabel?: boolean }) {
  const config = useConfig();
  if (!type) return null;

  const energyConfig = config.energyTypes.find((e) => e.name === type);
  const colorClass = energyConfig ? (TAILWIND_COLORS[energyConfig.color] || "bg-zinc-500") : "bg-zinc-500";

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-ui text-text-tertiary">
      <span className={`w-[6px] h-[6px] rounded-full ${colorClass}`} />
      {showLabel && type}
    </span>
  );
}
