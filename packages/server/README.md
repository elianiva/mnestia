# @mnestia/server

Backend realtime slide system built with **Elysia** (REST + WebSocket), **Effect** (functional domain layer), and **TanStack AI** (agent-driven slide manipulation).

## Quick Start

```bash
# Install dependencies (from monorepo root)
bun install

# Development (with hot reload)
bun run dev

# Build
bun run build

# Run tests
bun test

# Type check
bun run typecheck
```

The server starts at **http://localhost:3000** by default.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Port the server listens on |
| `HOST` | No | `localhost` | Hostname the server binds to |
| `OPENAI_API_KEY` | For AI features | — | OpenAI API key for the AI agent. Without it, `POST /agent/chat` returns `503`. |
| `SENTRY_DSN` | For tracing | — | Sentry DSN. If not set, tracing is disabled. |
| `SENTRY_ENVIRONMENT` | No | `dev` | Sentry environment tag |
| `SENTRY_TRACES_SAMPLE_RATE` | No | `1.0` | OpenTelemetry traces sample rate (`0.0`–`1.0`) |
| `OTEL_CONSOLE_TRACE` | No | `false` | Enable console span exporter for local debugging |

All variables are loaded via **Effect Config** at startup — no raw `process.env` access.

## Architecture

Two independent flows handle realtime sync and AI-driven mutation:

```
┌─────────────────────────────────────────────────────────┐
│                   @mnestia/server                       │
│                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │  WebSocket   │    │   Agent      │    │  Health    │  │
│  │  /ws/slides  │    │  /agent/chat │    │  GET /     │  │
│  └──────┬───────┘    └──────┬───────┘    └────────────┘  │
│         │                   │                            │
│         ▼                   ▼                            │
│  ┌──────────────────────────────────────┐                │
│  │       SlideService (Effect)          │                │
│  │  addSlide · removeSlide · update     │                │
│  │  reorder · changeCurrentSlide        │                │
│  │  executeCommand                      │                │
│  └──────────────┬───────────────────────┘                │
│                 │                                        │
│  ┌──────────────▼───────────────────────┐                │
│  │       SlideStore (Effect Tag)        │                │
│  │  In-memory Map<deckId, DeckState>    │                │
│  └──────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Effect for domain logic** — typed errors, dependency injection via Layers, composable business logic
- **`.decorate()` for shared state** — Elysia `.state()` does not propagate to WebSocket handlers; `.decorate()` does
- **`Map<string, WebSocket>` for clients** — Elysia creates different wrapper objects per handler callback; `ws.id` provides stable identity
- **Valibot + `toStandardJsonSchema()`** — TanStack AI tools use Standard JSON Schema; Valibot's converter provides direct compatibility without Zod
- **All contracts from `@mnestia/schema`** — no duplicated types; WebSocket events, AI commands, and server slide types are shared

## API Reference

### `GET /`

Health check endpoint.

**Response:**
```json
{ "status": "ok", "service": "@mnestia/server" }
```

### `POST /agent/chat`

AI-powered slide manipulation via TanStack AI streaming.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Add a title slide about TypeScript" }
  ],
  "deckId": "my-presentation"
}
```

**Response:** Server-Sent Events (SSE) stream with AI responses and tool call results.

**Status codes:**
- `200` — Streaming response
- `503` — `OPENAI_API_KEY` not configured

**Available AI tools:**
| Tool | Description |
|------|-------------|
| `add_slide` | Add a new slide (content, layout, notes, position) |
| `remove_slide` | Remove a slide by index |
| `update_slide` | Update content, layout, or notes of a slide |
| `reorder_slides` | Move a slide from one position to another |
| `change_current_slide` | Navigate to a specific slide |

### `WS /ws/slides`

WebSocket endpoint for realtime slide synchronization.

#### Incoming Messages

