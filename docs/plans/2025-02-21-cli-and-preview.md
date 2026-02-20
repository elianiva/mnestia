# Mnestia CLI & Slide Preview Implementation Plan

> **IMPORTANT**: Use plan-execute skill to implement this plan task-by-task.

**Goal:** Create a working CLI that initializes projects and starts a Vite dev server to preview slides, with lazy-loaded slide components.

**Architecture:** Following Slidev's pattern - `@mnestia/web` is a prebuilt client app. The CLI resolves its location, starts Vite with custom plugins that generate virtual modules for lazy-loaded slides. The web app consumes these virtual modules to render slides dynamically.

**Tech Stack:** Effect-TS (CLI), Vite (bundler), React (UI), @effect-atom/atom-react (state), Valibot (schemas)

---

## Phase 1: Virtual Slides Module (vite-plugin)

### Task 1.1: Create Virtual Slides Module Generator
**File:** `packages/vite-plugin/src/virtual/slides.ts` (new)

Create a virtual module template that generates:
```typescript
// virtual:mnestia/slides
import { lazy } from 'react';

export const slides = [
  {
    id: '01-welcome',
    index: 0,
    frontmatter: {},
    component: lazy(() => import('/@fs/Users/.../slides/01-welcome.tsx'))
  },
  // ...
];
```

**Tests:** Verify generated code structure matches expected pattern.

### Task 1.2: Add Virtual Slides Plugin
**File:** `packages/vite-plugin/src/plugins/slides.ts` (modify)

Replace current plugin with one that:
1. Resolves `virtual:mnestia/slides` ID
2. Generates module content from deck config
3. Creates `/@fs/` prefixed imports for actual slide files
4. Supports HMR when slides change

### Task 1.3: Update Deck Plugin
**File:** `packages/vite-plugin/src/plugins/deck.ts` (modify)

Simplify to only handle `virtual:mnestia/deck` for config metadata (without component functions).

### Task 1.4: Export Virtual Module Types
**File:** `packages/vite-plugin/src/virtual/types.ts` (new)

Define `VirtualModuleTemplate` interface and slide module types.

---

## Phase 2: CLI Package Resolution

### Task 2.1: Add Package Resolution Utility
**File:** `packages/cli/src/utils/resolver.ts` (new)

Create functions to resolve package roots:
```typescript
export async function findPkgRoot(dep: string): Promise<string | undefined>;
export async function getRoots(): Promise<{ webRoot: string; userRoot: string }>;
```

Use `vitefu` or `mlly` for resolution (check if already in deps).

### Task 2.2: Update Dev Command
**File:** `packages/cli/src/commands/dev.ts` (modify)

1. Use resolver to find `@mnestia/web` root
2. Pass resolved path to vite-plugin
3. Set Vite root to user's project (not web root)
4. Use `webRoot/src/main.tsx` as entry point

### Task 2.3: Handle Global Installation
**File:** `packages/cli/src/utils/resolver.ts` (modify)

Add support for globally installed CLI resolving local `@mnestia/web`.

---

## Phase 3: Web Package Updates

### Task 3.1: Update SlideViewer for Lazy Components
**File:** `packages/web/src/components/slide-viewer.tsx` (modify)

Update to use `React.Suspense` with lazy-loaded slide components:
```typescript
import { slides } from 'virtual:mnestia/slides';

function SlideViewer() {
  const { currentSlide } = useDeck();
  const slide = slides[currentSlide];
  
  return (
    <Suspense fallback={<SlideLoading />}>
      <slide.component />
    </Suspense>
  );
}
```

### Task 3.2: Create SlideLoading Component
**File:** `packages/web/src/components/slide-loading.tsx` (new)

Simple loading placeholder while slide chunks load.

### Task 3.3: Update Router for Virtual Module
**File:** `packages/web/src/router.tsx` (modify)

Import deck config from `virtual:mnestia/deck` and slides from `virtual:mnestia/slides`.

### Task 3.4: Add Virtual Module Declarations
**File:** `packages/web/src/virtual.d.ts` (new)

```typescript
declare module 'virtual:mnestia/deck' {
  export const deckConfig: DeckConfig;
}

declare module 'virtual:mnestia/slides' {
  export const slides: Array<{
    id: string;
    index: number;
    frontmatter: SlideFrontmatter;
    component: React.LazyExoticComponent<React.ComponentType>;
  }>;
}
```

---

## Phase 4: Build Command

### Task 4.1: Implement Build Command
**File:** `packages/cli/src/commands/build.ts` (modify)

Create static SPA build:
1. Resolve roots (same as dev)
2. Use Vite build API
3. Output to `dist/` in user's project
4. Copy `index.html` and assets

### Task 4.2: Add Build Options
**File:** `packages/cli/src/commands/build.ts` (modify)

Support `--outDir`, `--base` flags.

---

## Phase 5: Integration & Testing

### Task 5.1: Test Dev Server
**Commands:**
```bash
cd packages/cli/test-deck
bun ../../src/index.ts dev
```

Verify:
- Server starts on port 3000
- Slides load lazily (check network tab)
- Navigation works
- HMR works when editing slides

### Task 5.2: Test Build
**Commands:**
```bash
cd packages/cli/test-deck
bun ../../src/index.ts build
```

Verify `dist/` contains working static site.

### Task 5.3: Test Create Flow
**Commands:**
```bash
mkdir -p /tmp/test-mnestia
cd /tmp/test-mnestia
bun /path/to/packages/cli/src/index.ts create test-deck
cd test-deck
bun install
bun run dev  # or mnestia dev
```

---

## Key Implementation Details

### Virtual Module Pattern

```typescript
// In vite plugin
const VIRTUAL_SLIDES_ID = 'virtual:mnestia/slides';
const RESOLVED_SLIDES_ID = '\0' + VIRTUAL_SLIDES_ID;

// Generated code
const code = `
import { lazy } from 'react';
${slides.map((s, i) => 
  `const Slide${i} = lazy(() => import('${s.filepath}'));`
).join('\n')}

export const slides = [
${slides.map((s, i) => `  {
    id: ${JSON.stringify(s.id)},
    index: ${i},
    frontmatter: ${JSON.stringify(s.frontmatter)},
    component: Slide${i}
  }`).join(',\n')}
];
`;
```

### Package Resolution

Use `vitefu` (already in deps via slidev research) or implement with `import.meta.resolve`:

```typescript
async function findPkgRoot(dep: string): Promise<string> {
  const url = await import.meta.resolve(dep);
  return dirname(fileURLToPath(url));
}
```

### Entry Point Handling

The `index.html` in user's project should point to `@mnestia/web` main:

```html
<script type="module" src="/@fs/absolute/path/to/web/src/main.tsx"></script>
```

Or use Vite alias:
```typescript
resolve: {
  alias: {
    '@mnestia/web': webRoot
  }
}
```

Then in HTML:
```html
<script type="module" src="@mnestia/web/src/main.tsx"></script>
```

---

## Dependencies Check

**To Add:**
- `vitefu` - for package resolution (check if needed)

**Already Have:**
- `@effect/cli` - CLI framework
- `vite` - Build tool
- `@mdx-js/rollup` - MDX support

---

## Verification Checklist

- [ ] `mnestia create my-deck` scaffolds project
- [ ] `mnestia dev` starts server on port 3000
- [ ] Slides load lazily (separate chunks in network)
- [ ] Navigation between slides works
- [ ] HMR updates slide on file change
- [ ] `mnestia build` creates static `dist/` folder
- [ ] Built SPA works when served statically
