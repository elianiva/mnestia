# @mnestia/server – Global Architecture Specification

Backend realtime slide system built with **Elysia (REST + WebSocket)** inside a **Moon-managed monorepo**, integrating:

- Pi RPC (AI agent layer via subprocess)
- Effect (functional core / domain logic discipline)

Deck management via REST is intentionally skipped for now.
Focus: realtime sync + AI-driven slide mutation structure.

---

# 1. Scope (Current Phase)

Active:

- WebSocket realtime slide synchronization
- Shared in-memory state using Elysia `.state()`
- AI Agent integration (Pi RPC subprocess)
- Effect-based domain architecture
- SPA-compatible architecture

Skipped:

- Deck CRUD
- Database persistence
- Storage layer

Structure first. Features later.

---

# 2. Monorepo (Moon) Architecture

This project is part of a **Moon monorepo**.

Shared contracts are located at:

```
../schema
```

Rules:

- All WebSocket event contracts must come from `../schema`
- All AI command types must come from `../schema`
- No duplicated types inside this package
- Dependency must be declared in Moon workspace config
- Respect Moon dependency graph boundaries

Moon handles:

- Task orchestration
- Caching
- Affected builds
- Dependency graph integrity

---

# 3. External Architectural References

## Pi RPC

Pi is used as an AI coding agent via its RPC mode (`pi --mode rpc --no-session`).
Communication: JSON lines over stdin/stdout of a spawned child process.

Used for:

- Agent-based chat interaction
- Structured AI outputs (SlideCommand JSON)
- Streaming text deltas back to client via SSE

---

## Effect

https://effect.website/
https://effect.website/docs/code-style/guidelines/
https://ethanniser.dev/blog/effect-best-practices/

Effect is used for:

- Functional domain layer
- Controlled side effects
- Typed error handling
- Composable business logic
- Dependency injection via Layer pattern

All domain logic must follow Effect best practices.

---

## Architectural Inspiration

Reference project:

https://github.com/SyahrulBhudiF/DualCam-Studio/tree/query

This project informs:

- Effect usage structure
- Layer composition
- Service pattern organization
- Domain-first architecture

---

# 4. High-Level System Architecture

Two independent flows:

## A. Realtime Slide Sync

Client (Presenter / Viewer)
    ↓
WebSocket
    ↓
Elysia Shared State
    ↓
Broadcast to Clients

## B. AI Agent Slide Manipulation

Chat UI
    ↓
POST /agent/chat
    ↓
Agent Controller
    ↓
Pi RPC subprocess (pi --mode rpc --no-session)
    ↓
