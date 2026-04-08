/**
 * Terminal WebSocket Server
 * Spawns a real PTY (zsh/bash) rooted in the project directory.
 * Runs on port 3101 alongside the Next.js app on 3100.
 *
 * Optional feature — requires: npm install node-pty ws @types/ws
 */

import { WebSocketServer, WebSocket } from "ws";
import * as pty from "node-pty";
import path from "path";

const PORT = 3101;
const SHELL = process.env.SHELL || "/bin/zsh";
const CWD = path.resolve(__dirname, "..");
const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

// Track active sessions
const sessions = new Map<WebSocket, { pty: pty.IPty; alive: boolean; id: number }>();
let nextId = 1;

const wss = new WebSocketServer({ port: PORT, host: "127.0.0.1" });
console.log(`Terminal server listening on ws://127.0.0.1:${PORT}`);

// Heartbeat — detect dead connections and clean up their PTYs
const heartbeat = setInterval(() => {
  for (const [ws, session] of sessions) {
    if (!session.alive) {
      console.log(`Session ${session.id}: heartbeat timeout, killing PTY`);
      ws.terminate();
      session.pty.kill();
      sessions.delete(ws);
      continue;
    }
    session.alive = false;
    ws.ping();
  }
  if (sessions.size > 0) {
    console.log(`Active sessions: ${sessions.size}`);
  }
}, HEARTBEAT_INTERVAL);

wss.on("connection", (ws: WebSocket) => {
  const id = nextId++;
  console.log(`Session ${id}: connected (total: ${sessions.size + 1})`);

  let ptyProcess: pty.IPty;
  try {
    ptyProcess = pty.spawn(SHELL, ["-l"], {
      name: "xterm-256color",
      cols: 100,
      rows: 30,
      cwd: CWD,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
      } as Record<string, string>,
    });
  } catch (err) {
    console.error(`Session ${id}: failed to spawn PTY:`, err);
    ws.send(JSON.stringify({ type: "output", data: `\r\nFailed to start shell: ${err}\r\n` }));
    ws.close();
    return;
  }

  sessions.set(ws, { pty: ptyProcess, alive: true, id });

  // Respond to pong (heartbeat)
  ws.on("pong", () => {
    const session = sessions.get(ws);
    if (session) session.alive = true;
  });

  // PTY stdout → browser
  ptyProcess.onData((data: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "output", data }));
    }
  });

  // PTY exit
  ptyProcess.onExit(({ exitCode }) => {
    console.log(`Session ${id}: PTY exited with code ${exitCode}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "exit", code: exitCode }));
      ws.close();
    }
    sessions.delete(ws);
  });

  // Browser → PTY
  ws.on("message", (raw: Buffer) => {
    // Mark alive on any message (implicit heartbeat)
    const session = sessions.get(ws);
    if (session) session.alive = true;

    try {
      const msg = JSON.parse(raw.toString());
      switch (msg.type) {
        case "input":
          ptyProcess.write(msg.data);
          break;
        case "resize":
          if (msg.cols && msg.rows) {
            ptyProcess.resize(msg.cols, msg.rows);
          }
          break;
      }
    } catch {
      // Raw string fallback
      ptyProcess.write(raw.toString());
    }
  });

  ws.on("close", () => {
    console.log(`Session ${id}: disconnected`);
    ptyProcess.kill();
    sessions.delete(ws);
  });

  ws.on("error", (err: Error) => {
    console.error(`Session ${id}: WebSocket error:`, err.message);
    ptyProcess.kill();
    sessions.delete(ws);
  });
});

// Cleanup on server shutdown
function shutdown() {
  clearInterval(heartbeat);
  for (const [ws, session] of sessions) {
    console.log(`Shutting down session ${session.id}`);
    session.pty.kill();
    ws.close();
  }
  sessions.clear();
  wss.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
