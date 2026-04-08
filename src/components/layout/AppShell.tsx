"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import CommandPalette from "@/components/ui/CommandPalette";
import { ConfigProvider } from "@/lib/useConfig";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K → search
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Fetch sidebar badges client-side
  useEffect(() => {
    const fetchBadges = () =>
      fetch("/api/badges").then(r => r.json()).then(setBadges).catch(() => {});
    fetchBadges();
    const interval = setInterval(fetchBadges, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Disable iCloud Passwords autofill on all inputs
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

  // Auto-refresh page data every 20s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(interval);
  }, [router]);

  const handleRefreshData = useCallback(() => {
    router.refresh();
    fetch("/api/badges").then(r => r.json()).then(setBadges).catch(() => {});
  }, [router]);

  return (
    <ConfigProvider>
      <div className="h-screen flex flex-col bg-surface-0">
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onRefreshData={handleRefreshData}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar badges={badges} />
          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-5">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </ConfigProvider>
  );
}
