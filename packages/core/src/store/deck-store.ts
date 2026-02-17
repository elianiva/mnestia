import { create } from "zustand";
import type { DeckConfig } from "@mnestia/schema/deck";
import type { Slide } from "@mnestia/schema/slide";

export interface DeckState {
  currentSlide: number;
  totalSlides: number;
  history: number[];
  isPresenterMode: boolean;
  slides: Slide[];

  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  goToFirstSlide: () => void;
  goToLastSlide: () => void;

  canGoNext: () => boolean;
  canGoPrev: () => boolean;
}

export function createInitialState(
  config: DeckConfig,
): Omit<
  DeckState,
  | "nextSlide"
  | "prevSlide"
  | "goToSlide"
  | "goToFirstSlide"
  | "goToLastSlide"
  | "canGoNext"
  | "canGoPrev"
> {
  return {
    currentSlide: 0,
    totalSlides: config.slides.length,
    history: [],
    isPresenterMode: false,
    slides: config.slides,
  };
}

export function createDeckStore(config: DeckConfig) {
  const initial = createInitialState(config);

  return create<DeckState>((set, get) => ({
    ...initial,

    nextSlide: () => {
      const { currentSlide, totalSlides, history } = get();
      if (currentSlide < totalSlides - 1) {
        set({
          currentSlide: currentSlide + 1,
          history: [...history, currentSlide],
        });
      }
    },

    prevSlide: () => {
      const { currentSlide, history } = get();
      if (currentSlide > 0) {
        set({
          currentSlide: currentSlide - 1,
          history: [...history, currentSlide],
        });
      }
    },

    goToSlide: (index: number) => {
      const { currentSlide, totalSlides, history } = get();
      if (index >= 0 && index < totalSlides && index !== currentSlide) {
        set({
          currentSlide: index,
          history: [...history, currentSlide],
        });
      }
    },

    goToFirstSlide: () => {
      const { currentSlide, history } = get();
      if (currentSlide !== 0) {
        set({
          currentSlide: 0,
          history: [...history, currentSlide],
        });
      }
    },

    goToLastSlide: () => {
      const { currentSlide, totalSlides, history } = get();
      if (currentSlide !== totalSlides - 1) {
        set({
          currentSlide: totalSlides - 1,
          history: [...history, currentSlide],
        });
      }
    },

    canGoNext: () => {
      const { currentSlide, totalSlides } = get();
      return currentSlide < totalSlides - 1;
    },

    canGoPrev: () => {
      const { currentSlide } = get();
      return currentSlide > 0;
    },
  }));
}

export type DeckStore = ReturnType<typeof createDeckStore>;
