# mnestia Starter Template

Welcome to your new slide deck project!

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev
# or
mnestia dev

# Open http://localhost:3000
```

## Writing Slides

### React Component Slides

Create `.tsx` files in the `slides/` folder:

```tsx
// slides/01-hello.tsx
export default function HelloSlide() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">Hello!</h1>
    </div>
  );
}
```

### MDX Slides

Create `.mdx` files for markdown with JSX:

```mdx
# Markdown Slide

- Point 1
- Point 2
```

### Frontmatter

Customize slides with YAML frontmatter:

```tsx
---
layout: cover
---

export default function CoverSlide() {
  return <h1>Title</h1>;
}
```

## Configuration

Edit `mnestia.config.ts` to add slides or change settings:

```typescript
import { defineDeck } from "@mnestia/core/define-deck";
import { slide } from "@mnestia/core/slide";

export default defineDeck(
  [
    slide("./slides/01-welcome.tsx"),
    slide("./slides/02-features.tsx"),
    // Add more slides here
  ],
  {
    theme: "@mnestia/theme-base",
    aspectRatio: "16/9",
  }
);
```

## Build for Production

```bash
bun run build
# or
mnestia build

# Preview the build
cd dist
npx serve
```

## Navigation

| Key | Action |
|-----|--------|
| `→`, `↓`, `Space` | Next slide |
| `←`, `↑` | Previous slide |
| `Home` | First slide |
| `End` | Last slide |

## Learn More

- [Mnestia documentation](https://github.com/your-org/mnestia)
