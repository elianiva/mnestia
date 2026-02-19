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
| `AI_MODEL` | No | `gpt-4o` | AI model used by the agent controller |
| `SENTRY_DSN` | For tracing | — | Sentry DSN. If not set, tracing is disabled. |
| `SENTRY_ENVIRONMENT` | No | `dev` | Sentry environment tag |
| `SENTRY_TRACES_SAMPLE_RATE` | No | `1.0` | OpenTelemetry traces sample rate (`0.0`–`1.0`) |
| `OTEL_CONSOLE_TRACE` | No | `false` | Enable console span exporter for local debugging |

All variables are loaded via **Effect Config** at startup — no raw `process.env` access.

## Architecture

The server follows a **hexagonal (ports & adapters) architecture** with clear layer separation:

```
┌─────────────────────────────────────────────────────────────┐
│                      @mnestia/server                        │
│                                                             │
│  infra (framework adapters)                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────┐     │
│  │  WebSocket   │    │   Agent      │    │  Health    │     │
│  │  /ws/slides  │    │  /agent/chat │    │  GET /     │     │
│  └──────┬───────┘    └──────┬───────┘    └────────────┘     │
│         │                   │                               │
│  application (orchestration)│                               │
│  ┌──────▼───────────────────▼──────┐                        │
│  │  ws-handlers · agent-tool-*     │                        │
│  └──────────────┬──────────────────┘                        │
│                 │                                           │
│  domain (ports)─┼──────────────────────────────────┐        │
│  ┌──────────────▼───────────────────────┐          │        │
│  │     SlideService (Context.Tag)       │  ports   │        │
│  │  addSlide · removeSlide · update     │  ────────┤        │
│  │  reorder · changeCurrentSlide        │          │        │
│  │  executeCommand                      │          │        │
│  ├──────────────────────────────────────┤          │        │
│  │     SlideStore (Context.Tag)         │          │        │
│  │  get · set · delete · has · getAll   │          │        │
│  └──────────────┬───────────────────────┘          │        │
│                 │                                  │        │
│  domain (adapters)                                 │        │
│  ┌──────────────▼───────────────────────┐          │        │
│  │  SlideServiceLive (Layer)            │ adapters  │        │
│  │  createSlideStoreLive (Layer)        │ ─────────┘        │
│  │  In-memory Map<deckId, DeckState>    │                   │
│  └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Hexagonal Layers

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| **Domain — Ports** | `domain/ports/` | `Context.Tag` interfaces that define *what* the domain expects (contracts) |
| **Domain — Adapters** | `domain/adapters/` | `Layer` implementations that satisfy ports (*how* it's done) |
| **Domain — Errors** | `domain/slide-errors.ts` | Tagged Effect errors shared across ports and adapters |
| **Application** | `application/` | Orchestration — wires ports to use cases (WS handlers, agent tool wiring) |
| **Infrastructure** | `infra/` | Framework adapters — Elysia HTTP/WS routes, config, tracing, Sentry |
| **Shared** | `shared/` | Cross-cutting utilities (error mapping) |

### Key Design Decisions

- **Effect for domain logic** — typed errors, dependency injection via Layers, composable business logic
- **Ports & Adapters** — domain ports (`Context.Tag`) are separated from their live implementations (`Layer`), making them independently testable and swappable
- **`.decorate()` for shared state** — Elysia `.state()` does not propagate to WebSocket handlers; `.decorate()` does
- **`Map<string, WebSocket>` for clients** — Elysia creates different wrapper objects per handler callback; `ws.id` provides stable identity
- **Valibot + `toStandardJsonSchema()`** — TanStack AI tools use Standard JSON Schema; Valibot's converter provides direct compatibility without Zod
- **All contracts from `@mnestia/schema`** — no duplicated types; WebSocket events, AI commands, and server slide types are shared

## Import Alias

The server uses a **`@/` path alias** that maps to `src/`, configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This eliminates all `../` relative imports. Bun natively resolves `tsconfig.json` `paths` at runtime — no extra plugins needed.

```typescript
// ✅ Use absolute alias
import { SlideService } from "@/domain/ports/slide-service";
import { broadcastToClients } from "@/infra/ws/effect-runtime";

