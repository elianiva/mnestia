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

### Imports
- Use `.js` extensions: `import { x } from "./file.js"`
- Type imports: `import type { X } from "./types.js"`
- Use `type` keyword for type-only imports

### Naming
- Functions: camelCase (`defineDeck`)
- Types/Interfaces: PascalCase (`DeckConfig`)
- Constants: UPPER_SNAKE_CASE for true constants
- React hooks: `useXxx` prefix
- Factory functions: `createXxx` prefix

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
