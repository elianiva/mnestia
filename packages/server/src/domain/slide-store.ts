import { Context, Effect, Option } from "effect";
import type { ServerSlide } from "@mnestia/schema";

export interface DeckStateInternal {
  currentSlide: number;
  slides: ServerSlide[];
  clients: Map<string, WebSocket>;
}

export class SlideStore extends Context.Tag("@mnestia/SlideStore")<
  SlideStore,
  {
    readonly get: (
      deckId: string
    ) => Effect.Effect<Option.Option<DeckStateInternal>>;
    readonly set: (
      deckId: string,
      state: DeckStateInternal
    ) => Effect.Effect<void>;
    readonly delete: (deckId: string) => Effect.Effect<boolean>;
    readonly has: (deckId: string) => Effect.Effect<boolean>;
    readonly getAll: () => Effect.Effect<
      ReadonlyArray<[string, DeckStateInternal]>
    >;
    readonly addClient: (
      deckId: string,
      clientId: string,
      ws: WebSocket
    ) => Effect.Effect<void>;
    readonly removeClient: (clientId: string) => Effect.Effect<void>;
  }
>() {}
