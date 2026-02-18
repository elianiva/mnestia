# @mnestia/server — Effect Tracing + Sentry Implementation Plan

> Step-by-step implementation plan for adding distributed tracing to the server
> package using Effect's OpenTelemetry integration with Sentry as the backend.
>
> Companion document: [01-tracing-sentry-prd.md](./01-tracing-sentry-prd.md)

---

## Overview

Wire Effect's built-in tracing (`Effect.withSpan`, `Effect.fn` auto-spans) into
Sentry via the OpenTelemetry bridge. The existing `SlideService` methods already
generate spans through `Effect.fn` — this plan connects them to a real backend.

Key integration points:

- **`@sentry/bun`** — Sentry SDK initialization for the Bun runtime
- **`@sentry/opentelemetry`** — `SentrySpanProcessor` converts OTEL spans → Sentry
- **`@effect/opentelemetry`** — `NodeSdk.layer` bridges Effect tracing → OpenTelemetry
- **`ManagedRuntime`** — Existing runtime extended with the tracing layer

---

## Current State

- [x] Effect domain layer fully implemented with `Effect.fn` (auto-spans)
- [x] `ManagedRuntime` created in `src/ws/effect-runtime.ts`
- [x] WebSocket + Agent handlers operational
- [x] `AppConfig` loaded via Effect `Config` module
- [ ] No tracing infrastructure
- [ ] No Sentry SDK
- [ ] No OpenTelemetry bridge
- [ ] No span annotations on transport handlers

---

## Step 1: Install Dependencies

> Add Sentry + OpenTelemetry packages to the server package.

### 1.1 — Install Sentry SDK

- [ ] `bun add @sentry/bun @sentry/opentelemetry`

### 1.2 — Install Effect OpenTelemetry Bridge

- [ ] `bun add @effect/opentelemetry`

### 1.3 — Install OpenTelemetry SDK Dependencies

- [ ] `bun add @opentelemetry/sdk-trace-base @opentelemetry/sdk-trace-node`

### 1.4 — Verify Peer Dependencies

- [ ] Confirm `@opentelemetry/api` is installed (peer dep of `@effect/opentelemetry`)
- [ ] If not auto-installed: `bun add @opentelemetry/api`

### 1.5 — Validate Install

- [ ] Run `bun install` in server package
- [ ] Run `bun run typecheck` — confirm clean

### Dependency Table

| Package                         | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| `@sentry/bun`                   | Sentry SDK for Bun runtime                   |
| `@sentry/opentelemetry`         | `SentrySpanProcessor` for span export        |
| `@effect/opentelemetry`         | Effect ↔ OpenTelemetry bridge (`NodeSdk`)    |
| `@opentelemetry/sdk-trace-base` | Base span processor + exporter types         |
| `@opentelemetry/sdk-trace-node` | Node/Bun-compatible tracer provider          |
| `@opentelemetry/api`            | OpenTelemetry API (peer dependency)          |

---

## Step 2: Sentry Configuration (`src/config/sentry-config.ts`)

> Load Sentry-related configuration via Effect Config, extending AppConfig.

### 2.1 — Define Sentry Config Interface

- [ ] Create `src/config/sentry-config.ts`
- [ ] Define `SentryConfig` interface:
  - `dsn: Option<Redacted<string>>` — Sentry DSN (optional)
  - `environment: string` — defaults to `"dev"`
  - `tracesSampleRate: number` — defaults to `1.0`
  - `consoleTrace: boolean` — defaults to `false` (dev-mode console exporter)

