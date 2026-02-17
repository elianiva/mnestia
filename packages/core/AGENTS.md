# @mnestia/core

State management with @effect-atom/atom-react atoms and Effect services for slide deck state.

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
  atoms/
    deck-atom.ts            # Deck state atom with keepAlive
    deck-atom.test.ts       # Atom tests
    clicks-atom.ts          # Per-slide click counter atoms
    clicks-atom.test.ts
    slides-atom.ts          # Slides data atom
    slides-atom.test.ts
    theme-atom.ts           # Theme caching atom
    theme-atom.test.ts
  services/
    deck-service.ts         # Effect service for deck operations
    deck-service.test.ts
    navigation-service.ts   # Navigation logic service
    navigation-service.test.ts
    theme-service.ts        # Theme loading service
    theme-service.test.ts
  hooks/
    use-deck.ts             # React hook for deck state
    use-keyboard-navigation.ts
    use-keyboard-navigation.test.ts
  utils/
    define-deck.ts          # Deck configuration factory
    define-deck.test.ts
    define-theme.ts         # Theme definition helper
    slide.ts                # Slide utilities
  errors/
    slide-errors.ts         # Slide-related errors
    theme-errors.ts         # Theme-related errors
index.ts                    # Public API exports
```

## Patterns

### State Atoms

Use @effect-atom/atom-react with factory pattern and keepAlive:

```typescript
// atoms/deck-atom.ts
import { Atom } from "@effect-atom/atom-react";

export interface DeckState {
  currentSlide: number;
  totalSlides: number;
}

export function createDeckAtom(config: DeckConfig) {
  return Atom.make({
    currentSlide: 0,
    totalSlides: config.slides.length,
  }).pipe(Atom.keepAlive);
}

export type DeckAtom = ReturnType<typeof createDeckAtom>;
```

Use Atom.family for per-slide state:

```typescript
// atoms/clicks-atom.ts
export const clicksAtomFamily = Atom.family((slideIndex: number) =>
  Atom.make({ currentClick: 0, totalClicks: 0 })
);
```

### Effect Services

Services handle side effects and business logic:

```typescript
// services/deck-service.ts
import { Effect } from "effect";

export class DeckService extends Effect.Service<DeckService>()("DeckService", {
  accessors: true,
  effect: Effect.gen(function* () {
    const nextSlide = Effect.fn("DeckService.nextSlide")(function* () {
      // implementation with logging
    });

    return { nextSlide, /* ... */ };
  }),
}) {}
```

### React Hooks

Prefix with `use`, co-locate with tests. Connect atoms to React with useAtom:

```typescript
// hooks/use-deck.ts
import { useAtom } from "@effect-atom/atom-react";

export function useDeck(deckAtom: DeckAtom): UseDeckResult {
  const [state, setState] = useAtom(deckAtom);
  
  const nextSlide = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentSlide: prev.currentSlide + 1
    }));
  }, [setState]);
  
  return { /* ... */ };
}
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

| Category          | Convention | Example                 |
| ----------------- | ---------- | ----------------------- |
| Files             | kebab-case | `deck-atom.ts`          |
| Hooks             | useXxx     | `useKeyboardNavigation` |
| Factory functions | createXxx  | `createDeckAtom`        |
| Atom families     | xxxFamily  | `clicksAtomFamily`      |
| Services          | XxxService | `DeckService`           |
| Types             | PascalCase | `DeckConfig`            |

## Dependencies

- `@effect-atom/atom-react` - Atom-based state management
- `effect` - Effect-TS core for services
- `@mnestia/schema` - Type schemas
- `react` - Peer dependency

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Hooks   │────▶│     Atoms       │────▶│    Services     │
│  (useDeck)      │     │  (deck-atom)    │     │ (DeckService)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                                               │
       │                                               ▼
       │                                        ┌─────────────────┐
       └────────────────────────────────────────│  Effect Runtime │
                                                └─────────────────┘
```

- **Atoms**: Immutable state containers with reactive updates
- **Services**: Effect-based business logic and side effects
- **Hooks**: React bindings connecting atoms to components

<!-- effect-solutions:start -->
## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `.reference/effect/` for real implementations (run `effect-solutions setup` first)

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.
<!-- effect-solutions:end -->
