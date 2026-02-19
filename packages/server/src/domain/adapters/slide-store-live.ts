import { Effect, Layer, Option } from "effect";
import { SlideStore, type DeckStateInternal } from "@/domain/ports/slide-store";

/**
 * Create a live `SlideStore` layer backed by the given in-memory
 * `Map`. Each entry maps a deck ID to its internal state including
 * slides, current slide index, and connected WebSocket clients.
 */
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