```typescript
import { Config, Effect, Option, Redacted } from "effect";

export interface SentryConfig {
  readonly dsn: Option.Option<Redacted.Redacted<string>>;
  readonly environment: string;
  readonly tracesSampleRate: number;
  readonly consoleTrace: boolean;
}

export const loadSentryConfig: Effect.Effect<SentryConfig> = Effect.gen(
  function* () {
    const dsn = yield* Config.option(
      Config.redacted(Config.string("SENTRY_DSN"))
    );
    const environment = yield* Config.string("SENTRY_ENVIRONMENT").pipe(
      Config.withDefault("dev")
    );
    const tracesSampleRate = yield* Config.number(
      "SENTRY_TRACES_SAMPLE_RATE"
    ).pipe(Config.withDefault(1.0));
    const consoleTrace = yield* Config.boolean("OTEL_CONSOLE_TRACE").pipe(
      Config.withDefault(false)
    );

    return { dsn, environment, tracesSampleRate, consoleTrace };
  }
);
```

### 2.2 — Extend AppConfig

- [ ] Update `src/config/app-config.ts` to include `sentry: SentryConfig`
- [ ] Load `SentryConfig` inside `loadAppConfig`
- [ ] Export the combined config

```typescript
// In app-config.ts, add:
import type { SentryConfig } from "./sentry-config";
import { loadSentryConfig } from "./sentry-config";

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly openaiApiKey: Option.Option<Redacted.Redacted<string>>;
  readonly sentry: SentryConfig;
}

export const loadAppConfig = Effect.gen(function* () {
  // ... existing config ...
  const sentry = yield* loadSentryConfig;
  return { port, host, openaiApiKey, sentry } satisfies AppConfig;
});
```

### 2.3 — Validate Config

- [ ] Run `bun run typecheck`
- [ ] Test with and without `SENTRY_DSN` env var

---

## Step 3: Sentry Initialization (`src/config/sentry-init.ts`)

> Sentry initialization is a pure Effect — config comes from Effect `Config`,
> not `process.env`. The init runs as part of the startup Effect pipeline
> in `index.ts`, after `loadAppConfig` resolves.

### 3.1 — Create Sentry Init Module

- [ ] Create `src/config/sentry-init.ts`
- [ ] Define `initSentry` as an `Effect` that accepts `SentryConfig`
- [ ] Call `Sentry.init()` inside `Effect.sync` when DSN is present
- [ ] Return whether Sentry was enabled (used by tracing layer + error capture)
- [ ] **Important:** Disable Sentry's auto-OTEL setup (`skipOpenTelemetrySetup: true`)
  since Effect manages its own OpenTelemetry via `@effect/opentelemetry`

```typescript
import * as Sentry from "@sentry/bun";
import { Effect, Option, Redacted } from "effect";
import type { SentryConfig } from "./sentry-config";

export function initSentry(
  config: SentryConfig
): Effect.Effect<boolean> {
  return Effect.gen(function* () {
    if (Option.isNone(config.dsn)) {
      yield* Effect.log("[sentry] No SENTRY_DSN set — tracing disabled");
      return false;
    }

    yield* Effect.sync(() => {
      Sentry.init({
        dsn: Redacted.value(config.dsn.value),
        environment: config.environment,
        tracesSampleRate: config.tracesSampleRate,
        sendDefaultPii: true,
        // Let Effect/OpenTelemetry manage tracing, not Sentry auto-instrumentation
        skipOpenTelemetrySetup: true,
      });
    });

    yield* Effect.log("[sentry] Initialized");
    return true;
  });
}

export { Sentry };
```

### 3.2 — Wire Into Startup Pipeline

- [ ] Update `src/index.ts` — call `initSentry` inside the startup `Effect.gen`,
  after `loadAppConfig` but before Elysia app creation
- [ ] Pass the `sentryEnabled` boolean into `AppConfig` (or alongside it)
  so downstream code can check without re-reading env

```typescript
// src/index.ts
import { Elysia } from "elysia";
import { Effect } from "effect";
import { loadAppConfig } from "./config/app-config";
import { initSentry } from "./config/sentry-init";
// ... rest of imports

const { config, sentryEnabled } = await Effect.runPromise(
  Effect.gen(function* () {
    const config = yield* loadAppConfig;
    const sentryEnabled = yield* initSentry(config.sentry);
    return { config, sentryEnabled };
  })
);
```