Structured SlideCommand JSON (```json fenced blocks)
    ↓
parseSlideCommands → executeSlideCommands
    ↓
Slide Service (Effect)
    ↓
State Update
    ↓
WebSocket Broadcast

AI never mutates state directly.
All state changes go through Slide Service (Effect-based).

---

# 5. State Management (Elysia `.state()`)

Use `.decorate()` pattern (not `.state()`) — Elysia `.state()` does not propagate to WebSocket handlers.

Access (REST handlers):

```
(ctx as unknown as { slideStore: Map<string, DeckStateInternal> }).slideStore
```

Access (WebSocket handlers):

```
(ws.data as unknown as { slideStore: Map<string, DeckStateInternal> }).slideStore
```

Decorator key:

```
slideStore
```

Structure:

```
Map<deckId, DeckStateInternal>
```

DeckStateInternal:

- currentSlide: number
- slides: ServerSlide[]
- clients: Map<string, WebSocket> (keyed by ws.id for stable identity across Elysia WS handler callbacks)

**Important:** Elysia creates different wrapper objects for the same WebSocket connection across `open`, `message`, and `close` handlers. Use `ws.id` (stable string) as the key for client tracking — never use object reference equality (`Set<WebSocket>`).

Constraints:

- In-memory only
- One isolated state per deck
- No global variables
- No module-level mutable state
- All mutation through Slide Service (Effect)
- Must align with types from `../schema`

---

# 6. WebSocket Contract

Defined strictly in `../schema`.

Incoming:

- JOIN_ROOM
- SLIDE_CHANGE
- SYNC_REQUEST

Outgoing:

- SLIDE_CHANGE
- SYNC_STATE
- SLIDE_UPDATED

WebSocket layer must:

- Parse message
- Validate using shared schema
- Call Slide Service (Effect program)
- Broadcast result

WebSocket must NOT:

- Contain business rules
- Directly mutate state
- Define inline domain types

---

# 7. AI Agent Integration (Pi RPC)

The AI agent runs as a Pi subprocess in RPC mode.
`PiRpcClient` manages the child process lifecycle (spawn, stdin/stdout JSON lines, kill).

Architecture:

- `pi-rpc-client.ts` — spawns `pi --mode rpc --no-session`, sends/receives JSON lines
- `agent-service.ts` — parses SlideCommand JSON from agent text, executes via SlideService
- `agent-controller.ts` — POST /agent/chat endpoint, streams text deltas as SSE, extracts commands on agent_end

Config: `PI_PROVIDER` and `PI_MODEL` env vars (optional, uses pi defaults).

Agent must output structured command format defined in `../schema` as ```json fenced blocks.

---

# 8. Agent Flow Specification

1. Client sends chat message to POST /agent/chat
2. Agent controller builds system prompt with SLIDE_TOOL_DESCRIPTIONS + deck context
3. Pi RPC subprocess receives prompt
4. Pi streams text_delta events → SSE to client
5. On agent_end: extract ```json blocks from full response text
6. Validate each against SlideCommandSchema (valibot)
7. Execute via SlideService (Effect)
8. Update state
9. Broadcast via WebSocket
10. Send SSE command execution results + done event

Agent must not:

- Access `ctx.store` directly
- Bypass Effect service
- Implement business logic inline

---

# 9. Slide Service (Effect Domain Layer)

Slide Service is implemented using Effect.

Responsibilities:

- Add slide
- Remove slide
- Update slide content
- Reorder slides
- Change current slide

Design rules (Effect):

- Pure domain logic
- Side effects wrapped in Effect
- Typed errors
- Use Layer for dependency injection
- No direct global access

Follow:

- Effect code style guidelines
- Effect best practices blog
- DualCam-Studio structural approach

---

# 10. Folder Structure

```
src/
  index.ts
  config/
    app-config.ts
    sentry-config.ts
    sentry-init.ts
    sentry-capture.ts
    tracing-layer.ts
  ws/
    slide-ws.ts
    effect-runtime.ts
  state/
    slide-state.ts
  domain/
    slide-service.ts
    slide-store.ts
    slide-errors.ts
    slide-layer.ts
  agent/
    agent-controller.ts
    agent-service.ts
    pi-rpc-client.ts
```

Shared contracts:

```
../schema
```

---

# 11. Registration Order

1. Load `AppConfig` via Effect Config (includes `SentryConfig`)
2. Initialize Sentry via `initSentry(config.sentry)` (pure Effect, no `process.env`)
3. Create tracing layer via `createTracingLayer(config.sentry, sentryEnabled)`
4. Register `.decorate()` with `createSlideStatePlugin(tracingLayer)`
5. Register agent routes
6. Register WebSocket handler
7. Start server

Effect layers and tracing must be initialized before transport handlers.

---

# 12. Naming Convention

Files: kebab-case
Types: PascalCase (from `../schema`)
WS events: UPPER_SNAKE_CASE
Effect services: `*Service`
Effect layers: `*Layer`
Agent modules: `agent-*`

---

# 13. Development Constraints

- No deck CRUD for now
- No database layer
- No duplicated schema types
- No global mutable module-level state
- All slide mutation via Effect service
- Agent outputs structured commands only
- WebSocket broadcasts after successful Effect execution
- Must comply with Effect code-style guidelines
- Respect Moon workspace boundaries

---

# 14. Observability (Effect → OpenTelemetry → Sentry)

Tracing pipeline: Effect auto-spans (`Effect.fn`) and manual spans (`Effect.withSpan`)
flow through `@effect/opentelemetry` (NodeSdk bridge) to OpenTelemetry span processors
(SentrySpanProcessor for production, ConsoleSpanExporter for local dev).

## Config Modules

| Module | Purpose |
|--------|---------|
| `sentry-config.ts` | `SentryConfig` interface + `loadSentryConfig` via Effect `Config` |
| `sentry-init.ts` | `initSentry(config)` — pure Effect, calls `Sentry.init()` when DSN present |
| `tracing-layer.ts` | `createTracingLayer(config, sentryEnabled)` — returns `NodeSdk.layer` or `NodeSdk.layerEmpty` |
| `sentry-capture.ts` | `captureEffectError(cause)` — sends typed Effect errors to Sentry |

## Span Naming Convention

| Span | Source | Description |
|------|--------|-------------|
| `ws.message` | `slide-ws.ts` | WebSocket message handling |
| `ws.broadcast` | `effect-runtime.ts` | WebSocket broadcast to clients |
| `agent.chat` | `agent-controller.ts` | AI chat request (Sentry native span) |
| `agent.tool.<name>` | `agent-service.ts` | AI tool execution |
| `SlideService.*` | `slide-layer.ts` | Auto-generated by `Effect.fn` |

## Span Annotations

| Attribute | Used In | Description |
|-----------|---------|-------------|
| `ws.event_type` | `ws.message` | Message type (JOIN_ROOM, SLIDE_CHANGE, etc.) |
| `deck.id` | `ws.message`, `agent.chat`, `agent.tool.*` | Deck identifier |
| `client.count` | `ws.broadcast` | Number of clients receiving broadcast |
| `ai.model` | `agent.chat` | AI model name |
| `tool.name` | `agent.tool.*` | Tool name |
| `slide.index` | `agent.tool.*` | Target slide index |

## Error Capture

Typed Effect errors are captured to Sentry via `captureEffectError(cause)`:
- Tagged errors (`_tag` field) → Sentry exception with `effect.error_tag` tag + full context as extras
- Defects → Sentry exception with `effect.error_type: "defect"` tag
- Called automatically from WS handler (`slide-ws.ts`) and agent service (`agent-service.ts`) on failure

## Key Design Rules

- **No `process.env`** — all config via Effect `Config` (loaded in startup pipeline)
- **`initSentry` is a pure Effect** — receives `SentryConfig`, not env vars
- **`createTracingLayer` is a pure function** — receives config + boolean, returns Layer
- **`skipOpenTelemetrySetup: true`** in Sentry init — Effect manages its own OTEL via `@effect/opentelemetry`
- **Tracing layer passed explicitly** — injected into `ManagedRuntime` via `createSlideStatePlugin(tracingLayer)`

---

# 15. Future Extensions

Later:

- Persistence layer (Effect-powered)
- Redis-backed distributed state
- Collaborative locks
- AI streaming responses
- Versioning & history
- Audit trail for AI commands

---

# 16. Default Server

http://localhost:3000

<!-- effect-solutions:start -->
## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `.reference/effect/` for real implementations (run `effect-solutions setup` first)

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.
<!-- effect-solutions:end -->
