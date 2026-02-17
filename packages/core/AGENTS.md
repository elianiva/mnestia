# @mnestia/core

Zustand store and React hooks for slide deck state management.

## Commands

```bash
bun run dev           # Development with watch
bun run build         # Build
bun test              # Run all tests
bun test <pattern>   # Run specific test file
bun run typecheck     # Type check
bun run lint          # Lint
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
index.ts                    # Public API exports
```

## Patterns

### State Store

Use Zustand with factory pattern:

```typescript
export function createDeckStore(config: DeckConfig) {
  return create<DeckState>((set, get) => ({
    currentSlide: 0,
    
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
import { test, expect, describe } from "bun:test";
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
| Files | kebab-case | `deck-store.ts` |
| Hooks | useXxx | `useKeyboardNavigation` |
| Factory functions | createXxx | `createDeckStore` |
| Types | PascalCase | `DeckConfig` |

## Dependencies

- `zustand` - State management
- `@mnestia/schema` - Type schemas
- `react` - Peer dependency