**JOIN_ROOM** — Join a deck room (creates deck if it doesn't exist):
```json
{ "type": "JOIN_ROOM", "deckId": "my-deck" }
```

**SLIDE_CHANGE** — Navigate to a slide (broadcasts to all clients):
```json
{ "type": "SLIDE_CHANGE", "deckId": "my-deck", "slideIndex": 2 }
```

**SYNC_REQUEST** — Request current deck state:
```json
{ "type": "SYNC_REQUEST", "deckId": "my-deck" }
```

#### Outgoing Messages

**SYNC_STATE** — Full deck state (sent on join and sync request):
```json
{
  "type": "SYNC_STATE",
  "deckId": "my-deck",
  "state": {
    "currentSlide": 0,
    "slides": [
      { "id": "abc-123", "index": 0, "content": "Hello", "layout": "default" }
    ]
  }
}
```

**SLIDE_CHANGE** — Broadcast slide navigation:
```json
{ "type": "SLIDE_CHANGE", "deckId": "my-deck", "slideIndex": 2 }
```

**SLIDE_UPDATED** — Broadcast after AI mutation:
```json
{
  "type": "SLIDE_UPDATED",
  "deckId": "my-deck",
  "state": { "currentSlide": 0, "slides": [...] }
}
```

**ERROR** — Error response:
```json
{ "type": "ERROR", "message": "Deck not found: xyz", "code": "DECK_NOT_FOUND" }
```

## Observability

Tracing is built on the **Effect → OpenTelemetry → Sentry** pipeline:

```
Effect.withSpan / Effect.fn (auto-spans)
        ↓
@effect/opentelemetry (NodeSdk bridge)
        ↓
OpenTelemetry SpanProcessor
        ↓
┌───────────────────┬──────────────────────┐
│ SentrySpanProcessor │ ConsoleSpanExporter  │
│ (when SENTRY_DSN    │ (when OTEL_CONSOLE_  │
│  is set)            │  TRACE=true)         │
└───────────────────┴──────────────────────┘
```

### Span Naming Convention

| Span | Source | Description |
|------|--------|-------------|
| `ws.message` | `slide-ws.ts` | WebSocket message handling |
| `ws.broadcast` | `effect-runtime.ts` | WebSocket broadcast to clients |
| `agent.chat` | `agent-controller.ts` | AI chat request (Sentry native span) |
| `agent.tool.add_slide` | `agent-service.ts` | AI tool: add slide |
| `agent.tool.remove_slide` | `agent-service.ts` | AI tool: remove slide |
| `agent.tool.update_slide` | `agent-service.ts` | AI tool: update slide |
| `agent.tool.reorder_slides` | `agent-service.ts` | AI tool: reorder slides |
| `agent.tool.change_current_slide` | `agent-service.ts` | AI tool: change slide |
| `SlideService.*` | `slide-layer.ts` | Auto-generated by `Effect.fn` |

### Quick Start

1. Copy `.env.example` to `.env`
2. Set `SENTRY_DSN` to your Sentry project DSN
3. Start the server — look for `[sentry] Initialized` in logs
4. For local debugging without Sentry, set `OTEL_CONSOLE_TRACE=true`

### Error Capture

Typed Effect errors (`DeckNotFoundError`, `InvalidSlideIndexError`, etc.) are automatically captured to Sentry with:
- `effect.error_tag` — the error's `_tag` field
- Full error context as Sentry extras

## Project Structure

```
src/
├── index.ts                      # Entry point — Effect startup pipeline
├── config/
│   ├── app-config.ts             # AppConfig via Effect Config
│   ├── sentry-config.ts          # SentryConfig via Effect Config
│   ├── sentry-init.ts            # Sentry.init() as pure Effect
│   ├── sentry-capture.ts         # Effect error → Sentry capture helper
│   └── tracing-layer.ts          # NodeSdk.layer factory (OTEL bridge)
├── state/
│   └── slide-state.ts            # Elysia .decorate() plugin (accepts tracing layer)
├── domain/
│   ├── slide-errors.ts           # Tagged Effect errors
│   ├── slide-store.ts            # SlideStore Context.Tag
│   ├── slide-service.ts          # SlideService Context.Tag
│   └── slide-layer.ts            # Live layer implementations
├── ws/
│   ├── slide-ws.ts               # WebSocket handler (with spans)
│   └── effect-runtime.ts         # Effect → Promise bridge (with broadcast span)
└── agent/
    ├── agent-tools.ts            # TanStack AI tool definitions
    ├── agent-service.ts          # Tool server implementations (with tool spans)
    └── agent-controller.ts       # POST /agent/chat route (with Sentry span)
```

## Testing

```bash
# Run all server tests
bun test

# Run specific test file
bun test slide-service
bun test slide-ws
bun test agent-controller
```

**Test coverage:**
- **52** domain unit tests (SlideService via Effect layers)
- **14** WebSocket integration tests (JOIN_ROOM, SLIDE_CHANGE, SYNC_REQUEST, error handling, connection lifecycle)
- **34** agent tests (tool server implementations, endpoint structure, API key validation)
- **9** config tests (SentryConfig loading via Effect Config)
- **8** tracing layer tests (layer creation, span generation, annotations)
- **5** tracing integration tests (spans through full service runtime, parent-child relationships)

## Dependencies

| Package | Purpose |
|---------|---------|
| `elysia` | Web framework (REST + WebSocket) |
| `effect` | Functional domain layer, typed errors, DI |
| `@effect/platform` | Effect platform utilities |
| `@tanstack/ai` | AI agent framework |
| `@tanstack/ai-openai` | OpenAI adapter for TanStack AI |
| `valibot` | Schema validation |
| `@valibot/to-json-schema` | Valibot → Standard JSON Schema conversion |
| `@mnestia/schema` | Shared type contracts (workspace) |
| `@mnestia/core` | Core deck store (workspace) |
| `@sentry/bun` | Sentry SDK for Bun runtime |
| `@sentry/opentelemetry` | SentrySpanProcessor for span export |
| `@effect/opentelemetry` | Effect ↔ OpenTelemetry bridge (NodeSdk) |
| `@opentelemetry/sdk-trace-base` | Base span processor + exporter types |
| `@opentelemetry/sdk-trace-node` | Node/Bun-compatible tracer provider |
| `@opentelemetry/api` | OpenTelemetry API (peer dependency) |