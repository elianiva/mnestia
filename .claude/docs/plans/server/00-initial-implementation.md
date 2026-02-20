# @mnestia/server — Implementation Plan

> Tracking document for the step-by-step implementation of the server package.
> Based on [AGENTS.md](./AGENTS.md) architecture specification.

---

## Overview

Build the Elysia backend with:

- **WebSocket** realtime slide synchronization
- **Effect** domain layer (services, layers, typed errors)
- **TanStack AI** agent integration (tool-driven slide mutation)
- **In-memory** shared state via Elysia `.state()`

All contracts come from `@mnestia/schema`. No deck CRUD. No database.

---

## Current State

- [x] Basic Elysia "Hello World" in `src/index.ts`
- [x] Workspace dependency on `@mnestia/schema` and `@mnestia/core`
- [x] Effect dependencies installed (`effect`, `@effect/platform`, `@effect/platform-bun`)
- [x] Elysia installed
- [ ] No domain logic
- [ ] No WebSocket handler
- [ ] No AI agent integration
- [ ] No shared state setup
- [ ] Missing `@tanstack/ai` and `@tanstack/ai-openai` dependencies

---

## Step 1: Schema Contracts (`@mnestia/schema`)

> Add server-specific shared contracts to the schema package.
> All WS event types, AI command types, and server slide types live here.

### 1.1 — WebSocket Event Schemas (`packages/schema/src/ws-events.ts`)

- [ ] Define `WsEventType` union: `JOIN_ROOM`, `SLIDE_CHANGE`, `SYNC_REQUEST`
- [ ] Define `WsOutgoingEventType` union: `SLIDE_CHANGE`, `SYNC_STATE`, `SLIDE_UPDATED`
- [ ] Define `JoinRoomPayloadSchema` — `{ deckId: string }`
- [ ] Define `SlideChangePayloadSchema` — `{ deckId: string, slideIndex: number }`
- [ ] Define `SyncRequestPayloadSchema` — `{ deckId: string }`
- [ ] Define `WsIncomingMessageSchema` — discriminated union on `type` field
- [ ] Define outgoing message schemas:
  - `SlideChangeOutSchema` — `{ type: "SLIDE_CHANGE", deckId, slideIndex }`
  - `SyncStateOutSchema` — `{ type: "SYNC_STATE", deckId, currentSlide, slides }`
  - `SlideUpdatedOutSchema` — `{ type: "SLIDE_UPDATED", deckId, slides }`
- [ ] Define `WsOutgoingMessageSchema` — union of outgoing types
- [ ] Export inferred TypeScript types for all schemas

### 1.2 — AI Command Schemas (`packages/schema/src/ai-commands.ts`)

- [ ] Define `SlideCommandTypeSchema` — union: `ADD_SLIDE`, `REMOVE_SLIDE`, `UPDATE_SLIDE`, `REORDER_SLIDES`, `CHANGE_CURRENT_SLIDE`
- [ ] Define payload schemas per command type:
  - `AddSlideCommandSchema` — `{ type, deckId, slide (minimal), position? }`
  - `RemoveSlideCommandSchema` — `{ type, deckId, slideIndex }`
  - `UpdateSlideCommandSchema` — `{ type, deckId, slideIndex, content }`
  - `ReorderSlidesCommandSchema` — `{ type, deckId, fromIndex, toIndex }`
  - `ChangeCurrentSlideCommandSchema` — `{ type, deckId, slideIndex }`
- [ ] Define `SlideCommandSchema` — discriminated union of all commands
- [ ] Define `AgentRequestSchema` — `{ messages: AgentMessage[], deckId }`
- [ ] Define `AgentResponseSchema` — `{ command: SlideCommand, result: string }`
- [ ] Export inferred types

### 1.3 — Server Slide Schemas (`packages/schema/src/server-slide.ts`)

> Lightweight, serializable slide representation for server state.
> The full `SlideSchema` in `slide.ts` includes `component: v.function()` which is
> not serializable. The server needs a simpler data-only version.

- [ ] Define `ServerSlideSchema` — `{ id, index, content?, layout?, notes? }`
- [ ] Define `ServerDeckStateSchema` — `{ currentSlide, slides: ServerSlide[] }`
- [ ] Export inferred types

