"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "./Header";
import Sidebar from "./Sidebar";
import CommandPalette from "@/components/ui/CommandPalette";
import { ConfigProvider, useConfig } from "@/lib/useConfig";

// Dynamic import — no SSR for terminal (xterm.js needs DOM)
// Terminal is optional: install node-pty, ws, @xterm/xterm, @xterm/addon-fit to enable
const TerminalPanel = dynamic(() => import("@/components/terminal/TerminalPanel"), {
  ssr: false,
});

const MIN_TERMINAL_WIDTH = 280;
const MAX_TERMINAL_FRACTION = 0.65;
const DEFAULT_TERMINAL_FRACTION = 0.38;

function AppShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const config = useConfig();
  const terminalEnabled = config.terminal || false;

  const [searchOpen, setSearchOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalWidth, setTerminalWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Track whether terminal has been opened at least once (lazy mount)
  const terminalMounted = useRef(false);
  if (terminalEnabled && terminalOpen) terminalMounted.current = true;

  // Initialize terminal width on first open
  useEffect(() => {
    if (terminalOpen && terminalWidth === null && containerRef.current) {
      setTerminalWidth(containerRef.current.offsetWidth * DEFAULT_TERMINAL_FRACTION);
    }
  }, [terminalOpen, terminalWidth]);

  // Drag handle logic
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const maxWidth = rect.width * MAX_TERMINAL_FRACTION;
      const newWidth = Math.max(MIN_TERMINAL_WIDTH, Math.min(maxWidth, rect.right - ev.clientX));
      setTerminalWidth(newWidth);
    };

    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
    // Cmd+J → terminal toggle (only when enabled)
    if (terminalEnabled && (e.metaKey || e.ctrlKey) && e.key === "j") {
      e.preventDefault();
      setTerminalOpen((prev) => !prev);
    }
  }, [terminalEnabled]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const fetchBadges = () =>
      fetch("/api/badges").then(r => r.json()).then(setBadges).catch(() => {});
    fetchBadges();
    const interval = setInterval(fetchBadges, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const disableAutofill = (el: Element) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (!el.getAttribute("autocomplete")) {
          el.setAttribute("autocomplete", "off");
          el.setAttribute("data-form-type", "other");
        }
      }
    };
    document.querySelectorAll("input, textarea").forEach(disableAutofill);
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof Element) {
            if (node.matches("input, textarea")) disableAutofill(node);
            node.querySelectorAll("input, textarea").forEach(disableAutofill);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(interval);
  }, [router]);

  const handleRefreshData = useCallback(() => {
    router.refresh();
    fetch("/api/badges").then(r => r.json()).then(setBadges).catch(() => {});
  }, [router]);

  return (
    <div className="h-screen flex flex-col bg-surface-0">
      <Header
        onOpenSearch={() => setSearchOpen(true)}
        terminalEnabled={terminalEnabled}
        terminalOpen={terminalOpen}
        onToggleTerminal={terminalEnabled ? () => setTerminalOpen((prev) => !prev) : undefined}
        onRefreshData={handleRefreshData}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar badges={badges} />

        {/* Content + Terminal container */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden">
          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-5">
              {children}
            </div>
          </main>

          {/* Drag handle — only visible when terminal is open */}
          {terminalEnabled && terminalOpen && (
            <div
              onMouseDown={onDragStart}
              className="w-1.5 shrink-0 bg-dark-1 hover:bg-mc-accent/30 active:bg-mc-accent/50 transition-colors cursor-col-resize flex items-center justify-center group"
            >
              <div className="w-0.5 h-8 bg-dark-3 group-hover:bg-mc-accent/60 rounded-full transition-colors" />
            </div>
          )}

          {/* Terminal — single instance, CSS show/hide for session persistence */}
          {terminalEnabled && terminalMounted.current && (
            <div
              style={terminalOpen
                ? { width: terminalWidth ?? 400, height: "100%", flexShrink: 0 }
                : { width: 0, height: 0, overflow: "hidden", position: "absolute", pointerEvents: "none" }
              }
            >
              <TerminalPanel isOpen={terminalOpen} />
            </div>
          )}
        </div>
      </div>
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <AppShellInner>{children}</AppShellInner>
    </ConfigProvider>
  );
}
