"use client";

import { Rocket, Search, TerminalSquare, RefreshCw } from "lucide-react";

function getContext() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  const today = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return { weekNum, quarter, today };
}

export default function Header({
  onOpenSearch,
  terminalEnabled,
  terminalOpen,
  onToggleTerminal,
  onRefreshData,
}: {
  onOpenSearch?: () => void;
  terminalEnabled?: boolean;
  terminalOpen?: boolean;
  onToggleTerminal?: () => void;
  onRefreshData?: () => void;
}) {
  const { weekNum, quarter, today } = getContext();

  return (
    <header className="sticky top-0 z-40 h-12 bg-dark-0 flex items-center px-5 shrink-0 border-b border-dark-3/50">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 bg-mc-accent rounded-md flex items-center justify-center">
          <Rocket className="w-3 h-3 text-white" />
        </div>
        <span className="text-text-inverse text-sm font-heading font-bold tracking-tight">
          Mission Control
        </span>
      </div>

      {/* Search trigger */}
      {onOpenSearch && (
        <button
          onClick={onOpenSearch}
          className="ml-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-2 border border-dark-3/50 text-text-tertiary hover:text-text-muted hover:border-dark-3 text-xs font-ui"
        >
          <Search className="w-3 h-3" />
          <span>Search...</span>
          <kbd className="ml-4 text-[10px] bg-dark-3/50 px-1.5 py-0.5 rounded text-text-tertiary">
            &#8984;K
          </kbd>
        </button>
      )}

      <div className="ml-auto flex items-center gap-3">
        {/* Refresh data */}
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-muted hover:bg-dark-2 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Terminal toggle — only shown when terminal is enabled in config */}
        {terminalEnabled && onToggleTerminal && (
          <button
            onClick={onToggleTerminal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-ui border ${
              terminalOpen
                ? "bg-mc-accent/15 border-mc-accent/30 text-mc-accent"
                : "bg-dark-2 border-dark-3/50 text-text-tertiary hover:text-text-muted hover:border-dark-3"
            }`}
          >
            <TerminalSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Terminal</span>
            <kbd className="text-[10px] bg-dark-3/50 px-1.5 py-0.5 rounded text-text-tertiary">
              &#8984;J
            </kbd>
          </button>
        )}

        <div className="flex items-center gap-3 text-xs text-text-tertiary font-ui">
          <span>{today}</span>
          <span className="text-dark-3">|</span>
          <span>Wk {weekNum} · {quarter}</span>
        </div>
      </div>
    </header>
  );
}
