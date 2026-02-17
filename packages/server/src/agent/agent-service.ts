import { Effect, Exit, ManagedRuntime } from "effect";
import type { ServerDeckState } from "@mnestia/schema";
import { SlideService } from "../domain/slide-service";
import { formatEffectCause } from "../ws/effect-runtime";
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
  console.error("[agent-service] Effect execution failed:", errorMessage);

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
      });

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
      });

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
      });

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
      });

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
      });

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
