// Type stubs for optional terminal dependencies.
// These allow TypeScript to compile whether or not the packages are installed.
// Install the real packages with: npm install node-pty ws @xterm/xterm @xterm/addon-fit @types/ws

declare module "@xterm/xterm" {
  export class Terminal {
    constructor(options?: Record<string, unknown>);
    cols: number;
    rows: number;
    open(element: HTMLElement): void;
    write(data: string): void;
    dispose(): void;
    loadAddon(addon: unknown): void;
    onData(callback: (data: string) => void): void;
    onResize(callback: (size: { cols: number; rows: number }) => void): void;
  }
}

declare module "@xterm/addon-fit" {
  export class FitAddon {
    fit(): void;
  }
}

declare module "@xterm/xterm/css/xterm.css" {}

declare module "ws" {
  export class WebSocket {
    static OPEN: number;
    readyState: number;
    send(data: string): void;
    close(): void;
    terminate(): void;
    ping(): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, callback: (...args: any[]) => void): void;
  }
  export class WebSocketServer {
    constructor(options: Record<string, unknown>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, callback: (...args: any[]) => void): void;
    close(): void;
  }
}

declare module "node-pty" {
  export interface IPty {
    write(data: string): void;
    resize(cols: number, rows: number): void;
    kill(): void;
    onData(callback: (data: string) => void): void;
    onExit(callback: (exit: { exitCode: number }) => void): void;
  }
  export function spawn(
    shell: string,
    args: string[],
    options: Record<string, unknown>
  ): IPty;
}
