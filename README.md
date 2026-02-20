# Mnestia

Modern slide decks for developers. Built with React, Vite, and Effect-TS.

## Features

- **React-based slides** - Write slides as React components or MDX
- **Lazy loading** - Each slide loads on-demand for fast initial load
- **Live reload** - Instant preview while editing
- **Keyboard navigation** - Navigate with arrow keys, space, vim bindings
- **Themes** - Customizable themes with layouts
- **Static export** - Build to static SPA for deployment

## Quick Start

### Create a new project

```bash
# Using the CLI
bun create mnestia my-deck

# Or with npm
npm create mnestia my-deck

# Or with the mnestia CLI directly
npx @mnestia/cli create my-deck
```

### Development

```bash
cd my-deck
bun install

# Start dev server
bun run dev
# or
mnestia dev

# Open http://localhost:3000
```

### Build for production

```bash
# Build static site
bun run build
# or
mnestia build

# Preview the build
cd dist
npx serve
```

## Project Structure

```
my-deck/
├── slides/
│   ├── 01-welcome.tsx    # React component slides
│   ├── 02-features.tsx
│   ├── 03-mdx-demo.mdx   # MDX slides
│   └── 04-end.tsx
├── public/               # Static assets
├── mnestia.config.ts     # Deck configuration
├── index.html           # Entry HTML
├── package.json
└── README.md
```

## Writing Slides

### React Component Slides

Create `.tsx` files in the `slides/` folder:

```tsx
// slides/01-hello.tsx
export default function HelloSlide() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <h1 className="text-6xl font-bold">Hello Mnestia!</h1>
      <p className="text-2xl text-slate-600">
        Build beautiful slides with React
      </p>
    </div>
  );
}
```

### MDX Slides

Create `.mdx` files for markdown with JSX:

```mdx
---
layout: default
---

# Markdown Slide

- Point 1
- Point 2
- Point 3

<div className="mt-8">
  <CustomComponent />
</div>
```

### Frontmatter

Customize individual slides with YAML frontmatter:

```tsx
---
layout: cover
background: "#1e293b"
---

export default function CoverSlide() {
  return <h1>Title Slide</h1>;
}
```

## Configuration

Edit `mnestia.config.ts` to configure your deck:

```typescript
import { defineDeck } from "@mnestia/core/define-deck";
import { slide } from "@mnestia/core/slide";

export default defineDeck(
  [
    slide("./slides/01-welcome.tsx"),
    slide("./slides/02-features.tsx"),
    slide("./slides/03-demo.mdx"),
  ],
  {
    theme: "@mnestia/theme-base",
    aspectRatio: "16/9",
    navigation: {
      mode: "both", // "keyboard" | "mouse" | "both"
      enableMouseClick: true,
      enableTouchSwipe: true,
    },
  }
);
```

## CLI Commands

### `mnestia create [name]`

Create a new slide deck project.

```bash
mnestia create my-deck
mnestia create . --force  # Use current directory
```

### `mnestia dev`

Start the development server.

```bash
mnestia dev              # Default port 3000
mnestia dev --port 8080
mnestia dev --open       # Open browser automatically
```

### `mnestia build`

Build static site for production.

```bash
mnestia build            # Output to dist/
mnestia build --out-dir build
mnestia build --base /slides/  # For subpath deployment
```

## Navigation

| Key | Action |
|-----|--------|
| `→`, `↓`, `Space`, `PageDown` | Next slide |
| `←`, `↑`, `PageUp` | Previous slide |
| `Home` | First slide |
| `End` | Last slide |
| `f` | Toggle fullscreen |

## Themes

Themes provide layouts and components for your slides.

### Using built-in theme

```typescript
export default defineDeck(slides, {
  theme: "@mnestia/theme-base",
});
```

### Available layouts

- `default` - Standard content layout
- `cover` - Title/cover slide
- `center` - Centered content
- `split` - Two-column layout
- `grid` - Grid-based layout

### Custom layouts

```tsx
// slides/01-custom.tsx
---
layout: cover
---

export default function CoverSlide() {
  return (
    <div className="flex h-full items-center justify-center">
      <h1>Custom Cover</h1>
    </div>
  );
}
```

## Architecture

Mnestia is a monorepo with the following packages:

| Package | Description |
|---------|-------------|
| `@mnestia/cli` | Command-line interface |
| `@mnestia/core` | State management and hooks |
| `@mnestia/web` | React app for slide preview |
| `@mnestia/vite-plugin` | Vite plugin for slide loading |
| `@mnestia/theme-base` | Base theme with layouts |
| `@mnestia/schema` | Valibot schemas and types |

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/mnestia.git
cd mnestia

# Install dependencies
bun install

# Run tests
moon run :test

# Start dev mode for all packages
moon run :dev
```

### Package commands

```bash
# Core package
cd packages/core
bun run dev
bun run test

# CLI
cd packages/cli
bun run dev
bun test

# Web app
cd packages/web
bun run dev
```

## License

MIT