### 3.3 — Validate Initialization

- [ ] Start server with `SENTRY_DSN=https://...` → see `[sentry] Initialized`
- [ ] Start server without `SENTRY_DSN` → see `[sentry] No SENTRY_DSN set — tracing disabled`
- [ ] Confirm no errors or crashes in either case
- [ ] Confirm `sentryEnabled` is `true` / `false` accordingly

---

## Step 4: OpenTelemetry Tracing Layer (`src/config/tracing-layer.ts`)

> Create the Effect Layer that bridges Effect spans → OpenTelemetry → Sentry.
> The layer is a pure function of `SentryConfig` + `sentryEnabled` boolean —
> no module-level state, no `process.env`.

### 4.1 — Create Tracing Layer Module

- [ ] Create `src/config/tracing-layer.ts`
- [ ] Define `createTracingLayer(config, sentryEnabled)` — pure function,
  receives everything it needs as arguments
- [ ] Build `NodeSdk.layer` with `SentrySpanProcessor` when Sentry is enabled
- [ ] Optionally add `ConsoleSpanExporter` for local dev when `OTEL_CONSOLE_TRACE=true`
- [ ] Return `Layer.empty` when neither Sentry nor console trace is configured

```typescript
import { NodeSdk } from "@effect/opentelemetry";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { SentrySpanProcessor } from "@sentry/opentelemetry";
import { Layer } from "effect";
import type { SentryConfig } from "./sentry-config";

export function createTracingLayer(
  config: SentryConfig,
  sentryEnabled: boolean
): Layer.Layer<never> {
  const processors: Array<SpanProcessor> = [];

  if (sentryEnabled) {
    processors.push(new SentrySpanProcessor());
  }

  if (config.consoleTrace) {
    processors.push(new BatchSpanProcessor(new ConsoleSpanExporter()));
  }

  // No processors → no tracing layer needed
  if (processors.length === 0) {
    return Layer.empty;
  }

  return NodeSdk.layer(() => ({
    resource: {
      serviceName: "@mnestia/server",
      serviceVersion: "0.0.1",
    },
    spanProcessor:
      processors.length === 1 ? processors[0]! : processors,
  }));
}
```

### 4.2 — Type Considerations

- [ ] `NodeSdk.layer` returns `Layer<Resource>` — this needs to be provided to the runtime
- [ ] Verify that providing `NodeSdk.layer` to `ManagedRuntime` does not conflict
  with the existing `SlideService` layer
- [ ] If `Resource` type conflicts, use `Layer.provideMerge` to compose

### 4.3 — Validate Layer

- [ ] Run `bun run typecheck`
- [ ] Confirm the layer builds without errors

---

## Step 5: Wire Tracing Into ManagedRuntime

> Update `src/ws/effect-runtime.ts` to include the tracing layer
> in the `ManagedRuntime` so all Effect operations produce spans.

### 5.1 — Update `createSlideRuntime`

- [ ] Accept a pre-built tracing `Layer` as parameter (not raw config)
- [ ] The caller (`slideStatePlugin` / `index.ts`) is responsible for
  calling `createTracingLayer(config, sentryEnabled)` and passing the result
- [ ] Compose the tracing layer with the existing service layer
- [ ] The `ManagedRuntime` now provides both `SlideService` and tracing

```typescript
import { Layer, ManagedRuntime } from "effect";
import { SlideServiceLive, createSlideStoreLive } from "../domain/slide-layer";
import type { SlideService } from "../domain/slide-service";
import type { DeckStateInternal } from "../domain/slide-store";

export function createSlideRuntime(
  storeMap: Map<string, DeckStateInternal>,
  tracingLayer: Layer.Layer<never>
): ManagedRuntime.ManagedRuntime<SlideService, never> {
  const storeLayer = createSlideStoreLive(storeMap);
  const serviceLayer = SlideServiceLive.pipe(Layer.provide(storeLayer));

  // Merge tracing into the service layer
  const fullLayer = Layer.merge(serviceLayer, tracingLayer);

  return ManagedRuntime.make(fullLayer);
}
```

