# Mnestia

Slide deck framework monorepo. Runtime: Bun. Build: Moonrepo.

## Commands

```bash
# Development (all packages)
moon run :dev

# Build (all packages)
moon run :build

# Run all tests
moon run :test

# Run single test file
bun test <pattern>           # e.g., bun test deck-store

# Lint/Format
moon run :lint
moon run :format

# Type check
moon run :typecheck
```

## Project Structure

```
packages/
  schema/       # Valibot schemas (types only)
  core/         # Zustand store + React hooks
  server/       # Elysia backend API
  web/          # TanStack Start frontend
  theme-base/   # Base theme with layouts/components
```

Dependencies: `server` → `core`, `web` → `core`

## Code Style

### Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Files | kebab-case | `use-deck-store.ts` |
| Functions | camelCase | `defineDeck` |
| Types/Interfaces | PascalCase | `DeckConfig` |
| Constants | UPPER_SNAKE_CASE | `MAX_SLIDES` |
| React hooks | useXxx prefix | `useKeyboardNavigation` |
| Factory functions | createXxx prefix | `createDeckStore` |
| Schema variables | XxxSchema suffix | `DeckConfigSchema` |

### Imports

Import without extensions (TypeScript resolves them):

```typescript
// ✅ Correct
import { myFunction } from "./my-file";
import type { MyType } from "../types";
import { something } from "@mnestia/schema";
```

**No barrel imports** - Import directly from source files, never from `index.ts`:

```typescript
// ❌ Wrong - barrel import
import { Button } from "./components";
import { useAuth } from "@mnestia/core";

// ✅ Correct - direct import
import { Button } from "./components/button";
import { useAuth } from "@mnestia/core/src/hooks/use-auth";
```

### TypeScript

```typescript
// Interfaces for object types
interface DeckState {
  currentSlide: number;
}

// Type for unions/tuples
type AspectRatio = "16/9" | "4/3";

// Explicit return types on exports
export function createDeckStore(config: DeckConfig): DeckStore {
  // implementation
}

// Use `type` keyword for type imports
import type { DeckConfig } from "@mnestia/schema";
```

### Error Handling

```typescript
// Throw for invalid inputs
if (slides.length === 0) {
  throw new Error("Deck must have at least one slide");
}

// Return early for guard clauses
if (!isValid) return null;

// Descriptive error messages
throw new Error(`Failed to load slide at index ${index}`);
```

## Testing

Use `bun:test`:

```typescript
import { test, expect, describe } from "bun:test";

describe("feature", () => {
  test("should work", () => {
    expect(result).toBe(expected);
  });
});
```

- Co-locate tests: `deck-store.ts` → `deck-store.test.ts`
- Run single test: `bun test deck-store`

## Commits

Use semantic commits:

```
feat: add keyboard navigation
fix: correct slide index overflow
refactor: simplify store logic
docs: update API examples
test: add deck store tests
chore: update dependencies
```

## Package Guidelines

- [packages/core/AGENTS.md](packages/core/AGENTS.md) - Zustand stores, React hooks
- [packages/web/AGENTS.md](packages/web/AGENTS.md) - TanStack Router, Tailwind
- [packages/server/AGENTS.md](packages/server/AGENTS.md) - Elysia API routes
- [packages/schema/AGENTS.md](packages/schema/AGENTS.md) - Valibot schemas
- [packages/theme-base/AGENTS.md](packages/theme-base/AGENTS.md) - Theme layouts

## Configuration

- **Linting**: `oxlint.json` - Oxlint rules
- **Formatting**: `.oxfmt.json` - 2-space tabs, single quotes, 80 width
- **TypeScript**: `tsconfig.options.json` - Shared compiler options

## Key Dependencies

- `zustand` - State management
- `valibot` - Schema validation
- `elysia` - Web framework
- `@tanstack/react-start` - Full-stack framework
- `tailwindcss` - Styling
