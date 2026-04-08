"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const WS_URL = "ws://127.0.0.1:3101";

export default function TerminalPanel({ isOpen }: { isOpen: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const initRef = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setReconnecting(true);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setReconnecting(false);
      if (fitRef.current && termRef.current) {
        fitRef.current.fit();
        ws.send(JSON.stringify({
          type: "resize",
          cols: termRef.current.cols,
          rows: termRef.current.rows,
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "output" && termRef.current) {
          termRef.current.write(msg.data);
        }
        if (msg.type === "exit") {
          setConnected(false);
          setTimeout(connect, 1000);
        }
      } catch {
        termRef.current?.write(event.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setReconnecting(false);
      setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      setConnected(false);
      setReconnecting(false);
    };
  }, []);

  // Initialize terminal — waits for container to have real dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el || initRef.current) return;

    // Wait for container to have dimensions (may need a frame after mount)
    const tryInit = () => {
      if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) {
        requestAnimationFrame(tryInit);
        return;
      }

      initRef.current = true;

      const term = new XTerm({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
        lineHeight: 1.3,
        theme: {
          background: "#0a0a0b",
          foreground: "#e4e4e7",
          cursor: "#e05265",
          cursorAccent: "#0a0a0b",
          selectionBackground: "#e0526540",
          black: "#18181b",
          red: "#ef4444",
          green: "#10b981",
          yellow: "#f59e0b",
          blue: "#3b82f6",
          magenta: "#a855f7",
          cyan: "#06b6d4",
          white: "#e4e4e7",
          brightBlack: "#52525b",
          brightRed: "#f87171",
          brightGreen: "#34d399",
          brightYellow: "#fbbf24",
          brightBlue: "#60a5fa",
          brightMagenta: "#c084fc",
          brightCyan: "#22d3ee",
          brightWhite: "#fafafa",
        },
        allowProposedApi: true,
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      termRef.current = term;
      fitRef.current = fit;

      term.open(el);

      // Disable macOS iCloud Passwords autofill on xterm's hidden textarea
      const xtermTextarea = el.querySelector("textarea");
      if (xtermTextarea) {
        xtermTextarea.setAttribute("autocomplete", "off");
        xtermTextarea.setAttribute("data-form-type", "other");
        xtermTextarea.setAttribute("data-lpignore", "true");
        xtermTextarea.setAttribute("data-1p-ignore", "");
      }

      // Force the xterm element to fill the container
      const xtermEl = el.querySelector(".xterm") as HTMLElement;
      if (xtermEl) {
        xtermEl.style.width = "100%";
        xtermEl.style.height = "100%";
      }
      fit.fit();

      term.onData((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "input", data }));
        }
      });

      term.onResize(({ cols, rows }) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
        }
      });

      connect();
    };

    tryInit();

    return () => {
      wsRef.current?.close();
      termRef.current?.dispose();
      termRef.current = null;
      fitRef.current = null;
      wsRef.current = null;
      initRef.current = false; // Allow re-init after strict mode remount
    };
  }, [connect]);

  // Re-fit when panel becomes visible
  useEffect(() => {
    if (isOpen && fitRef.current && termRef.current) {
      const doFit = () => {
        const el = containerRef.current;
        const xtermEl = el?.querySelector(".xterm") as HTMLElement;
        if (xtermEl) {
          xtermEl.style.width = "100%";
          xtermEl.style.height = "100%";
        }
        fitRef.current?.fit();
      };
      // Multiple fits to handle layout settling
      requestAnimationFrame(doFit);
      const t1 = setTimeout(doFit, 100);
      const t2 = setTimeout(doFit, 300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isOpen]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => fitRef.current?.fit();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ResizeObserver — refit when panel is resized via drag handle
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (fitRef.current) {
        const xtermEl = el.querySelector(".xterm") as HTMLElement;
        if (xtermEl) {
          xtermEl.style.width = "100%";
          xtermEl.style.height = "100%";
        }
        fitRef.current.fit();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#0a0a0b", borderLeft: "1px solid rgba(63,63,70,0.5)" }}>
      {/* Header */}
      <div style={{ height: 28, minHeight: 28, display: "flex", alignItems: "center", padding: "0 12px", background: "#141416", borderBottom: "1px solid rgba(63,63,70,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#10b981" : reconnecting ? "#f59e0b" : "#ef4444" }} />
          <span style={{ fontSize: 11, fontFamily: "var(--font-ui, Inter, sans-serif)", color: "#a1a1aa" }}>
            {connected ? "Terminal" : reconnecting ? "Connecting..." : "Disconnected"}
          </span>
        </div>
      </div>
      {/* Terminal — this div is the xterm mount point */}
      <div
        ref={containerRef}
        style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden", padding: "4px 0 0 4px" }}
      />
    </div>
  );
}
