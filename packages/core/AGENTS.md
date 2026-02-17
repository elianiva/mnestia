# @mnestia/core

Zustand store and React hooks for slide deck state management.

## Commands

```bash
# Development with watch
bun run dev

# Build
bun run build

# Run tests
bun test
bun test define-deck           # Run specific test file

# Type check
bun run typecheck

# Lint
bun run lint
```

## Patterns

### File Naming

Use kebab-case for all files:

```
src/
  store/
    deck-store.ts
    deck-store.test.ts
  hooks/
    use-keyboard-navigation.ts
    use-keyboard-navigation.test.ts
  define-deck.ts
  define-deck.test.ts
```

### State Store

Use Zustand with factory pattern:

```typescript
// deck-store.ts
export function createDeckStore(config: DeckConfig) {
  return create<DeckState>((set, get) => ({
    // state
    currentSlide: 0,
    
    // actions
    nextSlide: () => {
      const { currentSlide } = get();
      set({ currentSlide: currentSlide + 1 });
    },
  }));
}
```

### React Hooks

Prefix with `use`, co-locate with tests:

```typescript
// use-keyboard-navigation.ts
export function useKeyboardNavigation(store: DeckStore) {
  // implementation
}

// use-keyboard-navigation.test.ts
import { test, expect } from "bun:test";
```

### Imports

Import without extensions:

```typescript
// ✅ Correct
import { createDeckStore } from "./store/deck-store";
import type { DeckConfig } from "../types";
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

## File Structure

```
src/
  store/
    deck-store.ts           # Main Zustand store
    deck-store.test.ts      # Store tests
  hooks/
    use-keyboard-navigation.ts
    use-keyboard-navigation.test.ts
  define-deck.ts            # Deck definition helper
  define-deck.test.ts
index.ts                    # Re-exports all public APIs
```

## Naming Conventions

- **Files**: kebab-case (`use-keyboard-navigation.ts`)
- **Hooks**: `useXxx` (e.g., `useKeyboardNavigation`)
- **Factory functions**: `createXxx` (e.g., `createDeckStore`)
- **Types**: PascalCase with descriptive names

## Dependencies

- `zustand` - State management
- `@mnestia/schema` - Type schemas
- `react` - Peer dependency
