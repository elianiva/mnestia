# @mnestia/server – Global Architecture Specification

Backend realtime slide system built with **Elysia (REST + WebSocket)** inside a **Moon-managed monorepo**, integrating:

- TanStack AI (agent layer)
- Effect (functional core / domain logic discipline)

Deck management via REST is intentionally skipped for now.
Focus: realtime sync + AI-driven slide mutation structure.

---

# 1. Scope (Current Phase)

Active:

- WebSocket realtime slide synchronization
- Shared in-memory state using Elysia `.state()`
- AI Agent integration (TanStack AI)
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

## TanStack AI

https://tanstack.com/ai/latest/docs/getting-started/overview

Used for:

- Agent-based chat interaction
- Tool-driven AI architecture
- Structured AI outputs
- Streaming-compatible design

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

Chat UI (TanStack AI)
    ↓
POST /agent
    ↓
Agent Controller
    ↓
AI Processing Layer
    ↓
Structured Slide Command
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

# 7. AI Agent Integration (TanStack AI)

Reference:

https://tanstack.com/ai/latest/docs/getting-started/overview

Purpose:

- Modify slides via natural language
- Convert chat into structured slide commands
- Support tool-driven AI mutation

Slides structure can remain minimal placeholder.

Agent must output structured command format defined in `../schema`.

---

# 8. Agent Flow Specification

1. Client sends chat message
2. `/agent` endpoint receives request
3. Agent layer invokes AI model
4. AI produces structured slide command
5. Validate against shared schema
6. Execute Slide Service Effect
7. Update state
8. Broadcast via WebSocket
9. Return structured result

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
  ws/
    slide-ws.ts
  state/
    slide-state.ts
  domain/
    slide-service.ts
    slide-errors.ts
    slide-layer.ts
  agent/
    agent-controller.ts
    agent-service.ts
```

Shared contracts:

```
../schema
```

---

# 11. Registration Order

1. Register `.state()`
2. Provide Effect Layers
3. Register agent routes
4. Register WebSocket handler
5. Start server

Effect layers must be initialized before transport handlers.

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

# 14. Future Extensions

Later:

- Persistence layer (Effect-powered)
- Redis-backed distributed state
- Collaborative locks
- AI streaming responses
- Versioning & history
- Audit trail for AI commands

---

# 15. Default Server

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
