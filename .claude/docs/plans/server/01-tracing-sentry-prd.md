# PRD: Effect Tracing with Sentry Integration

## Document Info

| Field       | Value                                    |
| ----------- | ---------------------------------------- |
| Package     | `@mnestia/server`                        |
| Status      | Draft                                    |
| Priority    | High                                     |
| Depends On  | `00-initial-implementation.md` (✅ Done) |

---

## 1. Problem Statement

The `@mnestia/server` package currently has **zero observability infrastructure**. When issues occur in production — whether in WebSocket message handling, AI agent tool execution, or Effect domain operations — there is no way to:

- Trace the full lifecycle of a request across service boundaries
- Correlate errors with the operations that caused them
- Measure performance of individual operations (slide mutations, AI chat roundtrips, WebSocket broadcasts)
- Get alerted when failures spike or latency degrades

The server already uses **Effect** for all domain logic, and Effect has first-class support for tracing via `Effect.withSpan`, `Effect.fn` (which auto-creates spans), and `@effect/opentelemetry`. This is a natural integration point.

**Sentry** is chosen as the observability backend because:

- It provides error tracking, performance monitoring, and tracing in one platform
- `@sentry/opentelemetry` provides a `SentrySpanProcessor` that plugs directly into Effect's OpenTelemetry bridge
- `@sentry/bun` provides native Bun runtime support
- No self-hosted infrastructure required (unlike Grafana/Tempo/Prometheus stack)

---

## 2. Goals

### Primary

1. **Distributed tracing** — Every Effect operation produces OpenTelemetry spans, exported to Sentry via `SentrySpanProcessor`
2. **Error correlation** — Effect's typed errors (`DeckNotFoundError`, `InvalidSlideIndexError`, etc.) appear as Sentry issues with full trace context
3. **Performance monitoring** — Track latency of WebSocket message handling, AI agent tool calls, and SlideService operations
4. **Zero-config for developers** — Tracing is automatically active when `SENTRY_DSN` is set; no code changes needed in domain logic

### Secondary

5. **Span annotations** — Enrich spans with contextual metadata (deckId, slideIndex, WebSocket client count, AI model used)
6. **Graceful degradation** — Server works identically when `SENTRY_DSN` is not configured (no Sentry, no crash)
7. **Dev-mode console tracing** — Optional console span exporter for local development without Sentry

### Non-Goals

- Frontend (web package) tracing — out of scope for this plan
- Custom Sentry dashboards or alert rules — infrastructure concern, not code
- Log aggregation via Sentry Logs — future consideration
- Metrics export (Prometheus/OpenTelemetry metrics) — future consideration

---

## 3. Current Architecture

### Effect Runtime Flow

```
Elysia Handler (WS / REST)
    ↓
ManagedRuntime.runPromiseExit(pipeline)
    ↓
Effect.gen → SlideService → SlideStore
    ↓
Result / Error
```

The `ManagedRuntime` is created once at startup in `src/ws/effect-runtime.ts`:

```
createSlideRuntime(storeMap) → ManagedRuntime<SlideService, never>
```

This runtime is shared across all WebSocket and agent handlers via Elysia's `.decorate()`.

### Key Observation

Effect's `Effect.fn()` already auto-creates spans for every service method (e.g., `SlideService.getDeck`, `SlideService.addSlide`). These spans are **already being generated** but are currently discarded because no tracer provider is configured. Wiring up `@effect/opentelemetry` with `SentrySpanProcessor` will immediately surface all existing spans.

---

## 4. Proposed Architecture

### Layer Composition

```
                    ┌─────────────────────────┐
                    │   NodeSdk.layer          │
                    │  (OpenTelemetry bridge)  │
                    │                          │
                    │  spanProcessor:          │
                    │    SentrySpanProcessor   │
                    │                          │
                    │  resource:               │
                    │    serviceName:           │
                    │    "@mnestia/server"      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   ManagedRuntime          │
                    │                          │
                    │  SlideServiceLive         │
                    │    ← SlideStoreLive       │
                    │    ← NodeSdk.layer        │
                    └──────────────────────────┘
```

### Initialization Order

All config flows through Effect `Config` — no raw `process.env` anywhere.

1. `loadAppConfig` — Effect `Config` loads all env vars (including `SENTRY_DSN`, sample rate, etc.)
2. `initSentry(config.sentry)` — Pure Effect that calls `Sentry.init()` with loaded config
3. Create `NodeSdkLive` layer with `SentrySpanProcessor`
4. Provide `NodeSdkLive` to the `ManagedRuntime` alongside `SlideServiceLive`
5. All Effect operations now emit spans → Sentry

```
// Startup pipeline (all Effect)
const config = await Effect.runPromise(
  Effect.gen(function* () {
    const cfg = yield* loadAppConfig;   // Step 1: Effect Config
    yield* initSentry(cfg.sentry);      // Step 2: Sentry.init as Effect
    return cfg;
  })
);
// Steps 3-5 happen during Elysia app construction
```

### Span Hierarchy (Example: WebSocket SLIDE_CHANGE)

```
[ws.message]                          ← root span (manual, Elysia handler)
  ├── [parseRawMessage]               ← child span
  ├── [validateMessage]               ← child span
  └── [SlideService.changeCurrentSlide] ← auto-span from Effect.fn
       ├── [SlideService.getDeckOrFail] ← auto-span
       │    └── [SlideStore.get]       ← child span
       └── [SlideStore.set]           ← child span
```

### Span Hierarchy (Example: AI Agent Tool Call)