### 5.2 — Update `slideStatePlugin`

- [ ] Update `src/state/slide-state.ts` to accept a pre-built tracing `Layer`
- [ ] The factory receives only what it needs — no config parsing, no env reading
- [ ] Option A: Accept tracing layer as parameter to the plugin factory
- [ ] Option B: Move runtime creation to `index.ts` and pass via `.decorate()`

Preferred: **Option A** — Keep runtime creation co-located with state.

```typescript
// src/state/slide-state.ts
import { Elysia } from "elysia";
import type { Layer } from "effect";
import type { DeckStateInternal } from "../domain/slide-store";
import { createSlideRuntime } from "../ws/effect-runtime";

export function createSlideStatePlugin(tracingLayer: Layer.Layer<never>) {
  const storeMap = new Map<string, DeckStateInternal>();
  return new Elysia({ name: "slide-state" })
    .decorate("slideStore", storeMap)
    .decorate("slideRuntime", createSlideRuntime(storeMap, tracingLayer));
}
```

### 5.3 — Update `src/index.ts`

- [ ] Full startup flows through a single `Effect.gen` pipeline
- [ ] `loadAppConfig` → `initSentry` → `createTracingLayer` → Elysia app
- [ ] No `process.env`, no side-effectful imports, no module-level mutable state

```typescript
// src/index.ts
import { Elysia } from "elysia";
import { Effect } from "effect";
import { loadAppConfig } from "./config/app-config";
import { initSentry } from "./config/sentry-init";
import { createTracingLayer } from "./config/tracing-layer";
import { createSlideStatePlugin } from "./state/slide-state";
import { agentController } from "./agent/agent-controller";
import { slideWs } from "./ws/slide-ws";

// Single Effect pipeline — all config via Effect Config
const { config, tracingLayer } = await Effect.runPromise(
  Effect.gen(function* () {
    const config = yield* loadAppConfig;
    const sentryEnabled = yield* initSentry(config.sentry);
    const tracingLayer = createTracingLayer(config.sentry, sentryEnabled);
    return { config, tracingLayer };
  })
);

const app = new Elysia()
  .decorate("appConfig", config)
  .use(createSlideStatePlugin(tracingLayer))
  .use(agentController)
  .use(slideWs)
  .get("/", () => ({ status: "ok", service: "@mnestia/server" }))
  .listen({ port: config.port, hostname: config.host });

console.log(
  `🦊 @mnestia/server is running at ${app.server?.hostname}:${app.server?.port}`
);
```

### 5.4 — Validate Runtime

- [ ] Run `bun run typecheck`
- [ ] Start server → confirm no errors
- [ ] Existing WebSocket + Agent functionality still works

---

## Step 6: Add Manual Spans to Transport Handlers

> The domain layer already has auto-spans via `Effect.fn`.
> Now add manual spans to the transport layer for full trace coverage.

### 6.1 — WebSocket Handler Spans (`src/ws/slide-ws.ts`)

- [ ] Wrap the `message` handler pipeline in `Effect.withSpan("ws.message")`
- [ ] Annotate with `ws.event_type` after message validation
- [ ] Annotate with `deck.id` when available

```typescript
// In the message handler pipeline:
const pipeline = Effect.gen(function* () {
  const parsed = yield* parseRawMessage(rawMessage);
  const message = yield* validateMessage(parsed);

  // Annotate the current span with event metadata
  yield* Effect.annotateCurrentSpan("ws.event_type", message.type);
  if ("deckId" in message) {
    yield* Effect.annotateCurrentSpan("deck.id", message.deckId);
  }

  yield* handleMessage(wsSender, message, storeMap);
}).pipe(Effect.withSpan("ws.message"));
```

