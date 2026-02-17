# Presentation Editor Design Plan

## Problem Statement
Build a Slidev-like presentation editor with explicit APIs. Core requirements:
- `@mnestia/core` - headless logic (no styling)
- `@mnestia/web` - web UI using shadcn/ui
- Theme system: `mnestia-theme-*` packages discoverable via CLI
- Text-based editor (no drag/drop)
- `defineDeck([...])` API for deck definition
- TSX and MDX slide support with metadata

## Current State
- Monorepo with packages: core, web, server
- Core: Currently just a console.log stub
- Web: TanStack Router + React setup with Tailwind
- Using Bun for build/runtime

## Goals
1. Create modular theme architecture
2. Support slide authoring via code (no visual builder)
3. Provide keyboard-driven navigation
4. Enable theme marketplace via npm

## Open Questions
1. ~~Package naming~~: **DECIDED** - Use `@mnestia/*` namespace
2. ~~Theme discovery~~: **DECIDED** - Both npm search + keyword and package.json deps
3. ~~CLI package~~: **DECIDED** - Create `@mnestia/cli` package
4. ~~Keyboard navigation~~: **DECIDED** - Both standard arrows and vim-style, configurable

## Decisions Log
- **Namespace**: `@mnestia/*` across all packages
- **CLI**: Dedicated `@mnestia/cli` for theme management and deck scaffolding
- **Theme Discovery**: npm search (`mnestia-theme-*` keyword) + scan package.json deps
- **Navigation**: Configurable - standard arrows (space, arrows) or vim (h/j/k/l)

## Decisions Log (Continued)
- **Transitions**: Hybrid approach - CSS for simple, JS for complex animations
- **MDX Compilation**: Build-time compilation for better performance
- **Base Theme**: Themes are standalone, but provide `@mnestia/theme-base` as starting point
- **Export**: HTML (static hosting), PDF, and individual slide images (PNG/JPEG)
- **Presenter Mode**: Full features including remote device control
- **Components**: Both - themes provide base components, users can extend/override
- **Theme Config**: JS/TS config file (`theme.config.ts`)
- **Live Reload**: HMR enabled by default for slide files

## Architecture Overview (Informed by Slidev)

### Package Structure

Inspired by Slidev's modular approach but adapted for our React-based architecture:

```
@mnestia/
├── types           - Shared TypeScript definitions (contracts)
├── parser          - MDX/frontmatter parsing at build time
├── core            - Headless deck/slide logic
├── client          - React components, composables, state (replaces web)
├── cli             - Dev server, scaffolding, export commands
├── create-deck     - `npm create @mnestia/deck` scaffolding
├── create-theme    - `npm create @mnestia/theme` scaffolding
└── themes/
    └── theme-base  - Default theme with layouts & components
```

### Types Package (@mnestia/types)

**Lesson from Slidev**: Centralized types prevent circular deps and provide API contracts.

```ts
// @mnestia/types
export interface Slide {
  id: string;
  index: number;
  component: () => Promise<SlideModule>;
  frontmatter: SlideFrontmatter;
  filepath: string;
}

export interface SlideFrontmatter {
  layout?: string;
  transition?: TransitionConfig;
  background?: string;
  notes?: string;
  clicks?: number; // For fragment animations
}

export interface DeckConfig {
  slides: Slide[];
  theme: string;
  navigation: NavigationConfig;
  aspectRatio: '16/9' | '4/3' | string;
  export: ExportConfig;
}

export interface ThemeModule {
  name: string;
  layouts: Record<string, React.ComponentType>;
  components: Record<string, React.ComponentType>;
  styles: string;
  setup?: () => void;
}
```

### Parser Package (@mnestia/parser)

**Lesson from Slidev**: Separate parser for build-time vs runtime.

**Responsibilities:**
- Parse MDX → AST at build time (not runtime)
- Extract frontmatter from MDX
- Transform TSX slides (extract `options` export)
- Generate slide manifest JSON for HMR

**Key Functions:**
```ts
export async function parseSlide(filePath: string): Promise<ParsedSlide>
export function extractFrontmatter(content: string): SlideFrontmatter
export function generateSlideManifest(slides: Slide[]): SlideManifest
```

### Core Package (@mnestia/core)

**Responsibilities:**
- Deck state machine (current slide, navigation history)
- Keyboard navigation (vim/standard/both modes)
- Theme resolution and loading
- Export orchestration (HTML, PDF, PNG)

