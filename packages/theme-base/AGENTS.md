# @mnestia/theme-base

Base theme package with layouts and components for Mnestia slide decks.

## Commands

```bash
bun run dev           # Development with watch
bun run build         # Build
bun run typecheck     # Type check
bun run lint          # Lint
```

## File Structure

```
src/
  layouts/
    default.tsx       # Standard content layout
    cover.tsx         # Full-screen title layout
    center.tsx        # Centered content layout
    split.tsx         # Two-column layout
    grid.tsx          # Multi-column grid layout
    index.ts          # Layout exports
  components/
    code-block.tsx    # Syntax highlighted code
    image.tsx         # Responsive image with caption
    quote.tsx         # Styled blockquote
    table.tsx         # Data table with stripes
    index.ts          # Component exports
  styles/
    variables.css     # CSS custom properties
    global.css        # Base styles and typography
  setup.ts            # Theme initialization
index.ts              # ThemeModule export
```

## Patterns

### Layouts

All layouts accept `className` and `style` props:

```typescript
// layouts/default.tsx
interface DefaultLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DefaultLayout({ children, className }: DefaultLayoutProps) {
  return (
    <div className={cn("p-8 max-w-4xl mx-auto", className)}>
      {children}
    </div>
  );
}
```

### Components

```typescript
// components/code-block.tsx
interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  // implementation
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

| Category   | Convention                 | Example          |
| ---------- | -------------------------- | ---------------- |
| Files      | kebab-case                 | `code-block.tsx` |
| Layouts    | PascalCase + Layout suffix | `DefaultLayout`  |
| Components | PascalCase                 | `CodeBlock`      |
| Types      | PascalCase                 | `LayoutProps`    |

## Usage

```typescript
import { themeBase } from "@mnestia/theme-base";

// Access layouts
const { default: DefaultLayout, cover: CoverLayout } = themeBase.layouts;

// Access components
const { CodeBlock, Image, Quote, Table } = themeBase.components;
```

## CSS Variables

Import theme styles:

```typescript
import "@mnestia/theme-base/src/styles/variables.css";
import "@mnestia/theme-base/src/styles/global.css";
```

### Color Tokens

- `--mnestia-bg` - Background color
- `--mnestia-text` - Primary text color
- `--mnestia-primary` - Primary accent color
- `--mnestia-accent` - Secondary accent color

## Dark Mode

Add `data-theme="dark"` attribute:

```html
<html data-theme="dark"></html>
```

## Dependencies

- `@mnestia/schema` - Type schemas
- `react` - Peer dependency
- `tailwindcss` - Styling