### 1.4 — Schema Exports (`packages/schema/src/index.ts`)

- [ ] Add `export * from "./ws-events"`
- [ ] Add `export * from "./ai-commands"`
- [ ] Add `export * from "./server-slide"`

### 1.5 — Validate Schema Build

- [ ] Run `cd packages/schema && bun run typecheck`
- [ ] Confirm no errors

---

## Step 2: Install Server Dependencies

- [ ] Add TanStack AI: `bun add @tanstack/ai @tanstack/ai-openai`
- [ ] Add Zod (required by TanStack AI toolDefinition): `bun add zod`
- [ ] Verify `effect`, `@effect/platform`, `elysia` already present
- [ ] Run `bun install` in server package
- [ ] Run `bun run typecheck` to confirm clean

### Dependency Notes

| Package | Purpose |
|---------|---------|
| `@tanstack/ai` | Core AI agent chat + tool definitions |
| `@tanstack/ai-openai` | OpenAI adapter for chat completions |
| `zod` | Schema validation for TanStack AI tools (toolDefinition requires Zod or Standard Schema compatible) |
| `effect` | Domain layer, typed errors, service/layer DI |
| `@effect/platform` | Platform abstractions |
| `elysia` | HTTP + WebSocket server |

---

## Step 3: Effect Domain Layer

> All business logic lives here. No transport concerns.
> Follow Effect best practices: typed errors, services via Context.Tag, layers.

### 3.1 — Slide Errors (`src/domain/slide-errors.ts`)

- [ ] Define `DeckNotFoundError` — tagged error (`Data.TaggedError`)
- [ ] Define `SlideNotFoundError` — tagged error
- [ ] Define `InvalidSlideIndexError` — tagged error
- [ ] Define `SlideOperationError` — generic operation failure
- [ ] All errors carry contextual data (deckId, slideIndex, etc.)

```typescript
// Pattern to follow:
import { Data } from "effect";

export class DeckNotFoundError extends Data.TaggedError("DeckNotFoundError")<{
  readonly deckId: string;
}> {}
```

### 3.2 — Slide Service (`src/domain/slide-service.ts`)

- [ ] Define `SlideService` using `Context.Tag` pattern
- [ ] Service interface with methods:
  - `getOrCreateDeck(deckId: string)` → `Effect<ServerDeckState>`
  - `getDeck(deckId: string)` → `Effect<ServerDeckState, DeckNotFoundError>`
  - `addSlide(deckId, slide, position?)` → `Effect<ServerDeckState, ...>`
  - `removeSlide(deckId, slideIndex)` → `Effect<ServerDeckState, ...>`
  - `updateSlide(deckId, slideIndex, content)` → `Effect<ServerDeckState, ...>`
  - `reorderSlides(deckId, fromIndex, toIndex)` → `Effect<ServerDeckState, ...>`
  - `changeCurrentSlide(deckId, slideIndex)` → `Effect<ServerDeckState, ...>`
  - `executeCommand(command: SlideCommand)` → `Effect<ServerDeckState, ...>` (dispatch)
- [ ] All methods return typed Effect with explicit error channel
- [ ] No direct state access — receive store reference via Layer

```typescript
// Pattern to follow:
import { Context, Effect } from "effect";
import type { ServerDeckState, SlideCommand } from "@mnestia/schema";

export class SlideService extends Context.Tag("SlideService")<
  SlideService,
  {
    readonly getDeck: (deckId: string) => Effect.Effect<ServerDeckState, DeckNotFoundError>;
    // ... more methods
  }
>() {}
```

### 3.3 — Slide Store Tag (`src/domain/slide-store.ts`)

> Abstraction for the underlying state store, so the Effect service
> doesn't depend directly on Elysia internals.

- [ ] Define `SlideStore` tag — wraps `Map<string, DeckState>`
- [ ] Interface: `{ get, set, delete, has, getAll }`
- [ ] This is what the Layer will provide, bridging Elysia's `ctx.store.slideStore`