### 6.2 — Broadcast Span (`src/ws/effect-runtime.ts`)

- [ ] Wrap `broadcastToClients` in `Effect.withSpan("ws.broadcast")`
- [ ] Annotate with `client.count`

```typescript
export function broadcastToClients(
  clients: Map<string, WebSocket>,
  msg: WsOutgoingMessage,
  excludeId?: string
): Effect.Effect<void> {
  const payload = JSON.stringify(msg);
  const targetClients = [...clients.entries()].filter(
    ([id]) => id !== excludeId
  );

  return Effect.forEach(
    targetClients,
    ([, client]) => sendToClient(client, payload),
    { discard: true }
  ).pipe(
    Effect.tap(() =>
      Effect.annotateCurrentSpan("client.count", targetClients.length)
    ),
    Effect.withSpan("ws.broadcast")
  );
}
```

### 6.3 — Agent Controller Span (`src/agent/agent-controller.ts`)

- [ ] Add `Effect.withSpan("agent.chat")` around the chat processing
- [ ] Since the agent handler is async (not pure Effect), wrap the critical
  section in an Effect using `Effect.tryPromise`

```typescript
// Wrap the core logic in an Effect for tracing
const tracedChat = Effect.tryPromise({
  try: async () => {
    const stream = chat({ /* ... */ });
    return toServerSentEventsResponse(stream);
  },
  catch: (error) => error,
}).pipe(
  Effect.tap(() => Effect.annotateCurrentSpan("deck.id", deckId)),
  Effect.tap(() => Effect.annotateCurrentSpan("ai.model", "gpt-4o")),
  Effect.withSpan("agent.chat")
);
```

### 6.4 — Agent Tool Spans (`src/agent/agent-service.ts`)

- [ ] Wrap each tool's `runServiceEffect` call with span annotation
- [ ] Add `tool.name` and `deck.id` annotations

```typescript
// In each tool server implementation, wrap with span:
const effect = Effect.gen(function* () {
  const service = yield* SlideService;
  return yield* service.addSlide(deckId, { content, layout, notes }, position);
}).pipe(
  Effect.tap(() => Effect.annotateCurrentSpan("tool.name", "add_slide")),
  Effect.tap(() => Effect.annotateCurrentSpan("deck.id", deckId)),
  Effect.withSpan("agent.tool.add_slide")
);
```

### 6.5 — Validate Spans

- [ ] Run `bun run typecheck`
- [ ] Start server with `OTEL_CONSOLE_TRACE=true`
- [ ] Send WebSocket messages → see span output in console
- [ ] Confirm span parent-child relationships are correct

---

## Step 7: Error Capture Enhancement

> Ensure Effect's typed errors are properly captured by Sentry with context.

### 7.1 — Capture Effect Errors as Sentry Events

- [ ] Create `src/config/sentry-capture.ts` — thin wrapper around `Sentry.captureException`
- [ ] The helper accepts a `sentryEnabled` flag (from startup pipeline) rather
  than importing module-level state
- [ ] Attach structured context (deckId, slideIndex, etc.) as Sentry extras
- [ ] Call from `formatEffectCause` or a new dedicated error-capture helper

```typescript
// src/config/sentry-capture.ts
import * as Sentry from "@sentry/bun";
import { Cause, Either } from "effect";

export function captureEffectError<E>(
  cause: Cause.Cause<E>,
  sentryEnabled: boolean
): void {
  if (!sentryEnabled) return;

  const either = Cause.failureOrCause(cause);

  Either.match(either, {
    onLeft: (error) => {
      if (typeof error === "object" && error !== null && "_tag" in error) {
        const tagged = error as { _tag: string; [key: string]: unknown };
        Sentry.captureException(new Error(`[${tagged._tag}]`), {
          tags: { "effect.error_tag": tagged._tag },
          extra: { ...tagged },
        });
      }
    },
    onRight: (defectCause) => {
      Sentry.captureException(
        new Error(Cause.pretty(defectCause)),
        { tags: { "effect.error_type": "defect" } }
      );
    },
  });
}
```

