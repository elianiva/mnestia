import { Effect, Exit, ManagedRuntime } from "effect";
import * as v from "valibot";
import type { ServerDeckState } from "@mnestia/schema";
import { SlideCommandSchema, type SlideCommand } from "@mnestia/schema";
import { SlideService } from "../domain/slide-service";
import { formatEffectCause } from "../ws/effect-runtime";
import { captureEffectError } from "../config/sentry-capture";

// ── Command Parsing ───────────────────────────────────────────────

const JSON_BLOCK_RE = /```json\s*\n([\s\S]*?)```/g;

/**
 * Extract SlideCommand objects from AI text response.
 * Looks for ```json fenced blocks, validates each against SlideCommandSchema.
 */
export function parseSlideCommands(text: string): SlideCommand[] {
  const commands: SlideCommand[] = [];

  for (const match of text.matchAll(JSON_BLOCK_RE)) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const result = v.safeParse(SlideCommandSchema, parsed);
      if (result.success) {
        commands.push(result.output);
      }
    } catch {
      // Skip malformed JSON blocks
    }
  }

  return commands;
}

// ── Command Execution ─────────────────────────────────────────────

export type BroadcastFn = (
  deckId: string,
  state: ServerDeckState
) => void;

async function runServiceEffect<A, E>(
  effect: Effect.Effect<A, E, SlideService>,
  runtime: ManagedRuntime.ManagedRuntime<SlideService, never>
): Promise<A | undefined> {
  const exit = await runtime.runPromiseExit(effect);

  if (Exit.isSuccess(exit)) {
    return exit.value;
  }

  const errorMessage = formatEffectCause(exit.cause);

  // Log + capture via Effect-aware utilities
  Effect.runSync(
    Effect.logError("Effect execution failed", { error: errorMessage })
  );
  captureEffectError(exit.cause);

  return undefined;
}

/**
 * Execute a list of SlideCommands via SlideService, broadcast results.
 */
export async function executeSlideCommands(
  commands: SlideCommand[],
  runtime: ManagedRuntime.ManagedRuntime<SlideService, never>,
  broadcast: BroadcastFn
): Promise<{ executed: number; failed: number }> {
  let executed = 0;
  let failed = 0;

  for (const command of commands) {
    const effect = Effect.gen(function* () {
      const service = yield* SlideService;
      return yield* service.executeCommand(command);
    }).pipe(
      Effect.tap(() =>
        Effect.annotateCurrentSpan("tool.name", command.type)
      ),
      Effect.tap(() =>
        Effect.annotateCurrentSpan("deck.id", command.deckId)
      ),
      Effect.withSpan(`agent.tool.${command.type.toLowerCase()}`)
    );

    const state = await runServiceEffect(effect, runtime);

    if (state) {
      broadcast(command.deckId, state);
      executed++;
    } else {
      failed++;
    }
  }

  return { executed, failed };
}
