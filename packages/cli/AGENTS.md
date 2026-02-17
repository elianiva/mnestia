# @mnestia/cli

CLI tool for Mnestia slide deck framework.

## Commands

```bash
bun run build         # No build step (TypeScript direct)
bun run dev           # No dev step
bun run lint          # Lint with oxlint
bun run format        # Format with oxfmt
bun run typecheck     # Type check with tsc
bun test              # Run tests
```

## Usage

```bash
# Via bunx
bunx @mnestia/cli create my-deck

# Direct
./src/index.ts create my-deck
```

## File Structure

```
src/
  index.ts             # CLI entry point
  commands/            # CLI commands
    create.ts
  utils/               # Utilities
template/              # Project templates
```

## Patterns

### Commands

Use `@effect/cli` for command definitions:

```typescript
// commands/create.ts
import { Command } from "@effect/cli";
import { Effect } from "effect";

export const createCommand = Command.make("create", { name: Args.text() }, ({ name }) =>
  Effect.gen(function* () {
    yield* Effect.log(`Creating deck: ${name}`);
  })
);
```

## Dependencies

- `effect` - Effect-TS core
- `@effect/cli` - CLI framework
- `@effect/platform` - Platform abstraction
- `@effect/platform-bun` - Bun runtime support

<!-- effect-solutions:start -->
## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `.reference/effect/` for real implementations (run `effect-solutions setup` first)

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.
<!-- effect-solutions:end -->