> **Note:** `Sentry.captureException` is safe to call even if `Sentry.init()`
> was never called — it simply no-ops. The `sentryEnabled` guard is a
> performance optimization to skip serialization work.

### 7.2 — Wire Error Capture into Handlers

- [ ] Call `captureEffectError` in `slide-ws.ts` when `Exit.isFailure`
- [ ] Call `captureEffectError` in `agent-service.ts` when effect fails
- [ ] Ensure errors are captured with the active span context (automatic via OTEL)

### 7.3 — Validate Error Capture

- [ ] Trigger `DeckNotFoundError` by sending `SYNC_REQUEST` for non-existent deck
- [ ] With `SENTRY_DSN` set, confirm error appears in Sentry Issues
- [ ] Verify error has `deckId` in context and is linked to the trace

---

## Step 8: Testing

> Ensure tracing doesn't break existing tests and add tracing-specific tests.

### 8.1 — Existing Test Compatibility

- [ ] Run `bun test test/` — all existing tests pass
- [ ] Tests should work without `SENTRY_DSN` (tracing disabled = no-op)
- [ ] If `createSlideRuntime` signature changed, update test helpers

### 8.2 — Unit Test: Tracing Layer Creation

- [ ] `test/config/tracing-layer.test.ts`
- [ ] Test `createTracingLayer` with Sentry disabled → returns empty-ish layer
- [ ] Test `createTracingLayer` with console trace enabled → returns layer with ConsoleSpanExporter

### 8.3 — Unit Test: Sentry Config Loading

- [ ] `test/config/sentry-config.test.ts`
- [ ] Test `loadSentryConfig` with no env vars → defaults
- [ ] Test with `SENTRY_DSN` set → Option.some with redacted value
- [ ] Test with `SENTRY_TRACES_SAMPLE_RATE=0.5` → correct number

### 8.4 — Integration Test: Spans Generated

- [ ] Create a test that uses `ConsoleSpanExporter` to capture spans
- [ ] Run a `SlideService.addSlide` operation through the runtime
- [ ] Assert that spans are generated with correct names
- [ ] Assert parent-child span relationships

### 8.5 — Validate All Tests

- [ ] Run `bun test test/` — all tests pass
- [ ] Run `bun run typecheck` — no errors

---

## Step 9: Documentation & Cleanup

### 9.1 — Update README.md

- [ ] Add "Observability" section to `packages/server/README.md`
- [ ] Document environment variables: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`,
  `SENTRY_TRACES_SAMPLE_RATE`, `OTEL_CONSOLE_TRACE`
- [ ] Add quick-start guide for enabling Sentry tracing

### 9.2 — Update AGENTS.md

- [ ] Add observability section to `packages/server/AGENTS.md`
- [ ] Document the tracing layer architecture
- [ ] Document the span naming convention:
  - `ws.message` — WebSocket message handling
  - `ws.broadcast` — WebSocket broadcast
  - `agent.chat` — AI chat request
  - `agent.tool.<name>` — AI tool execution
  - `SlideService.<method>` — auto-generated by Effect.fn

### 9.3 — Code Cleanup

- [ ] Ensure all new files follow kebab-case naming
- [ ] Ensure no barrel imports
- [ ] Run `bun run lint`
- [ ] Run `bun run format`
- [ ] Run `bun run typecheck`

---

## Final File Structure (New/Modified Files)

```
packages/server/src/
├── index.ts                          # Modified — Effect startup pipeline
├── config/
│   ├── app-config.ts                 # Modified — add SentryConfig
│   ├── sentry-config.ts              # NEW — Sentry config via Effect Config
│   ├── sentry-init.ts                # NEW — initSentry as pure Effect
│   ├── sentry-capture.ts             # NEW — error capture helper
│   └── tracing-layer.ts              # NEW — NodeSdk.layer factory
├── state/
│   └── slide-state.ts                # Modified — accept tracing Layer param
├── ws/
│   ├── effect-runtime.ts             # Modified — accept tracing Layer
│   └── slide-ws.ts                   # Modified — add manual spans
├── agent/
│   ├── agent-controller.ts           # Modified — add manual spans
│   └── agent-service.ts              # Modified — add tool spans + error capture