```typescript
import { Context, Effect } from "effect";

export interface DeckStateInternal {
  currentSlide: number;
  slides: ServerSlide[];
  clients: Set<WebSocket>;  // not from schema — internal only
}

export class SlideStore extends Context.Tag("SlideStore")<
  SlideStore,
  {
    readonly get: (deckId: string) => Effect.Effect<DeckStateInternal | undefined>;
    readonly set: (deckId: string, state: DeckStateInternal) => Effect.Effect<void>;
    // ...
  }
>() {}
```

### 3.4 — Slide Layer (`src/domain/slide-layer.ts`)

- [ ] Define `SlideServiceLive` — `Layer.effect(SlideService, ...)` that depends on `SlideStore`
- [ ] Implement all service methods using `SlideStore` operations
- [ ] Define `SlideStoreLive` factory — creates layer from Elysia store reference
- [ ] Compose layers: `SlideServiceLive` ← `SlideStoreLive`

```typescript
import { Layer, Effect } from "effect";

export const SlideServiceLive = Layer.effect(
  SlideService,
  Effect.gen(function* () {
    const store = yield* SlideStore;
    return {
      getDeck: (deckId) => Effect.gen(function* () {
        const deck = yield* store.get(deckId);
        if (!deck) return yield* new DeckNotFoundError({ deckId });
        return { currentSlide: deck.currentSlide, slides: deck.slides };
      }),
      // ... implement remaining methods
    };
  })
);
```

### 3.5 — Validate Domain Layer

- [ ] Run `bun run typecheck` on server package
- [ ] Ensure all Effect types are correct (error channels, service tags)
- [ ] Write smoke test: `src/domain/slide-service.test.ts`

---

## Step 4: Elysia State Plugin

> Register in-memory slide store using Elysia `.state()`.

### 4.1 — State Plugin (`src/state/slide-state.ts`)

- [ ] Create Elysia plugin using `.state()` to register `slideStore`
- [ ] `slideStore` is a `Map<string, DeckStateInternal>`
- [ ] Export the plugin for composition in `index.ts`

```typescript
import { Elysia } from "elysia";
import type { DeckStateInternal } from "../domain/slide-store";

export const slideStatePlugin = new Elysia({ name: "slide-state" })
  .state("slideStore", new Map<string, DeckStateInternal>());
```

### 4.2 — Bridge to Effect Layer

- [ ] Create factory function: `createSlideStoreLive(store: Map<string, DeckStateInternal>)`
- [ ] Returns `Layer<SlideStore>` wrapping the Elysia store Map
- [ ] This bridges Elysia's runtime state → Effect's DI system

---

## Step 5: WebSocket Handler

> Thin transport layer. Parse → validate → call Effect service → broadcast.

### 5.1 — WebSocket Handler (`src/ws/slide-ws.ts`)

- [ ] Create Elysia `.ws()` handler at path `/ws/slides`
- [ ] On `open`: no-op (client must send `JOIN_ROOM`)
- [ ] On `message`:
  - Parse JSON
  - Validate against `WsIncomingMessageSchema` (from schema)
  - Dispatch by `type`:
    - `JOIN_ROOM` → add client to deck's client set, send `SYNC_STATE`
    - `SLIDE_CHANGE` → call `SlideService.changeCurrentSlide`, broadcast `SLIDE_CHANGE`
    - `SYNC_REQUEST` → send `SYNC_STATE` to requesting client
- [ ] On `close`: remove client from all deck client sets
- [ ] Broadcast helper: iterate deck's `clients` set, send JSON

### 5.2 — Effect Runtime Bridge

- [ ] Create a helper to run Effect programs from Elysia handlers
- [ ] Pattern: `runEffect(effect, layer)` → Promise with error handling
- [ ] Use `Effect.runPromise` or `Effect.runPromiseExit` for error introspection

```typescript
import { Effect, Layer, Exit } from "effect";

export function runSlideEffect<A, E>(
  effect: Effect.Effect<A, E, SlideService>,
  layer: Layer.Layer<SlideService>
): Promise<A> {
  return Effect.runPromise(
    effect.pipe(Effect.provide(layer))
  );
}
```

### 5.3 — Validate WebSocket

- [ ] Manual test: connect via WebSocket client, send `JOIN_ROOM`
- [ ] Verify `SYNC_STATE` response
- [ ] Send `SLIDE_CHANGE`, verify broadcast to other clients

---

