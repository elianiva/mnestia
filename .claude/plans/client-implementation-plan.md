# Client Package Implementation Plan

## Overview
Implement the @mnestia/web client package components and logic per PRD S4-C2 to S4-C9.

## Design Decisions (Confirmed)

1. **Routing**: `/slide/:number` pattern (TanStack Router file-based)
2. **Theme Loading**: Loaded once at app initialization, cached for session
3. **State Persistence**: URL (`/slide/:number`) + localStorage (`mnestia:currentSlide`)
4. **Presenter Mode**: Out of scope (future feature)

## Implementation Phases

### Phase 1: shadcn Components Setup (S4-C2 partial)
**Dependencies**: None

Add required shadcn/ui components for navigation controls.

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ui/button.tsx` | Create | Navigation buttons (prev/next) |
| `src/components/ui/slider.tsx` | Create | Progress indicator |

**Command**: `bunx shadcn@canary add button slider -y`

---

### Phase 2: Theme Resolution Logic (S4-C5)
**Dependencies**: None

Create dynamic theme loading system.

| File | Action | Purpose |
|------|--------|---------|
| `src/logic/resolve-theme.ts` | Create | Async theme loading with cache |

**Implementation Details**:
- Function: `resolveTheme(themeName: string): Promise<ThemeModule>`
- Support npm package names (`@mnestia/theme-base`)
- Cache loaded themes in module-level Map
- Fallback error handling with console warning

---

### Phase 3: Deck Context Provider (S4-C3, S4-C4)
**Dependencies**: Phase 2 (for theme loading)

Create React Context for deck state and actions.

| File | Action | Purpose |
|------|--------|---------|
| `src/components/deck-provider.tsx` | Create | Context provider with atom initialization |
| `src/hooks/use-deck.ts` | Create | Hook to access deck state/actions |
| `src/lib/deck-context.ts` | Create | Context definition (separate for tree-shaking) |

**Implementation Details**:
- `DeckProvider` accepts `DeckConfig` prop
- Initializes atom with `createDeckAtom(config)` from @mnestia/core
- Loads theme via `resolveTheme(config.theme)` on mount
- Provides both atom and theme via context
- `useDeck()` returns: `{ currentSlide, totalSlides, slides, nextSlide, prevSlide, goToSlide, goToFirstSlide, goToLastSlide, canGoNext, canGoPrev, theme }`

---

### Phase 4: Slide Rendering (S4-C6)
**Dependencies**: Phase 3

Create slide viewer component.

| File | Action | Purpose |
|------|--------|---------|
| `src/components/slide-viewer.tsx` | Create | Renders current slide with theme layout |

**Implementation Details**:
- Uses `useDeck()` to get current slide and theme
- Resolves layout from `slide.frontmatter.layout` (default: 'default')
- Gets layout component from `theme.layouts[layoutName]`
- Wraps slide component in layout
- Handles layout not found error gracefully

---

### Phase 5: Navigation Controls (S4-C7)
**Dependencies**: Phase 1, Phase 3

Create navigation UI component.

| File | Action | Purpose |
|------|--------|---------|
| `src/components/navigation-controls.tsx` | Create | Progress bar and prev/next buttons |

**Implementation Details**:
- Uses shadcn Button for prev/next
- Uses shadcn Slider for progress (controlled, 0 to totalSlides-1)
- Displays "current / total" counter
- Buttons disabled based on `canGoNext` / `canGoPrev`
- Styled with Tailwind (positioned fixed at bottom)

---

### Phase 6: Route Setup with Persistence (S4-C8, S4-C9)
**Dependencies**: Phase 3, Phase 4, Phase 5

Set up routes with URL persistence and keyboard navigation.

| File | Action | Purpose |
|------|--------|---------|
| `src/routes/slide.$number.tsx` | Create | Dynamic route for slides |
| `src/routes/index.tsx` | Modify | Redirect to /slide/1 |
| `src/hooks/use-slide-persistence.ts` | Create | Sync URL with atom and localStorage |
| `src/routes/__root.tsx` | Modify | Add keyboard navigation and DeckProvider |

**Implementation Details**:

**use-slide-persistence.ts**:
- Watches `currentSlide` from atom via useAtom subscription
- Updates URL via TanStack Router navigate
- Saves to localStorage on change
- On mount: checks URL param, falls back to localStorage, defaults to 0

**slide.$number.tsx**:
- Route component that renders `SlideViewer` + `NavigationControls`
- Validates `:number` param is valid slide index
- Redirects to /slide/1 if invalid

**__root.tsx**:
- Wraps children in `DeckProvider` (needs deck config source)
- Uses `useKeyboardNavigation` from @mnestia/core
- Connects keyboard actions to deck atom methods

**index.tsx**:
- BeforeLoad/loader redirects to `/slide/1`

---

### Phase 7: Test Deck Configuration
**Dependencies**: Phase 6

Create route that loads a test deck for development.

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/test-deck.ts` | Create | Sample deck configuration for testing |

**Implementation Details**:
- Define test slides (3-4 sample slides)
- Use @mnestia/theme-base
- Import from local files (not virtual module yet)
- Used by DeckProvider in __root.tsx for dev

---

## File Structure After Implementation

```
packages/web/src/
├── components/
│   ├── ui/
│   │   ├── button.tsx          # shadcn (new)
│   │   └── slider.tsx          # shadcn (new)
│   ├── deck-provider.tsx       # React context (new)
│   ├── slide-viewer.tsx        # Slide rendering (new)
│   └── navigation-controls.tsx # Navigation UI (new)
├── hooks/
│   ├── use-deck.ts             # Deck context hook (new)
│   └── use-slide-persistence.ts # URL/localStorage sync (new)
├── lib/
│   ├── utils.ts                # Existing
│   ├── deck-context.ts         # Context definition (new)
│   ├── test-deck.ts            # Dev test data (new)
│   └── resolve-theme.ts        # Theme loader (new)
├── routes/
│   ├── __root.tsx              # Modify: add provider + keyboard
│   ├── index.tsx               # Modify: redirect to /slide/1
│   └── slide.$number.tsx       # New: slide route
├── styles.css                  # Existing
└── router.tsx                  # Existing
```

## Dependency Order

```
Phase 1: shadcn components
    ↓
Phase 2: resolve-theme.ts
    ↓
Phase 3: deck-context.ts → deck-provider.tsx → use-deck.ts
    ↓
Phase 4: slide-viewer.tsx
    ↓
Phase 5: navigation-controls.tsx
    ↓
Phase 6: use-slide-persistence.ts → slide.$number.tsx → __root.tsx → index.tsx
    ↓
Phase 7: test-deck.ts
```

## Testing Strategy

Each phase should include:
1. Type check: `moon run :typecheck`
2. Lint check: `moon run :lint`
3. Manual test: `moon run :dev` and verify in browser

## Verification Checklist

- [ ] Navigate with arrow keys (next/prev)
- [ ] Navigate with vim keys (hjkl) when mode is "both"
- [ ] Progress slider updates on navigation
- [ ] Clicking slider jumps to slide
- [ ] URL updates to /slide/:number
- [ ] Refresh restores to correct slide
- [ ] First slide: prev button disabled
- [ ] Last slide: next button disabled
- [ ] Home key goes to first slide
- [ ] End key goes to last slide
- [ ] Invalid slide number redirects to /slide/1