packages/server/test/
├── config/
│   ├── sentry-config.test.ts         # NEW
│   └── tracing-layer.test.ts         # NEW
└── helpers.ts                        # Modified — update for new runtime signature
```

---

## Dependency Graph (Tracing)

```
Effect.gen (index.ts)
    │
    ├── loadAppConfig ← Effect Config (SENTRY_DSN, etc.)
    │
    ├── initSentry(config.sentry) ← Effect.sync → @sentry/bun
    │
    ├── createTracingLayer(config, enabled)
    │       ↓
    │   NodeSdk.layer ← @effect/opentelemetry
    │       ↓
    │   SentrySpanProcessor ← @sentry/opentelemetry
    │
    └── createSlideStatePlugin(tracingLayer)
            ↓
        createSlideRuntime(storeMap, tracingLayer)
            ↓
        ManagedRuntime ← Layer.merge(serviceLayer, tracingLayer)
```

---

## Key Design Decisions

| Decision                                      | Rationale                                                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skipOpenTelemetrySetup: true` in Sentry.init | Effect manages its own OTEL setup via `@effect/opentelemetry`. Letting Sentry also set up OTEL causes duplicate trace providers and conflicts.      |
| All config via Effect `Config` — no `process.env` | Effect `Config` is the canonical way to load env vars. `initSentry` receives a typed `SentryConfig` from the startup pipeline. Zero raw env access. |
| `initSentry` as pure `Effect`, not side-effectful import | Keeps the startup pipeline explicit and testable. No module-level side effects. Config flows in, boolean flows out.                             |
| `createTracingLayer(config, enabled)` — pure function | Receives `sentryEnabled` as argument instead of importing module state. Fully deterministic, easy to test with any config combination.           |
| `createSlideStatePlugin(tracingLayer)` factory | Accepts a pre-built `Layer`, not raw config. Each layer of the stack receives only what it needs — no config parsing deep in the call tree.         |
| `Layer.merge` for tracing + service           | Cleanly composes tracing layer alongside service layer in the same `ManagedRuntime`. No changes to service implementation needed.                   |
| Console exporter behind `OTEL_CONSOLE_TRACE`  | Developers can see spans locally without needing a Sentry account. Useful for debugging span hierarchy.                                             |
| Error capture at transport boundary           | Errors are captured in WS/Agent handlers (where `Exit.isFailure` is checked) rather than inside the Effect service. Keeps domain layer pure.        |
| No changes to `SlideService` or `SlideStore`  | All existing domain code gets tracing for free via `Effect.fn` auto-spans. Zero modifications to business logic.                                    |

---

## Progress Tracker

| Step | Description                       | Status      |
| ---- | --------------------------------- | ----------- |
| 1    | Install dependencies              | ✅ Done |
| 2    | Sentry configuration              | ✅ Done |
| 3    | Sentry initialization             | ✅ Done |
| 4    | OpenTelemetry tracing layer       | ✅ Done |
| 5    | Wire into ManagedRuntime          | ✅ Done |
| 6    | Manual spans on transport handlers | ✅ Done |
| 7    | Error capture enhancement         | ✅ Done |
| 8    | Testing                           | ⬜ Not started |
| 9    | Documentation & cleanup           | ⬜ Not started |