```
[POST /agent/chat]                    ← root span (manual, Elysia handler)
  └── [agent.addSlide]                ← tool execution span
       └── [SlideService.addSlide]    ← auto-span from Effect.fn
            ├── [SlideService.getDeckOrFail]
            └── [SlideStore.set]
```

---

## 5. Configuration

### Environment Variables

| Variable              | Required | Default | Description                                    |
| --------------------- | -------- | ------- | ---------------------------------------------- |
| `SENTRY_DSN`          | No       | —       | Sentry DSN. Tracing disabled if not set.       |
| `SENTRY_ENVIRONMENT`  | No       | `dev`   | Environment tag (`dev`, `staging`, `prod`)      |
| `SENTRY_TRACES_SAMPLE_RATE` | No | `1.0`   | Fraction of traces to sample (0.0–1.0)         |
| `OTEL_CONSOLE_TRACE`  | No       | `false` | Enable console span exporter for local dev     |

All config loaded via Effect `Config` module, consistent with existing `loadAppConfig`.

---

## 6. What Gets Traced

### Automatic (via Effect.fn)

Every `SlideService` method already uses `Effect.fn("SlideService.methodName")`, which auto-creates a span. These will appear in Sentry without code changes once the tracer is wired:

- `SlideService.getOrCreateDeck`
- `SlideService.getDeck`
- `SlideService.addSlide`
- `SlideService.removeSlide`
- `SlideService.updateSlide`
- `SlideService.reorderSlides`
- `SlideService.changeCurrentSlide`
- `SlideService.executeCommand`
- `SlideService.getDeckOrFail` (internal)

### Manual Spans (to add)

| Span Name                  | Location                      | Annotations                              |
| -------------------------- | ----------------------------- | ---------------------------------------- |
| `ws.message`               | `slide-ws.ts` message handler | `ws.event_type`, `deck.id`               |
| `ws.broadcast`             | `effect-runtime.ts`           | `deck.id`, `client.count`                |
| `agent.chat`               | `agent-controller.ts`         | `deck.id`, `ai.model`                    |
| `agent.tool.<name>`        | `agent-service.ts`            | `tool.name`, `deck.id`                   |

### Error Capture

Effect's tagged errors will be captured as Sentry issues when they cause span failures:

- `DeckNotFoundError` → Sentry issue with `deckId` context
- `SlideNotFoundError` → Sentry issue with `deckId`, `slideIndex`
- `InvalidSlideIndexError` → Sentry issue with `deckId`, `slideIndex`, `totalSlides`
- `SlideOperationError` → Sentry issue with `operation`, `reason`
- `WsMessageError` → Sentry issue with `message`

---

## 7. Dependencies

### New Packages

| Package                           | Version    | Purpose                                      |
| --------------------------------- | ---------- | -------------------------------------------- |
| `@sentry/bun`                     | `^10.x`   | Sentry SDK for Bun runtime                   |
| `@sentry/opentelemetry`           | `^10.x`   | `SentrySpanProcessor` for OpenTelemetry      |
| `@effect/opentelemetry`           | `^0.x`    | Effect ↔ OpenTelemetry bridge                |
| `@opentelemetry/sdk-trace-base`   | `^1.x`    | Base tracing SDK (required by @effect/opentelemetry) |
| `@opentelemetry/sdk-trace-node`   | `^1.x`    | Node/Bun tracer provider                     |

### Peer Dependencies (auto-installed)

| Package                | Notes                                        |
| ---------------------- | -------------------------------------------- |
| `@opentelemetry/api`   | Peer dep of `@effect/opentelemetry`          |

### Existing Packages (no changes)

- `effect` — already installed
- `@effect/platform` — already installed
- `@effect/platform-bun` — already installed
- `elysia` — already installed

---

## 8. Success Criteria

1. **Spans visible in Sentry** — After setting `SENTRY_DSN`, starting the server, and triggering a WebSocket `JOIN_ROOM` + `SLIDE_CHANGE`, corresponding traces appear in Sentry's Traces view
2. **Error issues created** — Triggering a `DeckNotFoundError` (e.g., `SYNC_REQUEST` on non-existent deck) creates a Sentry issue with full stack trace and span context
3. **No regression** — All existing tests pass. Server starts and operates normally without `SENTRY_DSN` set
4. **Performance overhead** — Negligible (<5ms) added latency per operation when tracing is enabled
5. **Agent tracing** — AI tool calls show up as child spans under the `/agent/chat` root span

---

## 9. Risks & Mitigations

| Risk                                               | Mitigation                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `@sentry/bun` may have Bun compatibility issues    | Pin to tested version; fall back to `@sentry/node` if needed       |
| OpenTelemetry SDK may conflict with Sentry's auto-instrumentation | Use Sentry's own OTEL setup, disable auto-instrumentation if needed |
| Span volume too high in production                  | Use `SENTRY_TRACES_SAMPLE_RATE` to control sampling                |
| `ManagedRuntime` layer change may break existing tests | Provide NodeSdk layer conditionally; tests don't need tracing       |

---

## 10. Future Considerations

- **Structured logging** — Route Effect's `Effect.log` to Sentry Logs (when GA)
- **Metrics** — Export Effect metrics (operation counts, error rates) via OpenTelemetry to Sentry
- **Frontend tracing** — Connect web package traces to server traces via trace propagation headers
- **Custom Sentry alerts** — Set up alerts for error rate spikes on specific operations
- **AI agent monitoring** — Use Sentry's AI Agent Monitoring feature for deeper LLM observability