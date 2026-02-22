import {
  Effect,
  Deferred,
  HashMap,
  PubSub,
  Queue,
  Ref,
  Scope,
  Stream,
} from "effect";
import { Command } from "@effect/platform";

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

export interface PiRpcClientOptions {
  provider?: string;
  model?: string;
}

// ── Errors ────────────────────────────────────────────────────────

export class PiRpcProcessExitError {
  readonly _tag = "PiRpcProcessExitError" as const;
  constructor(readonly message: string = "Pi RPC process exited unexpectedly") {}
}

export class PiRpcSendError {
  readonly _tag = "PiRpcSendError" as const;
  constructor(readonly message: string) {}
}

// ── Client Interface ──────────────────────────────────────────────

export interface PiRpcClient {
  readonly events: PubSub.PubSub<PiRpcEvent>;
  readonly send: (
    command: PiRpcCommand
  ) => Effect.Effect<PiRpcResponse, PiRpcProcessExitError | PiRpcSendError>;
  readonly prompt: (
    message: string
  ) => Effect.Effect<PiRpcResponse, PiRpcProcessExitError | PiRpcSendError>;
  readonly abort: () => Effect.Effect<
    PiRpcResponse,
    PiRpcProcessExitError | PiRpcSendError
  >;
  readonly onEvent: (
    callback: (event: PiRpcEvent) => void
  ) => Effect.Effect<void, never, Scope.Scope>;
}

// ── Factory ───────────────────────────────────────────────────────

export const makePiRpcClient = Effect.fn("PiRpcClient.make")(function* (
  options: PiRpcClientOptions = {}
) {
  const args = ["--mode", "rpc", "--no-session"];
  if (options.provider) args.push("--provider", options.provider);
  if (options.model) args.push("--model", options.model);

  const cmd = Command.make("pi", ...args).pipe(
    Command.stdin("pipe"),
    Command.stdout("pipe"),
    Command.stderr("pipe")
  );

  const proc = yield* Command.start(cmd);

  const idCounter = yield* Ref.make(0);
  const resolvers = yield* Ref.make(
    HashMap.empty<string, Deferred.Deferred<PiRpcResponse, PiRpcProcessExitError>>()
  );
  const events = yield* PubSub.unbounded<PiRpcEvent>();

  // Drain stderr to Effect.log
  yield* proc.stderr.pipe(
    Stream.decodeText("utf-8"),
    Stream.splitLines,
    Stream.runForEach((line) => Effect.log("[pi-rpc]", { stderr: line })),
    Effect.forkScoped
  );

  // Parse stdout lines, route responses vs events
  yield* proc.stdout.pipe(
    Stream.decodeText("utf-8"),
    Stream.splitLines,
    Stream.runForEach((line) =>
      Effect.gen(function* () {
        const parsed = yield* Effect.try({
          try: () => JSON.parse(line) as PiRpcEvent | PiRpcResponse,
          catch: () => "malformed JSON" as const,
        }).pipe(Effect.option);

        if (parsed._tag === "None") return;
        const msg = parsed.value;

        if (msg.type === "response") {
          const resp = msg as PiRpcResponse;
          const id = resp.id;
          if (id) {
            const map = yield* Ref.get(resolvers);
            const maybeDeferred = HashMap.get(map, id);
            if (maybeDeferred._tag === "Some") {
              yield* Deferred.succeed(maybeDeferred.value, resp);
              yield* Ref.update(resolvers, HashMap.remove(id));
              return;
            }
          }
        }

        yield* PubSub.publish(events, msg as PiRpcEvent);
      })
    ),
    Effect.forkScoped
  );

  // On process exit, reject all pending deferreds
  yield* proc.exitCode.pipe(
    Effect.tap(() =>
      Effect.gen(function* () {
        const map = yield* Ref.get(resolvers);
        yield* Effect.forEach(
          HashMap.values(map),
          (deferred) =>
            Deferred.succeed(deferred, {
              type: "response",
              command: "unknown",
              success: false,
              error: "Pi RPC process exited unexpectedly",
            }),
          { discard: true }
        );
        yield* Ref.set(resolvers, HashMap.empty());
      })
    ),
    Effect.forkScoped
  );

  const send = Effect.fn("PiRpcClient.send")(function* (
    command: PiRpcCommand
  ) {
    const id = `req-${yield* Ref.getAndUpdate(idCounter, (n) => n + 1)}`;
    const cmd = { ...command, id };
    const deferred = yield* Deferred.make<PiRpcResponse, PiRpcProcessExitError>();

    yield* Ref.update(resolvers, HashMap.set(id, deferred));

    const payload = new TextEncoder().encode(JSON.stringify(cmd) + "\n");
    yield* Stream.make(payload).pipe(
      Stream.run(proc.stdin),
      Effect.mapError(() => new PiRpcSendError("Failed to write to pi stdin"))
    );

    return yield* Deferred.await(deferred);
  });

  const prompt = (message: string) =>
    send({ type: "prompt", message });

  const abort = () => send({ type: "abort" });

  const onEvent = (callback: (event: PiRpcEvent) => void) =>
    Effect.gen(function* () {
      const sub = yield* PubSub.subscribe(events);
      yield* Queue.take(sub).pipe(
        Effect.tap((event) => Effect.sync(() => callback(event))),
        Effect.forever,
        Effect.forkScoped
      );
    });

  return { events, send, prompt, abort, onEvent } satisfies PiRpcClient;
});