**Key Exports:**
```ts
export function defineDeck(config: DeckDefinitionInput): DeckConfig
export function createDeckStore(config: DeckConfig): DeckStore
export function resolveTheme(themeName: string): Promise<ThemeModule>
export function exportDeck(format: 'html' | 'pdf' | 'png', options: ExportOptions): Promise<void>
```

### Client Package (@mnestia/client) - Replaces @mnestia/web

**Lesson from Slidev**: Separate client logic from framework boilerplate.

**Structure:**
```
packages/client/
├── components/        - Reusable slide components
│   ├── SlideViewer.tsx
│   ├── SlideLayout.tsx
│   ├── PresenterView.tsx
│   ├── SlideEditor.tsx
│   └── SlideThumbnail.tsx
├── composables/       - React hooks (like Slidev's composables)
│   ├── useDeck.ts     - Deck state & navigation
│   ├── useSlide.ts    - Current slide access
│   ├── useClicks.ts   - Fragment/step animations
│   ├── usePresenter.ts - Presenter mode sync
│   └── useTheme.ts    - Theme loading
├── state/             - State management
│   └── deckStore.ts   - Zustand/Jotai store
├── logic/             - Business logic
│   ├── navigation.ts  - Keyboard handlers
│   ├── export.ts      - Export utilities
│   └── hmr.ts         - Hot reload handling
└── App.tsx            - Main app component
```

**Uses shadcn/ui:**
- Dialog, Select, Tabs for UI controls
- Button for actions
- Slider for progress

### Theme System

**Base Theme (@mnestia/theme-base):**

