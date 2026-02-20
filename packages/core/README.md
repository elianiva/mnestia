# @mnestia/core

State management and core utilities for Mnestia slide decks.

## Installation

```bash
bun add @mnestia/core
```

## Features

- **Atom-based state** - Using @effect-atom/atom-react
- **Effect services** - Business logic with Effect-TS
- **Navigation hooks** - Keyboard and mouse navigation
- **Deck factory** - `defineDeck()` for creating slide configurations

## API

### `defineDeck(slides, options)`

Create a deck configuration:

```typescript
import { defineDeck } from "@mnestia/core/define-deck";
import { slide } from "@mnestia/core/slide";

const deck = defineDeck(
  [
    slide("./slides/01-intro.tsx"),
    slide("./slides/02-content.mdx"),
  ],
  {
    theme: "@mnestia/theme-base",
    aspectRatio: "16/9",
  }
);
```

### `slide(filepath, options)`

Create a slide reference:

```typescript
import { slide } from "@mnestia/core/slide";

const mySlide = slide("./slides/01-hello.tsx", {
  id: "custom-id",
  frontmatter: {
    layout: "cover",
  },
});
```

### Hooks

- `useDeck()` - Access deck state and navigation
- `useNavigation()` - Handle keyboard navigation

## Development

```bash
bun install
bun run dev
bun test
```
