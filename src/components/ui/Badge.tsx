"use client";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  // Task statuses
  "Maybe": { bg: "bg-zinc-100", text: "text-zinc-500", dot: "bg-zinc-400" },
  "Backlog": { bg: "bg-zinc-100", text: "text-zinc-600", dot: "bg-zinc-500" },
  "To Do": { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-500" },
  "Top 3": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "In Progress": { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  "Completed": { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  // Project statuses
  "Not Started": { bg: "bg-zinc-100", text: "text-zinc-500", dot: "bg-zinc-400" },
  "Complete": { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  "Blocked": { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  "On Hold": { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
  // Meeting statuses
  "Unprocessed": { bg: "bg-zinc-100", text: "text-zinc-500", dot: "bg-zinc-400" },
  "Processed": { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  // Decision statuses
  "Active": { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  "Superseded": { bg: "bg-zinc-100", text: "text-zinc-500", dot: "bg-zinc-400" },
  "Reversed": { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  // Priority
  "High": { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  "Medium": { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  "Low": { bg: "bg-zinc-100", text: "text-zinc-500", dot: "bg-zinc-400" },
};

export default function Badge({
  status,
  size = "sm",
  onClick,
}: {
  status: string;
  size?: "sm" | "md";
  onClick?: (e: React.MouseEvent) => void;
}) {
  const colors = STATUS_COLORS[status] || { bg: "bg-zinc-100", text: "text-zinc-500", dot: "bg-zinc-400" };
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-[2px] gap-1" : "text-[11px] px-2 py-0.5 gap-1.5";

  const className = `inline-flex items-center rounded-full font-ui font-medium ${colors.bg} ${colors.text} ${sizeClass} ${
    onClick ? "cursor-pointer hover:brightness-95 active:scale-[0.97]" : ""
  }`;

  const inner = (
    <>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <span className={className}>{inner}</span>;
}