## Step 6: AI Agent Integration

> TanStack AI agent receives chat, produces structured slide commands,
> executes via Effect service, broadcasts via WebSocket.

### 6.1 — Tool Definitions (`src/agent/agent-tools.ts`)

- [ ] Define TanStack AI tools using `toolDefinition()`:
  - `addSlideTool` — add a slide to a deck
  - `removeSlideTool` — remove a slide by index
  - `updateSlideTool` — update slide content
  - `reorderSlidesTool` — reorder slides
  - `changeCurrentSlideTool` — navigate to a slide
- [ ] Each tool:
  - Has `inputSchema` (Zod — required by TanStack AI)
  - Has `outputSchema` (Zod)
  - `.server()` implementation calls Effect `SlideService`

```typescript
import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

export const addSlideDef = toolDefinition({
  name: "add_slide",
  description: "Add a new slide to the deck",
  inputSchema: z.object({
    deckId: z.string(),
    content: z.string().optional(),
    layout: z.string().optional(),
    position: z.number().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    slideCount: z.number(),
    currentSlide: z.number(),
  }),
});
```

### 6.2 — Agent Service (`src/agent/agent-service.ts`)

- [ ] Create server-side tool implementations using `.server()`
- [ ] Each tool impl:
  1. Receives typed args from AI
  2. Constructs `SlideCommand` (validated against schema)
  3. Runs `SlideService.executeCommand` via Effect
  4. Returns structured result
  5. Triggers WebSocket broadcast of `SLIDE_UPDATED`
- [ ] Accept dependencies: Effect runtime layer + broadcast function

### 6.3 — Agent Controller (`src/agent/agent-controller.ts`)

- [ ] Create Elysia route group: `/agent`
- [ ] `POST /agent/chat` endpoint:
  1. Parse request body (messages + deckId)
  2. Call `chat()` from `@tanstack/ai` with:
     - `adapter: openaiText("gpt-4o")` (or configurable model)
     - `messages` from request
     - `tools` array (all slide tools)
     - `systemPrompts` describing the slide assistant role
  3. Return `toServerSentEventsResponse(stream)` for streaming
- [ ] System prompt should describe:
  - Available tools and their purpose
  - The current deck context
  - Constraints (valid slide indices, etc.)

### 6.4 — Environment Configuration

- [ ] `OPENAI_API_KEY` must be set in environment
- [ ] Document in README
- [ ] Fail gracefully if key not provided (log warning, disable agent routes)

### 6.5 — Validate Agent

- [ ] Test with curl: `POST /agent/chat` with messages
- [ ] Verify tool calls produce valid slide commands
- [ ] Verify state mutations and WebSocket broadcasts

---

## Step 7: Entry Point Wiring (`src/index.ts`)

> Follow registration order from AGENTS.md §11.

- [ ] 1. Register `.state()` plugin (slide state)
- [ ] 2. Create Effect layers (SlideStoreLive → SlideServiceLive)
- [ ] 3. Register agent routes (POST /agent/chat)
- [ ] 4. Register WebSocket handler (/ws/slides)
- [ ] 5. Start server on port 3000

```typescript
import { Elysia } from "elysia";
import { slideStatePlugin } from "./state/slide-state";
import { createSlideStoreLive, SlideServiceLive } from "./domain/slide-layer";
import { agentController } from "./agent/agent-controller";
import { slideWs } from "./ws/slide-ws";
import { Layer } from "effect";

const app = new Elysia()
  // 1. Register state
  .use(slideStatePlugin)
  // 2. Derive Effect layers (passed to handlers)
  .derive(({ store }) => {
    const storeLayer = createSlideStoreLive(store.slideStore);
    const serviceLayer = SlideServiceLive.pipe(Layer.provide(storeLayer));
    return { serviceLayer };
  })
  // 3. Register agent routes
  .use(agentController)
  // 4. Register WebSocket
  .use(slideWs)
  // 5. Start
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
```

---

## Step 8: Testing

### 8.1 — Unit Tests (Effect Domain)

- [ ] `src/domain/slide-service.test.ts`
  - Test each service method in isolation
  - Provide a test `SlideStore` layer (in-memory Map)
  - Assert correct state mutations
  - Assert typed errors for invalid operations

