import { Effect, Exit, ManagedRuntime } from "effect";
import type { ServerDeckState } from "@mnestia/schema";
import type { SlideService } from "@/domain/ports/slide-service";
import { formatEffectCause } from "@/infra/ws/effect-runtime";
import { captureEffectError } from "@/infra/config/sentry-capture";

interface ToolResult {
  success: boolean;
  slideCount: number;
  currentSlide: number;
}

/**
 * Convert a successful `ServerDeckState` into the standardized
 * tool result shape returned to the AI agent.
 */
export function stateToResult(state: ServerDeckState): ToolResult {
  return {
    success: true,
    slideCount: state.slides.length,
    currentSlide: state.currentSlide,
  };
}

/**
 * A static failure result used when an Effect execution fails.
 */
export function failureResult(): ToolResult {
  return {
    success: false,
    slideCount: 0,
    currentSlide: 0,
  };
}

export type BroadcastFn = (
  deckId: string,
  state: ServerDeckState
) => void;

/**
 * Run a `SlideService` Effect through the managed runtime, capturing
 * and logging any errors. On success the broadcast callback is invoked
 * and a `ToolResult` is returned. On failure, a standardized failure
 * result is returned after the error has been logged and sent to Sentry.
 */
export async function runToolEffect(
  effect: Effect.Effect<ServerDeckState, unknown, SlideService>,
  runtime: ManagedRuntime.ManagedRuntime<SlideService, never>,
  deckId: string,
  broadcast: BroadcastFn
): Promise<ToolResult> {
  const exit = await runtime.runPromiseExit(effect);

  if (Exit.isSuccess(exit)) {
    broadcast(deckId, exit.value);
    return stateToResult(exit.value);
  }

  const errorMessage = formatEffectCause(exit.cause);
  // eslint-disable-next-line no-console
  console.error("[agent-service] Effect execution failed:", errorMessage);
  captureEffectError(exit.cause);

  return failureResult();
}
