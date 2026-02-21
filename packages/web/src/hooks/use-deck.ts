import { useAtomValue, useAtomSet } from "@effect-atom/atom-react";
import { useDeckContext } from "../components/deck-provider";
import type { DeckAtomValue } from "@mnestia/core/atoms/deck";

export interface UseDeckReturn {
	currentSlide: number;
	totalSlides: number;
	slides: DeckAtomValue["slides"];
	nextSlide: () => void;
	prevSlide: () => void;
	goToSlide: (index: number) => void;
	goToFirstSlide: () => void;
	goToLastSlide: () => void;
	canGoNext: boolean;
	canGoPrev: boolean;
}

export function useDeck(): UseDeckReturn {
	const { store } = useDeckContext();

	const state = useAtomValue(store) as DeckAtomValue;
	const setState = useAtomSet(store);

	const currentSlide = state.currentSlide;
	const totalSlides = state.totalSlides;
	const slides = state.slides;

	const canGoNext = currentSlide < totalSlides - 1;
	const canGoPrev = currentSlide > 0;

	const nextSlide = () => {
		if (canGoNext) {
			setState((prev: DeckAtomValue) => ({ ...prev, currentSlide: prev.currentSlide + 1 }));
		}
	};

	const prevSlide = () => {
		if (canGoPrev) {
			setState((prev: DeckAtomValue) => ({ ...prev, currentSlide: prev.currentSlide - 1 }));
		}
	};

	const goToSlide = (index: number) => {
		if (index >= 0 && index < totalSlides) {
			setState((prev: DeckAtomValue) => ({ ...prev, currentSlide: index }));
		}
	};

	const goToFirstSlide = () => goToSlide(0);
	const goToLastSlide = () => goToSlide(totalSlides - 1);

	return {
		currentSlide,
		totalSlides,
		slides,
		nextSlide,
		prevSlide,
		goToSlide,
		goToFirstSlide,
		goToLastSlide,
		canGoNext,
		canGoPrev,
	};
}
