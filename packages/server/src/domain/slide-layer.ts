import { Effect, Layer, Option } from "effect";
import { SlideStore, type DeckStateInternal } from "./slide-store";

export function createSlideStoreLive(
  map: Map<string, DeckStateInternal>
): Layer.Layer<SlideStore> {
  return Layer.succeed(SlideStore, {
    get: (deckId) => Effect.sync(() => Option.fromNullable(map.get(deckId))),
    set: (deckId, state) => Effect.sync(() => void map.set(deckId, state)),
    delete: (deckId) => Effect.sync(() => map.delete(deckId)),
    has: (deckId) => Effect.sync(() => map.has(deckId)),
    getAll: () => Effect.sync(() => [...map.entries()]),
  });
}
