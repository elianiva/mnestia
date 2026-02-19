import { Effect, Layer, Option } from "effect";
import type { ServerDeckState, ServerSlide, SlideCommand } from "@mnestia/schema";
import { SlideService } from "@/domain/ports/slide-service";
import { SlideStore, type DeckStateInternal } from "@/domain/ports/slide-store";
import {
  DeckNotFoundError,
  InvalidSlideIndexError,
  SlideNotFoundError,
  SlideOperationError,
} from "@/domain/slide-errors";

// ── Internal Helpers ──────────────────────────────────────────────

function toServerDeckState(internal: DeckStateInternal): ServerDeckState {
  return {
    currentSlide: internal.currentSlide,
    slides: internal.slides,
  };
}

function reindexSlides(slides: ServerSlide[]): ServerSlide[] {
  return slides.map((s, i) => ({ ...s, index: i }));
}

function validateIndex(slideIndex: number, totalSlides: number): boolean {
  return slideIndex >= 0 && slideIndex < totalSlides;
}

function generateSlideId(): string {
  return crypto.randomUUID();
}

// ── Service Implementation ────────────────────────────────────────

export const SlideServiceLive = Layer.effect(
  SlideService,
  Effect.gen(function* () {
    const store = yield* SlideStore;

    const getDeckOrFail = Effect.fn("SlideService.getDeckOrFail")(
      function* (deckId: string) {
        const maybeDeck = yield* store.get(deckId);
        if (Option.isNone(maybeDeck)) {
          return yield* new DeckNotFoundError({ deckId });
        }
        return maybeDeck.value;
      }
    );

    const getOrCreateDeck = Effect.fn("SlideService.getOrCreateDeck")(
      function* (deckId: string) {
        const maybeDeck = yield* store.get(deckId);
        if (Option.isSome(maybeDeck)) {
          return toServerDeckState(maybeDeck.value);
        }
        const initial: DeckStateInternal = {
          currentSlide: 0,
          slides: [],
          clients: new Map(),
        };
        yield* store.set(deckId, initial);
        return toServerDeckState(initial);
      }
    );

    const getDeck = Effect.fn("SlideService.getDeck")(
      function* (deckId: string) {
        const deck = yield* getDeckOrFail(deckId);
        return toServerDeckState(deck);
      }
    );

    const addSlide = Effect.fn("SlideService.addSlide")(
      function* (
        deckId: string,
        slide: { content?: string; layout?: string; notes?: string },
        position?: number
      ) {
        const deck = yield* getDeckOrFail(deckId);

        const newSlide: ServerSlide = {
          id: generateSlideId(),
          index: 0,
          content: slide.content,
          layout: slide.layout,
          notes: slide.notes,
        };

        const slides = [...deck.slides];
        const insertAt =
          position !== undefined && position >= 0 && position <= slides.length
            ? position
            : slides.length;

        slides.splice(insertAt, 0, newSlide);
        const reindexed = reindexSlides(slides);

        const updated: DeckStateInternal = { ...deck, slides: reindexed };
        yield* store.set(deckId, updated);
        return toServerDeckState(updated);
      }
    );

    const removeSlide = Effect.fn("SlideService.removeSlide")(
      function* (deckId: string, slideIndex: number) {
        const deck = yield* getDeckOrFail(deckId);

        if (!validateIndex(slideIndex, deck.slides.length)) {
          return yield* new InvalidSlideIndexError({
            deckId,
            slideIndex,
            totalSlides: deck.slides.length,
          });
        }

        const slides = reindexSlides(
          deck.slides.filter((_, i) => i !== slideIndex)
        );

        const currentSlide = Math.min(
          deck.currentSlide,
          Math.max(0, slides.length - 1)
        );

        const updated: DeckStateInternal = {
          ...deck,
          slides,
          currentSlide,
        };
        yield* store.set(deckId, updated);
        return toServerDeckState(updated);
      }
    );

    const updateSlide = Effect.fn("SlideService.updateSlide")(
      function* (
        deckId: string,
        slideIndex: number,
        updates: { content?: string; layout?: string; notes?: string }
      ) {
        const deck = yield* getDeckOrFail(deckId);

        if (!validateIndex(slideIndex, deck.slides.length)) {
          return yield* new SlideNotFoundError({ deckId, slideIndex });
        }

        const slides = deck.slides.map((s, i) => {
          if (i !== slideIndex) return s;
          return {
            ...s,
            ...(updates.content !== undefined && { content: updates.content }),
            ...(updates.layout !== undefined && { layout: updates.layout }),
            ...(updates.notes !== undefined && { notes: updates.notes }),
          };
        });

        const updated: DeckStateInternal = { ...deck, slides };
        yield* store.set(deckId, updated);
        return toServerDeckState(updated);
      }
    );

    const reorderSlides = Effect.fn("SlideService.reorderSlides")(
      function* (deckId: string, fromIndex: number, toIndex: number) {
        const deck = yield* getDeckOrFail(deckId);

        if (!validateIndex(fromIndex, deck.slides.length)) {
          return yield* new InvalidSlideIndexError({
            deckId,
            slideIndex: fromIndex,
            totalSlides: deck.slides.length,
          });
        }
        if (!validateIndex(toIndex, deck.slides.length)) {
          return yield* new InvalidSlideIndexError({
            deckId,
            slideIndex: toIndex,
            totalSlides: deck.slides.length,
          });
        }

        const slides = [...deck.slides];
        const [moved] = slides.splice(fromIndex, 1);
        slides.splice(toIndex, 0, moved!);
        const reindexed = reindexSlides(slides);

        let { currentSlide } = deck;
        if (currentSlide === fromIndex) {
          currentSlide = toIndex;
        } else if (fromIndex < currentSlide && toIndex >= currentSlide) {
          currentSlide--;
        } else if (fromIndex > currentSlide && toIndex <= currentSlide) {
          currentSlide++;
        }

        const updated: DeckStateInternal = {
          ...deck,
          slides: reindexed,
          currentSlide,
        };
        yield* store.set(deckId, updated);
        return toServerDeckState(updated);
      }
    );

    const changeCurrentSlide = Effect.fn("SlideService.changeCurrentSlide")(
      function* (deckId: string, slideIndex: number) {
        const deck = yield* getDeckOrFail(deckId);

        if (
          deck.slides.length > 0 &&
          !validateIndex(slideIndex, deck.slides.length)
        ) {
          return yield* new InvalidSlideIndexError({
            deckId,
            slideIndex,
            totalSlides: deck.slides.length,
          });
        }

        const updated: DeckStateInternal = {
          ...deck,
          currentSlide: slideIndex,
        };
        yield* store.set(deckId, updated);
        return toServerDeckState(updated);
      }
    );

    const executeCommand = Effect.fn("SlideService.executeCommand")(
      function* (command: SlideCommand) {
        switch (command.type) {
          case "ADD_SLIDE":
            return yield* addSlide(
              command.deckId,
              command.slide,
              command.position
            );
          case "REMOVE_SLIDE":
            return yield* removeSlide(command.deckId, command.slideIndex);
          case "UPDATE_SLIDE":
            return yield* updateSlide(command.deckId, command.slideIndex, {
              content: command.content,
              layout: command.layout,
              notes: command.notes,
            });
          case "REORDER_SLIDES":
            return yield* reorderSlides(
              command.deckId,
              command.fromIndex,
              command.toIndex
            );
          case "CHANGE_CURRENT_SLIDE":
            return yield* changeCurrentSlide(
              command.deckId,
              command.slideIndex
            );
          default: {
            const _exhaustive: never = command;
            return yield* new SlideOperationError({
              operation: "executeCommand",
              deckId: "unknown",
              reason: `Unknown command type: ${JSON.stringify(_exhaustive)}`,
            });
          }
        }
      }
    );

    return SlideService.of({
      getOrCreateDeck,
      getDeck,
      addSlide,
      removeSlide,
      updateSlide,
      reorderSlides,
      changeCurrentSlide,
      executeCommand,
    });
  })
);
