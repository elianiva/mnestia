import { Context, Effect } from "effect";
import type { ServerDeckState, SlideCommand } from "@mnestia/schema";
import type {
  DeckNotFoundError,
  InvalidSlideIndexError,
  SlideNotFoundError,
  SlideOperationError,
} from "@/domain/slide-errors";

export class SlideService extends Context.Tag("@mnestia/SlideService")<
  SlideService,
  {
    readonly getOrCreateDeck: (
      deckId: string
    ) => Effect.Effect<ServerDeckState>;

    readonly getDeck: (
      deckId: string
    ) => Effect.Effect<ServerDeckState, DeckNotFoundError>;

    readonly addSlide: (
      deckId: string,
      slide: { content?: string; layout?: string; notes?: string },
      position?: number
    ) => Effect.Effect<ServerDeckState, DeckNotFoundError>;

    readonly removeSlide: (
      deckId: string,
      slideIndex: number
    ) => Effect.Effect<
      ServerDeckState,
      DeckNotFoundError | InvalidSlideIndexError
    >;

    readonly updateSlide: (
      deckId: string,
      slideIndex: number,
      updates: { content?: string; layout?: string; notes?: string }
    ) => Effect.Effect<
      ServerDeckState,
      DeckNotFoundError | SlideNotFoundError
    >;

    readonly reorderSlides: (
      deckId: string,
      fromIndex: number,
      toIndex: number
    ) => Effect.Effect<
      ServerDeckState,
      DeckNotFoundError | InvalidSlideIndexError
    >;

    readonly changeCurrentSlide: (
      deckId: string,
      slideIndex: number
    ) => Effect.Effect<
      ServerDeckState,
      DeckNotFoundError | InvalidSlideIndexError
    >;

    readonly executeCommand: (
      command: SlideCommand
    ) => Effect.Effect<
      ServerDeckState,
      | DeckNotFoundError
      | SlideNotFoundError
      | InvalidSlideIndexError
      | SlideOperationError
    >;
  }
>() {}
