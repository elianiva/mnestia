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

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | For AI features | OpenAI API key for the AI agent. Without it, `POST /agent/chat` returns `503`. |

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

## Project Structure

```
src/
├── index.ts                      # Entry point — wiring & boot
├── state/
│   └── slide-state.ts            # Elysia .decorate() plugin
├── domain/
│   ├── slide-errors.ts           # Tagged Effect errors
│   ├── slide-store.ts            # SlideStore Context.Tag
│   ├── slide-service.ts          # SlideService Context.Tag
│   ├── slide-layer.ts            # Live layer implementations
│   └── slide-service.test.ts     # Domain unit tests (47 tests)
├── ws/
│   ├── slide-ws.ts               # WebSocket handler
│   ├── effect-runtime.ts         # Effect → Promise bridge
│   └── slide-ws.test.ts          # WS integration tests (14 tests)
└── agent/
    ├── agent-tools.ts            # TanStack AI tool definitions
    ├── agent-service.ts          # Tool server implementations
    ├── agent-controller.ts       # POST /agent/chat route
    └── agent-controller.test.ts  # Agent integration tests (6 tests)
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
- **47** domain unit tests (SlideService via Effect layers)
- **14** WebSocket integration tests (JOIN_ROOM, SLIDE_CHANGE, SYNC_REQUEST, error handling, connection lifecycle)
- **6** agent integration tests (endpoint structure, API key validation, request body handling)

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