"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckSquare, FolderKanban, Target, Calendar, FileText, ArrowRight } from "lucide-react";
import type { SearchResult } from "@/lib/queries";

const TYPE_ICONS = {
  task: CheckSquare,
  project: FolderKanban,
  rock: Target,
  meeting: Calendar,
  decision: FileText,
};

const TYPE_COLORS = {
  task: "text-blue-400",
  project: "text-violet-400",
  rock: "text-mc-accent",
  meeting: "text-amber-400",
  decision: "text-emerald-400",
};

const QUICK_ACTIONS = [
  { label: "Go to Dashboard", href: "/", type: "nav" as const },
  { label: "Go to Tasks", href: "/tasks", type: "nav" as const },
  { label: "Go to Projects", href: "/projects", type: "nav" as const },
  { label: "Go to Rocks", href: "/rocks", type: "nav" as const },
  { label: "Go to Meetings", href: "/meetings", type: "nav" as const },
  { label: "Go to Decisions", href: "/decisions", type: "nav" as const },
];

export default function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const items = query.trim()
    ? results
    : QUICK_ACTIONS;

  const navigate = useCallback((item: SearchResult | typeof QUICK_ACTIONS[0]) => {
    onClose();
    if ("href" in item) {
      router.push(item.href);
    } else {
      const paths: Record<string, string> = {
        task: "/tasks",
        project: "/projects",
        rock: "/rocks",
        meeting: "/meetings",
        decision: "/decisions",
      };
      router.push(`${paths[item.type]}?open=${item.id}`);
    }
  }, [onClose, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[selectedIndex]) {
      e.preventDefault();
      navigate(items[selectedIndex] as SearchResult);
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [items, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-1 rounded-xl shadow-2xl border border-surface-3/50 overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-3/50">
          <Search className="w-4 h-4 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, meetings..."
            autoComplete="off"
            data-form-type="other"
            className="flex-1 bg-transparent text-sm font-ui text-text-primary placeholder:text-text-tertiary outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-surface-3 border-t-mc-accent rounded-full animate-spin" />
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1.5">
          {query.trim() && results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-sm text-text-tertiary font-ui">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {!query.trim() && (
                <div className="px-3 py-1.5 text-[10px] font-ui font-semibold tracking-wider text-text-tertiary/60 uppercase">
                  Quick navigation
                </div>
              )}
              {items.map((item, i) => {
                const isSearch = "type" in item && !("href" in item);
                const Icon = isSearch ? TYPE_ICONS[(item as SearchResult).type] : ArrowRight;
                const color = isSearch ? TYPE_COLORS[(item as SearchResult).type] : "text-text-tertiary";

                return (
                  <button
                    key={i}
                    onClick={() => navigate(item as SearchResult)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 mx-1.5 rounded-lg text-left ${
                      i === selectedIndex ? "bg-surface-2" : "hover:bg-surface-2/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${color}`} strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-ui text-text-primary truncate block">
                        {"label" in item ? item.label : (item as SearchResult).title}
                      </span>
                      {isSearch && (item as SearchResult).subtitle && (
                        <span className="text-[11px] font-ui text-text-tertiary truncate block">
                          {(item as SearchResult).subtitle}
                        </span>
                      )}
                    </div>
                    {isSearch && (
                      <span className="text-[10px] font-ui text-text-tertiary capitalize">
                        {(item as SearchResult).type}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-3/50 bg-surface-2/30">
          <div className="flex items-center gap-3 text-[10px] font-ui text-text-tertiary">
            <span><kbd className="px-1 py-0.5 bg-surface-3/50 rounded text-[9px]">&#8593;&#8595;</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-surface-3/50 rounded text-[9px]">&#9166;</kbd> open</span>
            <span><kbd className="px-1 py-0.5 bg-surface-3/50 rounded text-[9px]">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
