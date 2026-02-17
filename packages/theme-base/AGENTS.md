# @mnestia/theme-base

Base theme package with layouts and components for Mnestia slide decks.

## Commands

```bash
# Development with watch
bun run dev

# Build
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

## File Naming

Use kebab-case for all files:

```
src/
  layouts/
    default.tsx         # Standard content layout
    cover.tsx           # Full-screen title layout
    center.tsx          # Centered content layout
    split.tsx           # Two-column layout
    grid.tsx            # Multi-column grid layout
    index.ts            # Layout exports
  components/
    code-block.tsx      # Syntax highlighted code
    image.tsx           # Responsive image with caption
    quote.tsx           # Styled blockquote
    table.tsx           # Data table with stripes
    index.ts            # Component exports
  styles/
    variables.css       # CSS custom properties
    global.css          # Base styles and typography
  setup.ts              # Theme initialization
  index.ts              # Layout and component exports
index.ts                # ThemeModule export
```

## Structure

```
src/
  layouts/
    default.tsx         - Standard content layout
    cover.tsx           - Full-screen title layout
    center.tsx          - Centered content layout
    split.tsx           - Two-column layout
    grid.tsx            - Multi-column grid layout
  components/
    code-block.tsx      - Syntax highlighted code
    image.tsx           - Responsive image with caption
    quote.tsx           - Styled blockquote
    table.tsx           - Data table with stripes
  styles/
    variables.css       - CSS custom properties
    global.css          - Base styles and typography
  setup.ts              - Theme initialization
  index.ts              - Layout and component exports
index.ts                - ThemeModule export
```

### Imports

Import without extensions:

```typescript
// ✅ Correct
import { DefaultLayout } from "./layouts/default";
import { CodeBlock } from "./components/code-block";
import type { ThemeModule } from "@mnestia/schema";
```

## Layouts

All layouts accept `className` and `style` props for customization.

### DefaultLayout
Standard content layout with padding and max-width.

### CoverLayout
Full-screen centered layout for title slides.
Props: `title`, `subtitle`, `children`

### CenterLayout
Centers content both horizontally and vertically.

### SplitLayout
Two-column layout with configurable ratio.
Props: `left`, `right`, `ratio` (50-50, 60-40, 70-30, etc.)

### GridLayout
Multi-column CSS grid layout.
Props: `columns` (number or string array), `gap` (sm, md, lg)

## Components

### CodeBlock
Syntax highlighted code display.
Props: `code`, `language?`, `filename?`, `showLineNumbers?`

### Image
Responsive image with caption support.
Props: `src`, `alt`, `caption?`, `objectFit?`

### Quote
Styled blockquote with attribution.
Props: `quote`, `author?`, `source?`

### Table
Data table with striped rows option.
Props: `headers`, `rows`, `striped?`

## Usage

```typescript
import { themeBase } from "@mnestia/theme-base";

// Access layouts
const { default: DefaultLayout, cover: CoverLayout } = themeBase.layouts;

// Access components
const { CodeBlock, Image, Quote, Table } = themeBase.components;
```

## CSS Variables

The theme exports CSS variables for colors, typography, and spacing. Import the styles in your application:

```typescript
import "@mnestia/theme-base/src/styles/variables.css";
import "@mnestia/theme-base/src/styles/global.css";
```

### Color Tokens
- `--mnestia-bg` - Background color
- `--mnestia-text` - Primary text color
- `--mnestia-primary` - Primary accent color
- `--mnestia-accent` - Secondary accent color

### Typography
- `--mnestia-font-sans` - Sans-serif font stack
- `--mnestia-font-mono` - Monospace font stack
- `--mnestia-font-size-*` - Size scale (xs to 6xl)

### Spacing
- `--mnestia-space-*` - Spacing scale (1 to 20)

## Dark Mode

Add `data-theme="dark"` attribute to enable dark mode:

```html
<html data-theme="dark">
```
