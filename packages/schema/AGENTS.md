# @mnestia/schema

Valibot schema definitions for Mnestia types.

## Commands

```bash
bun run typecheck     # Type check only (no tests)
bun run build         # Build declarations
```

## File Structure

```
src/
  deck.ts          # Deck configuration schemas
  slide.ts         # Slide schemas
  navigation.ts    # Navigation config schemas
  theme.ts         # Theme module schemas
  export.ts        # Export configuration schemas
  index.ts         # Barrel exports
```

## Patterns

### Schema Definition

Export both schema and inferred type:

```typescript
import * as v from "valibot";

export const DeckConfigSchema = v.object({
  slides: v.array(SlideSchema),
  theme: v.string(),
});

export type DeckConfig = v.InferOutput<typeof DeckConfigSchema>;
```

### Optional Fields

Use `v.optional()` for optional fields:

```typescript
export const ConfigSchema = v.object({
  required: v.string(),
  optional: v.optional(v.string()),
});
```

## Naming

| Category         | Convention | Example            |
| ---------------- | ---------- | ------------------ |
| Files            | kebab-case | `deck.ts`          |
| Schema variables | XxxSchema  | `DeckConfigSchema` |
| Types            | PascalCase | `DeckConfig`       |

## Dependencies

- `valibot` - Schema validation
- No testing - type-only package
