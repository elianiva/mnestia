# @mnestia/schema

Valibot schema definitions for Mnestia types.

## Commands

```bash
# Type check only (no tests in this package)
bun run typecheck

# Build declarations
bun run build
```

## Schema Patterns

Export both schema and inferred type:

```typescript
import * as v from "valibot";

export const DeckConfigSchema = v.object({
  slides: v.array(SlideSchema),
  theme: v.string(),
});

export type DeckConfig = v.InferOutput<typeof DeckConfigSchema>;
```

## File Naming

Use kebab-case for all files:

```
src/
  deck.ts          # Deck configuration schemas
  slide.ts         # Slide schemas
  navigation.ts    # Navigation config schemas
  theme.ts         # Theme module schemas
  export.ts        # Export configuration schemas
  index.ts         # Barrel exports
```

### Imports

Import without extensions:

```typescript
// ✅ Correct
import { SlideSchema } from "./slide";
import type { Slide } from "./slide";
```

## Naming

- **Files**: kebab-case (`deck-config.ts`, `slide-schema.ts`)
- **Schema variables**: `XxxSchema` suffix
- **Types**: `Xxx` (without Schema suffix)
- Use `v.optional()` for optional fields, not `v.nullable()`

## Dependencies

No runtime dependencies except Valibot. No testing - type-only package.