### 8.2 — Integration Tests (WebSocket)

- [ ] `src/ws/slide-ws.test.ts`
  - Spin up Elysia app
  - Connect WebSocket client
  - Test JOIN_ROOM → SYNC_STATE flow
  - Test SLIDE_CHANGE → broadcast flow
  - Test multiple clients in same room

### 8.3 — Integration Tests (Agent)

- [ ] `src/agent/agent-controller.test.ts`
  - Mock OpenAI adapter or use test adapter
  - Test POST /agent/chat endpoint
  - Verify tool execution produces state changes
  - Verify SSE response format

---

## Step 9: Documentation & Cleanup

- [ ] Update `packages/server/README.md` with:
  - Setup instructions
  - Environment variables needed (`OPENAI_API_KEY`)
  - API endpoints reference
  - WebSocket protocol reference
- [ ] Ensure all files follow naming conventions (kebab-case)
- [ ] Ensure no barrel imports (direct imports only)
- [ ] Ensure no duplicated types from schema
- [ ] Run full lint: `bun run lint`
- [ ] Run full typecheck: `bun run typecheck`

---

## Final File Structure

```
packages/server/src/
├── index.ts                      # Entry point — wiring & boot
├── state/
│   └── slide-state.ts            # Elysia .state() plugin
├── domain/
│   ├── slide-errors.ts           # Tagged Effect errors
│   ├── slide-store.ts            # SlideStore Context.Tag (state abstraction)
│   ├── slide-service.ts          # SlideService Context.Tag (business logic)
│   ├── slide-layer.ts            # Live layer implementations
│   └── slide-service.test.ts     # Domain unit tests
├── ws/
│   ├── slide-ws.ts               # WebSocket handler (transport only)
│   ├── effect-runtime.ts         # Effect → Promise bridge helper
│   └── slide-ws.test.ts          # WS integration tests
├── agent/
│   ├── agent-tools.ts            # TanStack AI tool definitions
│   ├── agent-service.ts          # Tool server implementations
│   ├── agent-controller.ts       # POST /agent/chat route
│   └── agent-controller.test.ts  # Agent integration tests

packages/schema/src/
├── ws-events.ts                  # (new) WebSocket event contracts
├── ai-commands.ts                # (new) AI command contracts
├── server-slide.ts               # (new) Server-side slide types
├── index.ts                      # (updated) exports new modules
└── ... (existing files)
```

---

## Dependency Graph

```
@mnestia/schema (contracts)
       ↑
@mnestia/server
  ├── domain/ (Effect services — pure logic)
  │     ↑
  ├── state/ (Elysia .state() → Effect bridge)
  │     ↑
  ├── ws/ (WebSocket transport → calls domain)
  │     ↑
  ├── agent/ (TanStack AI → calls domain → broadcasts via ws)
  │     ↑
  └── index.ts (wires everything)
```

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Valibot + `toStandardJsonSchema` for TanStack AI tools | TanStack AI `toolDefinition` accepts Standard JSON Schema. Valibot's `toStandardJsonSchema()` from `@valibot/to-json-schema` provides direct compatibility — no Zod needed. |
| `SlideStore` tag abstracts state | Decouples Effect domain from Elysia internals. Testable with mock store. |
| `DeckStateInternal` vs `ServerDeckState` | Internal type adds `clients: Set<WebSocket>` (not serializable). Schema type is data-only. |
| SSE streaming for agent responses | TanStack AI's `toServerSentEventsResponse` provides real-time streaming. |
| `.derive()` for layer injection | Each request gets access to pre-built Effect layers without global state. |
| No deck CRUD endpoints | Per AGENTS.md — structure first, features later. |

---

## Progress Tracker

| Step | Description | Status |
|------|-------------|--------|
| 1 | Schema contracts | ✅ Done |
| 2 | Install dependencies | ✅ Done |
| 3 | Effect domain layer | ✅ Done |
| 4 | Elysia state plugin | ✅ Done |
| 5 | WebSocket handler | ✅ Done |
| 6 | AI agent integration | ✅ Done |
| 7 | Entry point wiring | ✅ Done |
| 8 | Testing | ✅ Done |
| 9 | Documentation & cleanup | ✅ Done |