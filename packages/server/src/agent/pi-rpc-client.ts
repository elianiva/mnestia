import { spawn, type ChildProcess } from "node:child_process";
import { createInterface, type Interface } from "node:readline";

// ── Types ─────────────────────────────────────────────────────────

interface PiRpcCommand {
  id?: string;
  type: string;
  [key: string]: unknown;
}

interface PiRpcResponse {
  type: "response";
  id?: string;
  command: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface PiRpcEvent {
  type: string;
  [key: string]: unknown;
}

export interface PiTextDelta {
  type: "text_delta";
  contentIndex: number;
  delta: string;
}

export interface PiAgentEnd {
  type: "agent_end";
  messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string }>;
  }>;
}

export type PiEventCallback = (event: PiRpcEvent) => void;

export interface PiRpcClientOptions {
  provider?: string;
  model?: string;
}

// ── Client ────────────────────────────────────────────────────────

export class PiRpcClient {
  private proc: ChildProcess | null = null;
  private rl: Interface | null = null;
  private listeners: PiEventCallback[] = [];
  private responseResolvers = new Map<
    string,
    (resp: PiRpcResponse) => void
  >();
  private idCounter = 0;
  private readonly options: PiRpcClientOptions;

  constructor(options: PiRpcClientOptions = {}) {
    this.options = options;
  }

  private ensureProcess(): ChildProcess {
    if (this.proc && this.proc.exitCode === null) return this.proc;

    const args = ["--mode", "rpc", "--no-session"];
    if (this.options.provider) {
      args.push("--provider", this.options.provider);
    }
    if (this.options.model) {
      args.push("--model", this.options.model);
    }

    this.proc = spawn("pi", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.rl = createInterface({ input: this.proc.stdout! });
    this.rl.on("line", (line) => this.handleLine(line));

    this.proc.on("exit", () => {
      this.rl?.close();
      this.rl = null;
      this.proc = null;

      // Reject all pending resolvers to prevent promise leaks
      for (const [id, resolve] of this.responseResolvers) {
        resolve({
          type: "response",
          id,
          command: "unknown",
          success: false,
          error: "Pi RPC process exited unexpectedly",
        });
      }
      this.responseResolvers.clear();
    });

    this.proc.stderr?.on("data", (chunk: Buffer) => {
      // eslint-disable-next-line no-console
      console.error("[pi-rpc]", chunk.toString());
    });

    return this.proc;
  }

  private handleLine(line: string): void {
    let parsed: PiRpcEvent | PiRpcResponse;
    try {
      parsed = JSON.parse(line);
    } catch {
      return;
    }

    // Route responses to waiting resolvers
    if (parsed.type === "response") {
      const resp = parsed as PiRpcResponse;
      const id = resp.id;
      if (id && this.responseResolvers.has(id)) {
        this.responseResolvers.get(id)!(resp);
        this.responseResolvers.delete(id);
        return;
      }
    }

    // Broadcast events to listeners
    for (const cb of this.listeners) {
      cb(parsed as PiRpcEvent);
    }
  }

  onEvent(callback: PiEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  async send(command: PiRpcCommand): Promise<PiRpcResponse> {
    const proc = this.ensureProcess();
    const id = `req-${++this.idCounter}`;
    const cmd = { ...command, id };

    return new Promise<PiRpcResponse>((resolve) => {
      this.responseResolvers.set(id, resolve);
      proc.stdin!.write(JSON.stringify(cmd) + "\n");
    });
  }

  async prompt(message: string): Promise<PiRpcResponse> {
    return this.send({ type: "prompt", message });
  }

  async abort(): Promise<PiRpcResponse> {
    return this.send({ type: "abort" });
  }

  destroy(): void {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
    this.rl?.close();
    this.rl = null;
    this.listeners = [];
    this.responseResolvers.clear();
  }

  get isAlive(): boolean {
    return this.proc !== null && this.proc.exitCode === null;
  }
}
