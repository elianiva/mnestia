# @mnestia/server

Elysia backend API for Mnestia.

## Commands

```bash
bun run dev           # Development (watches for changes)
bun run build         # Build for production
bun run start         # Start production server
bun test              # Run tests
bun run typecheck     # Type check
```

## File Structure

```
src/
  index.ts             # Server entry point
  routes/              # API routes
    deck-routes.ts
  middleware/          # Middleware
  utils/               # Utilities
```

## Patterns

### Route Handlers

Use Elysia's chainable API:

```typescript
// deck-routes.ts
import { Elysia } from "elysia";

export const deckRoutes = new Elysia()
  .get("/api/decks", () => {
    return { decks: [] };
  })
  .post("/api/decks", async ({ body }) => {
    return { id: "123" };
  });
```

### Server Entry

```typescript
import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .listen(3000);
```

### Testing

```typescript
import { test, expect, describe } from "bun:test";

describe("feature", () => {
  test("should work", () => {
    expect(result).toBe(expected);
  });
});
```

## Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Files | kebab-case | `deck-routes.ts` |
| Route handlers | camelCase | `deckRoutes` |
| Middleware | camelCase | `authMiddleware` |
| Types | PascalCase | `DeckResponse` |

## Development Server

Runs on port 3000 by default. Access at `http://localhost:3000`

## Dependencies

- `elysia` - Web framework
- `@mnestia/core` - Shared core logic
