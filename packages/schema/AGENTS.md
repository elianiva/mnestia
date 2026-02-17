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

## File Organization

- `deck.ts` - Deck configuration schemas
- `slide.ts` - Slide schemas  
- `navigation.ts` - Navigation config schemas
- `theme.ts` - Theme module schemas
- `export.ts` - Export configuration schemas

## Naming

- Schema variables: `XxxSchema` suffix
- Types: `Xxx` (without Schema suffix)
- Use `v.optional()` for optional fields, not `v.nullable()`

## Dependencies

No runtime dependencies except Valibot. No testing - type-only package.
