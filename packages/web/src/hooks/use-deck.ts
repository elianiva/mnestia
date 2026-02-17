import { useSyncExternalStore } from "react";
import { useDeckContext } from "../components/deck-provider";
import type { DeckState } from "@mnestia/core/store/deck-store";

export interface UseDeckReturn {
  currentSlide: number;
  totalSlides: number;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  goToFirstSlide: () => void;
  goToLastSlide: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface StoreApi<T> {
  getState: () => T;
  subscribe: (listener: () => void) => () => void;
}

function useDeckStore<T>(store: StoreApi<DeckState>, selector: (state: DeckState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

export function useDeck(): UseDeckReturn {
  const { store } = useDeckContext();

  const currentSlide = useDeckStore(store, (state) => state.currentSlide);
  const totalSlides = useDeckStore(store, (state) => state.totalSlides);
  const canGoNext = useDeckStore(store, (state) => state.canGoNext());
  const canGoPrev = useDeckStore(store, (state) => state.canGoPrev());

  const { nextSlide, prevSlide, goToSlide, goToFirstSlide, goToLastSlide } = store.getState();

  return {
    currentSlide,
    totalSlides,
    nextSlide,
    prevSlide,
    goToSlide,
    goToFirstSlide,
    goToLastSlide,
    canGoNext,
    canGoPrev,
  };
}