Layouts (inspired by Slidev's `layouts/`):
```
theme-base/
├── layouts/
│   ├── cover.tsx      - Full-screen title slide
│   ├── center.tsx     - Centered content
│   ├── split.tsx      - Two-column layout
│   ├── default.tsx    - Standard content slide
│   └── grid.tsx       - Multi-column grid
├── components/
│   ├── CodeBlock.tsx  - Syntax highlighted code
│   ├── Image.tsx      - Responsive image with caption
│   ├── Quote.tsx      - Blockquote with attribution
│   ├── Table.tsx      - Styled table
│   └── Click.vue      - Fragment/animation wrapper
├── styles/
│   ├── index.css      - Theme CSS variables
│   ├── layouts.css    - Layout-specific styles
│   └── components.css - Component styles
└── setup.ts           - Theme initialization
```

**Third-party Themes (`mnestia-theme-*`):**

```ts
// theme.config.ts
import { defineTheme } from '@mnestia/core';

export default defineTheme({
  name: 'dracula',
  extends: '@mnestia/theme-base', // Optional inheritance
  
  layouts: {
    // Override or add layouts
    cover: () => import('./layouts/Cover'),
    matrix: () => import('./layouts/Matrix'),
  },
  
  components: {
    // Override base components or add new ones
    CodeBlock: () => import('./components/CodeBlock'),
    GlitchText: () => import('./components/GlitchText'),
  },
  
  styles: './styles/index.css',
  
  setup() {
    // Theme initialization (fonts, global styles)
  },
});
```

### CLI Package (@mnestia/cli)

**Lesson from Slidev**: CLI handles dev server and build orchestration.

**Commands:**
```bash
mnestia init [name]              # Scaffold new deck
mnestia theme search [keyword]   # Search npm registry
mnestia theme install <name>     # Install theme from npm
mnestia theme create [name]      # Scaffold new theme
mnestia dev                      # Start dev server (Vite + HMR)
mnestia build                    # Build static export
mnestia export --format pdf      # Export to PDF/PNG
mnestia export --format png --slides 1-10  # Export specific slides
```

**Vite Integration:**
```ts
// mnestia.config.ts
import { defineConfig } from '@mnestia/cli';

export default defineConfig({
  theme: '@mnestia/theme-base',
  slides: './slides/**/*.mdx',
  deck: './deck.ts',
  
  vite: {
    // Custom vite config
  },
  
  export: {
    withClicks: true,
    dark: true,
  },
});
```

### Data Flow

**1. Build Time (Vite Plugin):**
```
deck.ts
  ↓
resolve slide imports (MDX/TSX)
  ↓
@mnestia/parser transforms MDX → JSX
  ↓
extract frontmatter/options
  ↓
generate slide-manifest.json (for HMR)
  ↓
virtual:mnestia/slides module
```

**2. Runtime:**
```
App.tsx
  ↓
DeckProvider (loads theme via dynamic import)
  ↓
SlideViewer (renders current slide)
  ↓
Layout wrapper (from theme)
  ↓
Slide content (user component)
```

**3. Navigation:**
```
Keyboard Event
  ↓
useDeck hook (navigation logic)
  ↓
deckStore (state update)
  ↓
SlideViewer re-render
  ↓
URL update (/present?slide=5&click=2)
```

### HMR (Hot Module Replacement)

**Lesson from Slidev**: Critical for slide development.

```ts
// vite.config.ts (injected by @mnestia/cli)
export default {
  plugins: [
    mnestiaPlugin({
      // Watch slide files
      hmr: {
        slides: './slides/**/*.{mdx,tsx}',
        deck: './deck.ts',
        theme: './theme.config.ts',
      },
    }),
  ],
};
```

On file change:
1. Re-parse changed slide
2. Update slide-manifest.json
3. Trigger HMR update
4. Preserve current slide index

### File Structure (User Deck)

```
my-presentation/
├── mnestia.config.ts     # Config (vite, theme, export)
├── deck.ts               # defineDeck([...])
├── theme.config.ts       # Optional theme overrides
├── slides/
│   ├── 01-intro.mdx
│   ├── 02-architecture.tsx
│   └── 03-demo.mdx
├── public/
│   └── images/
└── components/
    └── CustomWidget.tsx  # User components
```

### Comparison with Slidev

| Feature | Slidev (Vue) | Mnestia (React) |
|---------|--------------|-----------------|
| Framework | Vue 3 | React 19 |
| Styling | UnoCSS | Tailwind + shadcn |
| Parser | Built into parser pkg | Separate @mnestia/parser |
| State | Pinia | Zustand/Jotai |
| CLI | slidev | mnestia |
| Themes | slidev-theme-* | mnestia-theme-* |
| HMR | Yes (vite) | Yes (vite) |
| Components | Built-in components | shadcn + theme components |

---

## Additional Gaps Identified & Resolved

### 1. Animation/Fragment System
- **Decision**: React hook-based system (`useClicks()`) with `<Click />` wrapper component
- **API**:
  ```tsx
  import { Click, useClicks } from '@mnestia/client';
  
  export default function Slide() {
    const { currentClick, totalClicks } = useClicks();
    
    return (
      <div>
        <Click>Visible on step 1</Click>
        <Click step={2}>Visible on step 2</Click>
        <Click from={2} to={4}>Steps 2-4</Click>
      </div>
    );
  }
  ```

### 2. Remote Presenter Sync
- **Decision**: WebSocket server for presenter mode sync
- **Package**: `@mnestia/presenter` (runs alongside deck)
- **Features**:
  - Presenter `/presenter` → Controls view
  - Viewer `/present` → Follows presenter
  - QR code for quick pairing
  - Optional password protection

### 3. Error Handling
- **Decision**: Error boundaries with friendly UI per slide
- **Strategy**:
  - Each slide wrapped in error boundary
  - Shows slide with error placeholder, deck continues
  - Error details logged to console
  - CLI shows warnings on build

### 4. Interactivity
- **Decision**: Full interactivity supported
- **Implementation**:
  - Slides are regular React components
  - State persists during presentation (unless refresh)
  - Reset state on navigation option in config

### 5. Assets
- **Decision**: public/ folder only for assets
- **Constraints**:
  - Images/videos/fonts must be in public/
  - No bundler import support (simpler architecture)
  - Themes define asset paths via CSS variables

### 6. Performance
- **Decision**: Full preload of all slides
- **Rationale**: Presentations are typically <100 slides
- **Loading strategy**:
  - Deck loads all slides at mount
  - Adjacent slides pre-rendered (current ± 2)
  - Async loading acceptable for instant navigation

### 7. Testing Strategy
- **Decision**: Full coverage
- **Scope**:
  - **Parser**: Unit tests for MDX/TSX parsing, frontmatter extraction
  - **Core**: Unit tests for navigation, state management
  - **Client**: Component tests for layouts, integration tests for hooks
  - **CLI**: E2E tests for scaffold, build, export flows
  - **Themes**: Snapshot tests for each layout

### 8. MDX Compilation
- **Decision**: @mdx-js/mdx latest (v3.x)
- **Build process**:
  - MDX → JSX transformation at build time
  - Remark plugins for frontmatter
  - Rehype plugins for syntax highlighting

### 9. Backgrounds
- **Decision**: Both theme defaults + per-slide frontmatter overrides
- **Frontmatter**:
  ```yaml
  ---
  background: /images/bg.jpg
  backgroundPosition: center
  backgroundSize: cover
  backgroundOpacity: 0.5
  ---
  ```

### 10. Font System
- **Decision**: Built-in font loading API in core
- **API**:
  ```ts
  // theme.config.ts
  export default defineTheme({
    fonts: {
      sans: ['Inter', 'system-ui'],
      mono: ['Fira Code', 'monospace'],
      provider: 'google', // 'google' | 'bunny' | 'none'
    },
  });
  ```

### 11. Data Persistence
- **Decision**: File-based only (no database)
- **Cache locations**:
  - `.mnestia/cache/` - Build cache
  - `.mnestia/themes.json` - Theme registry
  - `.mnestia/presenter.json` - Presenter session config

### 12. SEO
- **Decision**: No SEO for presentations (presentations aren't indexable content)
- **Meta tags**: Optional `<title>` for browser tab only

### 13. Dark Mode
- **Decision**: Theme default + user override
- **Implementation**:
  - Theme defines CSS variables for light/dark
  - Toggle button in presentation mode
  - Preference saved to localStorage

### 14. URL Routing
- **Decision**: `/slide/1` pattern
- **Structure**:
  - `/slide/:number` - Specific slide
  - `/slide/:number?click=:step` - With click step
  - `/presenter` - Presenter mode

### 15. Keyboard Shortcuts
- **Decision**: Config file overrides
- **Config**:
  ```ts
  // mnestia.config.ts
  export default defineConfig({
    shortcuts: {
      next: ['ArrowRight', 'Space', 'l'],
      prev: ['ArrowLeft', 'h'],
      togglePresenter: ['p'],
      toggleFullscreen: ['f'],
    },
  });
  ```

## Final Decisions

### Plugin System
- **Decision**: Full plugin system
- **API**:
  ```ts
  // my-plugin.ts
  export default definePlugin({
    name: 'math',
    transformSlide(content) {
      // Transform markdown before parsing
      return content.replace(/\$\$...\$\$/g, renderMath);
    },
    components: {
      Math: () => import('./Math'),
    },
  });
  
  // mnestia.config.ts
  export default defineConfig({
    plugins: ['@mnestia/plugin-math'],
  });
  ```
- **Plugin types**: Transform, Component, Theme hook, CLI command

### Analytics
- **Decision**: No built-in analytics
- **Rationale**: Users can add Google Analytics, Plausible, etc via custom component
- **Extension point**: Header injection in theme setup

### Transitions
- **Decision**: Both CSS (default) + Framer Motion (optional)
- **Implementation**:
  ```ts
  // CSS transitions (default)
  transition: 'slide-left' | 'fade' | 'zoom' | 'none'
  
  // Framer Motion (optional, plugin)
  transition: {
    type: 'framer-motion',
    config: { initial, animate, exit }
  }
  ```

### Internationalization
- **Decision**: Single language per deck (no i18n)
- **Rationale**: Presentations are typically authored in one language
- **Future**: Could add via plugin if needed

### Version Control
- **Decision**: Git-based, no special version control features
- **Approach**: Users use git normally for slide files
- **Future**: Could add deck changelog feature later

---

## Complete Architecture Summary

### Package Dependency Graph
```
@mnestia/types        (no deps, contracts)
      ↓
@mnestia/parser       (types)
      ↓
@mnestia/core         (types, parser)
      ↓
@mnestia/client       (types, core)
      ↓
@mnestia/cli          (types, parser, core, client)
```

### External Dependencies by Package
- **types**: None (pure types)
- **parser**: @mdx-js/mdx, unified, remark, rehype
- **core**: zustand (state), playwright (PDF/PNG export)
- **client**: react, react-dom, shadcn/ui, framer-motion (optional)
- **cli**: vite, commander, ora, chalk, prompts

### Build Output
- **types**: .d.ts files only
- **parser**: ES modules
- **core**: ES modules
- **client**: ES modules + App.tsx entry
- **cli**: Binaries + templates

---

## Implementation Readiness Checklist

- ✅ Package structure defined
- ✅ API contracts designed
- ✅ Theme system specified
- ✅ CLI commands listed
- ✅ State management chosen (Zustand)
- ✅ MDX parser selected (@mdx-js/mdx)
- ✅ Error handling strategy defined
- ✅ Testing strategy defined
- ✅ All gaps resolved

**Plan is complete. Ready to move to implementation phase?**

If yes, I'll create:
1. Package scaffolding (types, parser, core, client, cli)
2. Build configuration
3. Core APIs (defineDeck, deckStore)
4. Parser implementation
5. Client components (SlideViewer, layouts)
6. CLI commands (dev, build, export)
7. Base theme
8. create-deck and create-theme scaffolding tools
