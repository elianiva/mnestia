import { Effect, ManagedRuntime } from "effect";
import { SlideService } from "@/domain/ports/slide-service";
import {
  runToolEffect,
  type BroadcastFn,
} from "./agent-tool-executor";
import {
  addSlideDef,
  removeSlideDef,
  updateSlideDef,
  reorderSlidesDef,
  changeCurrentSlideDef,
} from "@/infra/http/agent-tools";

function makeToolEffect(
  fn: (service: SlideService["Type"]) => Effect.Effect<any, any, never>,
  spanName: string,
  attributes: Record<string, string | number | boolean>
): Effect.Effect<any, any, SlideService> {
  const entries = Object.entries(attributes);
  return Effect.gen(function* () {
    const service = yield* SlideService;
    return yield* fn(service);
  }).pipe(
    Effect.tap(() =>
      Effect.forEach(
        entries,
        ([key, value]) => Effect.annotateCurrentSpan(key, value),
        { discard: true }
      )
    ),
    Effect.withSpan(spanName)
  );
}

/**
 * Create the full set of agent tools wired to the given runtime
 * and broadcast function. Each tool delegates execution to the
 * shared `runToolEffect` helper for consistent error handling
 * and telemetry.
 */
export function createAgentTools(
  runtime: ManagedRuntime.ManagedRuntime<SlideService, never>,
  broadcast: BroadcastFn
) {
  const addSlide = addSlideDef.server(
    async ({ deckId, content, layout, notes, position }) => {
      const effect = makeToolEffect(
        (svc) => svc.addSlide(deckId, { content, layout, notes }, position),
        "agent.tool.add_slide",
        { "tool.name": "add_slide", "deck.id": deckId }
      );
      return runToolEffect(effect, runtime, deckId, broadcast);
    }
  );

  const removeSlide = removeSlideDef.server(
    async ({ deckId, slideIndex }) => {
      const effect = makeToolEffect(
        (svc) => svc.removeSlide(deckId, slideIndex),
        "agent.tool.remove_slide",
        {
          "tool.name": "remove_slide",
          "deck.id": deckId,
          "slide.index": slideIndex,
        }
      );
      return runToolEffect(effect, runtime, deckId, broadcast);
    }
  );

  const updateSlide = updateSlideDef.server(
    async ({ deckId, slideIndex, content, layout, notes }) => {
      const effect = makeToolEffect(
        (svc) => svc.updateSlide(deckId, slideIndex, { content, layout, notes }),
        "agent.tool.update_slide",
        {
          "tool.name": "update_slide",
          "deck.id": deckId,
          "slide.index": slideIndex,
        }
      );
      return runToolEffect(effect, runtime, deckId, broadcast);
    }
  );

  const reorderSlides = reorderSlidesDef.server(
    async ({ deckId, fromIndex, toIndex }) => {
      const effect = makeToolEffect(
        (svc) => svc.reorderSlides(deckId, fromIndex, toIndex),
        "agent.tool.reorder_slides",
        {
          "tool.name": "reorder_slides",
          "deck.id": deckId,
          "slide.from_index": fromIndex,
          "slide.to_index": toIndex,
        }
      );
      return runToolEffect(effect, runtime, deckId, broadcast);
    }
  );

  const changeCurrentSlide = changeCurrentSlideDef.server(
    async ({ deckId, slideIndex }) => {
      const effect = makeToolEffect(
        (svc) => svc.changeCurrentSlide(deckId, slideIndex),
        "agent.tool.change_current_slide",
        {
          "tool.name": "change_current_slide",
          "deck.id": deckId,
          "slide.index": slideIndex,
        }
      );
      return runToolEffect(effect, runtime, deckId, broadcast);
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
