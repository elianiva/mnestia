# Mnestia - AGENTS.md

Mnestia is a slide deck framework monorepo.

## Tech Stack

- **Runtime**: Bun
- **Build Tool**: Moonrepo
- **Language**: TypeScript
- **Linting**: Oxlint (see oxlint.json)

## Commands

```bash
# Run all packages
cd packages/<name>

# Development
moon run :dev

# Build
moon run :build

# Test
moon run :test                    # Run all tests
bun test                          # Run package tests
bun test <pattern>                # Run single test

# Lint/Format
moon run :lint
moon run :format

# Type check
moon run :typecheck
```

## Project Structure

```
packages/
  schema/    # Valibot schemas (types only)
  core/      # Zustand store + React hooks
  server/    # Elysia backend API
  web/       # TanStack Start frontend
```

Dependencies:
- server → core
- web → core

## Code Style

### File Naming (Kebab-Case)

All files use kebab-case:

- `my-component.tsx` - React components
- `use-hook-name.ts` - Hooks
- `util-helpers.ts` - Utilities
- `types.ts` - Type definitions
- `deck-store.ts` - Store files

### Imports

Import without extensions (TypeScript resolves them automatically):

```typescript
// ✅ Correct
import { myFunction } from "./my-file";
import { MyComponent } from "./my-component";
import type { MyType } from "./types";
```

### Naming

- **Files**: kebab-case (`use-deck-store.ts`, `slide-viewer.tsx`)
- **Functions**: camelCase (`defineDeck`)
- **Types/Interfaces**: PascalCase (`DeckConfig`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **React hooks**: `useXxx` prefix with kebab-case files (`use-deck.ts`)
- **Factory functions**: `createXxx` prefix (`create-deck-store.ts`)

### Error Handling

- Use descriptive error messages
- Throw errors for invalid inputs
- Return early for guard clauses

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