// ❌ Avoid relative parent traversal
import { SlideService } from "../../domain/ports/slide-service";
```

Same-directory `./` imports are fine and don't need the alias.

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
| `ws.message` | `infra/ws/slide-ws.ts` | WebSocket message handling |
| `ws.broadcast` | `infra/ws/effect-runtime.ts` | WebSocket broadcast to clients |
| `agent.chat` | `infra/http/agent-controller.ts` | AI chat request (Sentry native span) |
| `agent.tool.<name>` | `application/agent-tool-factory.ts` | AI tool execution |
| `SlideService.*` | `domain/adapters/slide-service-live.ts` | Auto-generated by `Effect.fn` |

### Span Annotations

| Attribute | Used In | Description |
|-----------|---------|-------------|
| `ws.event_type` | `infra/ws/slide-ws.ts` | Message type (JOIN_ROOM, SLIDE_CHANGE, etc.) |
| `deck.id` | `infra/ws/slide-ws.ts`, `infra/http/agent-controller.ts`, `application/agent-tool-factory.ts` | Deck identifier |
| `client.count` | `infra/ws/effect-runtime.ts` | Number of clients receiving broadcast |
| `ai.model` | `infra/http/agent-controller.ts` | AI model name (configurable via `AI_MODEL` env var) |
| `tool.name` | `application/agent-tool-factory.ts` | Tool name |
| `slide.index` | `application/agent-tool-factory.ts` | Target slide index |
| `slide.from_index` | `application/agent-tool-factory.ts` | Reorder source index |
| `slide.to_index` | `application/agent-tool-factory.ts` | Reorder destination index |
| `message.count` | `infra/http/agent-controller.ts` | Number of chat messages in request |

### Quick Start

1. Copy `.env.example` to `.env`
2. Set `SENTRY_DSN` to your Sentry project DSN
3. Start the server — look for `[sentry] Initialized` in logs
4. For local debugging without Sentry, set `OTEL_CONSOLE_TRACE=true`

### Error Capture

Typed Effect errors (`DeckNotFoundError`, `InvalidSlideIndexError`, etc.) are automatically captured to Sentry with:
- `effect.error_tag` — the error's `_tag` field
- Full error context as Sentry extras

Domain error → WS message mapping is centralized in `shared/errors.ts`:
- `mapDomainErrorToMessage(error)` — human-readable error string
- `mapDomainErrorToCode(error)` — stable error code (e.g. `DECK_NOT_FOUND`)
- `mapDomainErrorToWsMessage(error)` — full `WsOutgoingMessage` of type `ERROR`

## Project Structure

```
src/
├── index.ts                           # Entry point — Effect startup pipeline
├── shared/
│   └── errors.ts                      # Domain error → WS message / code mappers
├── domain/
│   ├── slide-errors.ts                # Tagged Effect errors (shared by ports & adapters)
│   ├── ports/
│   │   ├── slide-service.ts           # SlideService Context.Tag (port interface)
│   │   └── slide-store.ts             # SlideStore Context.Tag + DeckStateInternal (port interface)
│   └── adapters/
│       ├── slide-service-live.ts      # SlideServiceLive Layer (adapter implementation)
│       └── slide-store-live.ts        # createSlideStoreLive (adapter implementation)
├── application/
│   ├── agent-tool-executor.ts         # Generic runToolEffect + result types
│   ├── agent-tool-factory.ts          # createAgentTools (wired to executor)
│   └── ws-handlers.ts                 # JOIN_ROOM / SLIDE_CHANGE / SYNC_REQUEST handlers
└── infra/
    ├── config/
    │   ├── app-config.ts              # AppConfig via Effect Config (incl. aiModel)
    │   ├── sentry-config.ts           # SentryConfig via Effect Config
    │   ├── sentry-init.ts             # Sentry.init() as pure Effect
    │   ├── sentry-capture.ts          # Effect error → Sentry capture helper
    │   ├── tracing-layer.ts           # NodeSdk.layer factory (OTEL bridge)
    │   └── slide-state.ts             # Elysia .decorate() plugin (accepts tracing layer)
    ├── http/
    │   ├── agent-controller.ts        # POST /agent/chat route (with Sentry span)
    │   └── agent-tools.ts             # TanStack AI tool definitions (schemas)
    └── ws/
        ├── slide-ws.ts                # Elysia WS wiring (parse → validate → dispatch)
        └── effect-runtime.ts          # ManagedRuntime factory + broadcast helper

test/
├── helpers.ts                         # Shared test utilities (seedDeck, expectSuccess, etc.)
├── domain/
│   └── slide-service.test.ts          # Domain unit tests via Effect layers
├── agent/
│   ├── agent-service.test.ts          # Agent tool server implementations
│   └── agent-controller.test.ts       # HTTP endpoint structure + API key validation
├── ws/
│   └── slide-ws.test.ts               # WebSocket integration tests
└── config/
    ├── sentry-config.test.ts          # SentryConfig loading via Effect Config
    ├── tracing-layer.test.ts          # Layer creation + span generation
    └── tracing-integration.test.ts    # Spans through full service runtime
```

Shared contracts live in the workspace package:

```
../schema    # @mnestia/schema — WebSocket events, AI commands, server slide types
```

## Testing

```bash
# Run all server tests
bun test

# Run specific test file
bun test slide-service
bun test slide-ws
bun test agent-controller
bun test agent-service
bun test sentry-config
bun test tracing-layer
bun test tracing-integration
```

**136 tests** across 7 files:

| File | Tests | Description |
|------|------:|-------------|
| `domain/slide-service.test.ts` | 53 | Domain unit tests — all SlideService operations via Effect layers |
| `agent/agent-service.test.ts` | 34 | Agent tool server implementations, cross-tool integration, tool metadata |
| `ws/slide-ws.test.ts` | 14 | WebSocket integration — JOIN_ROOM, SLIDE_CHANGE, SYNC_REQUEST, error handling, connection lifecycle |
| `agent/agent-controller.test.ts` | 12 | HTTP endpoint structure, API key validation, request body handling |
| `config/sentry-config.test.ts` | 9 | SentryConfig loading via Effect Config with various env combinations |
| `config/tracing-layer.test.ts` | 9 | Layer creation, span generation, span annotations |
| `config/tracing-integration.test.ts` | 5 | Spans through full service runtime, parent-child relationships |

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