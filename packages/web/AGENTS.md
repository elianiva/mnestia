# @mnestia/web

TanStack Start frontend for Mnestia slide decks.

## Commands

```bash
bun run dev           # Development server (port 3000)
bun run build         # Build for production
bun run preview       # Preview production build
bun test              # Run tests
bun run typecheck     # Type check
```

## File Structure

```
src/
  routes/              # File-based routes
    __root.tsx         # Root layout
    index.tsx          # Home page
  components/          # React components
  hooks/               # Custom hooks
  router.tsx           # Router configuration
  styles.css           # Global styles + Tailwind
```

## Routing

File-based routing with TanStack Router:

- `index.tsx` - Home page ("/")
- `__root.tsx` - Root layout (wraps all routes)
- `$param.tsx` - Dynamic routes

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return <div>Home</div>
}
```

## Patterns

### Components

```typescript
// button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      className="bg-slate-900 text-white p-4"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Styling

Tailwind CSS v4 with Vite plugin:

```typescript
<div className="bg-slate-900 text-white p-4">
  Content
</div>
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

| Category   | Convention | Example      |
| ---------- | ---------- | ------------ |
| Files      | kebab-case | `button.tsx` |
| Components | PascalCase | `Button`     |
| Hooks      | useXxx     | `useDeck`    |
| Types      | PascalCase | `PageProps`  |

## Dependencies

- `@tanstack/react-start` - Full-stack framework
- `@tanstack/react-router` - File-based routing
- `tailwindcss` - Styling
- `@mnestia/core` - Shared state management
- `react` ^19.2.0

## shadcn/ui Components

Uses shadcn@canary with Tailwind CSS v4 and radix-ui (base-ui merged into radix).

### Adding Components

```bash
# Add a single component
bunx shadcn@canary add button -y

# Add multiple components
bunx shadcn@canary add button slider card -y

# Add with overwrite
bunx shadcn@canary add button -y --overwrite
```

Components are installed to `src/components/ui/` and use:

- `radix-ui` - Modern, accessible primitives (base-ui merged into radix)
- `class-variance-authority` - Component variants
- `tailwind-merge` + `clsx` - Class name utilities
- `lucide-react` - Icons

### Available Components

See [shadcn/ui registry](https://ui.shadcn.com/docs/components) for full list.

Common components:

- `button` - Button with variants
- `slider` - Range input
- `card` - Card container
- `dialog` - Modal dialog
- `dropdown-menu` - Dropdown menu
- `input` - Text input
- `select` - Select dropdown

## Notes

- Uses Vite for bundling
- File-based routing is automatic
- Route tree generated at build time
- shadcn components use `@/` path alias (configured in tsconfig.json)
