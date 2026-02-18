import { Effect, Exit, ManagedRuntime } from "effect";
import type { ServerDeckState } from "@mnestia/schema";
import { SlideService } from "../domain/slide-service";
import { formatEffectCause } from "../ws/effect-runtime";
import { captureEffectError } from "../config/sentry-capture";
import {
  addSlideDef,
  removeSlideDef,
  updateSlideDef,
  reorderSlidesDef,
  changeCurrentSlideDef,
} from "./agent-tools";

interface ToolResult {
  success: boolean;
  slideCount: number;
  currentSlide: number;
}

function stateToResult(state: ServerDeckState): ToolResult {
  return {
    success: true,
    slideCount: state.slides.length,
    currentSlide: state.currentSlide,
  };
}

function failureResult(): ToolResult {
  return {
    success: false,
    slideCount: 0,
    currentSlide: 0,
  };
}

async function runServiceEffect<A, E>(
  effect: Effect.Effect<A, E, SlideService>,
  runtime: ManagedRuntime.ManagedRuntime<SlideService, never>
): Promise<A | undefined> {
  const exit = await runtime.runPromiseExit(effect);

  if (Exit.isSuccess(exit)) {
    return exit.value;
  }

  // Log the error instead of silently swallowing it
  const errorMessage = formatEffectCause(exit.cause);
  // eslint-disable-next-line no-console
  console.error("[agent-service] Effect execution failed:", errorMessage);
  captureEffectError(exit.cause);

  return undefined;
}

export type BroadcastFn = (
  deckId: string,
  state: ServerDeckState
) => void;

export function createServerTools(
  runtime: ManagedRuntime.ManagedRuntime<SlideService, never>,
  broadcast: BroadcastFn
) {
  const addSlide = addSlideDef.server(
    async ({ deckId, content, layout, notes, position }) => {
      const effect = Effect.gen(function* () {
        const service = yield* SlideService;
        return yield* service.addSlide(
          deckId,
          { content, layout, notes },
          position
        );
      }).pipe(
        Effect.tap(() => Effect.annotateCurrentSpan("tool.name", "add_slide")),
        Effect.tap(() => Effect.annotateCurrentSpan("deck.id", deckId)),
        Effect.withSpan("agent.tool.add_slide")
      );

      const state = await runServiceEffect(effect, runtime);
      if (!state) return failureResult();

      broadcast(deckId, state);
      return stateToResult(state);
    }
  );

  const removeSlide = removeSlideDef.server(
    async ({ deckId, slideIndex }) => {
      const effect = Effect.gen(function* () {
        const service = yield* SlideService;
        return yield* service.removeSlide(deckId, slideIndex);
      }).pipe(
        Effect.tap(() => Effect.annotateCurrentSpan("tool.name", "remove_slide")),
        Effect.tap(() => Effect.annotateCurrentSpan("deck.id", deckId)),
        Effect.tap(() => Effect.annotateCurrentSpan("slide.index", slideIndex)),
        Effect.withSpan("agent.tool.remove_slide")
      );

      const state = await runServiceEffect(effect, runtime);
      if (!state) return failureResult();

      broadcast(deckId, state);
      return stateToResult(state);
    }
  );

  const updateSlide = updateSlideDef.server(
    async ({ deckId, slideIndex, content, layout, notes }) => {
      const effect = Effect.gen(function* () {
        const service = yield* SlideService;
        return yield* service.updateSlide(deckId, slideIndex, {
          content,
          layout,
          notes,
        });
      }).pipe(
        Effect.tap(() => Effect.annotateCurrentSpan("tool.name", "update_slide")),
        Effect.tap(() => Effect.annotateCurrentSpan("deck.id", deckId)),
        Effect.tap(() => Effect.annotateCurrentSpan("slide.index", slideIndex)),
        Effect.withSpan("agent.tool.update_slide")
      );

      const state = await runServiceEffect(effect, runtime);
      if (!state) return failureResult();

      broadcast(deckId, state);
      return stateToResult(state);
    }
  );

  const reorderSlides = reorderSlidesDef.server(
    async ({ deckId, fromIndex, toIndex }) => {
      const effect = Effect.gen(function* () {
        const service = yield* SlideService;
        return yield* service.reorderSlides(deckId, fromIndex, toIndex);
      }).pipe(
        Effect.tap(() => Effect.annotateCurrentSpan("tool.name", "reorder_slides")),
        Effect.tap(() => Effect.annotateCurrentSpan("deck.id", deckId)),
        Effect.tap(() => Effect.annotateCurrentSpan("slide.from_index", fromIndex)),
        Effect.tap(() => Effect.annotateCurrentSpan("slide.to_index", toIndex)),
        Effect.withSpan("agent.tool.reorder_slides")
      );

      const state = await runServiceEffect(effect, runtime);
      if (!state) return failureResult();

      broadcast(deckId, state);
      return stateToResult(state);
    }
  );

  const changeCurrentSlide = changeCurrentSlideDef.server(
    async ({ deckId, slideIndex }) => {
      const effect = Effect.gen(function* () {
        const service = yield* SlideService;
        return yield* service.changeCurrentSlide(deckId, slideIndex);
      }).pipe(
        Effect.tap(() => Effect.annotateCurrentSpan("tool.name", "change_current_slide")),
        Effect.tap(() => Effect.annotateCurrentSpan("deck.id", deckId)),
        Effect.tap(() => Effect.annotateCurrentSpan("slide.index", slideIndex)),
        Effect.withSpan("agent.tool.change_current_slide")
      );

      const state = await runServiceEffect(effect, runtime);
      if (!state) return failureResult();

      broadcast(deckId, state);
      return stateToResult(state);
    }
  );

  return [
    addSlide,
    removeSlide,
    updateSlide,
    reorderSlides,
    changeCurrentSlide,
  ] as const;
}
