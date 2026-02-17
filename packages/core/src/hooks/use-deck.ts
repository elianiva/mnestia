import { useState, useCallback } from "react";
import { Effect } from "effect";
import type { Slide } from "@mnestia/schema/slide";

export interface UseDeckResult {
	currentSlide: number;
	totalSlides: number;
	nextSlide: () => void;
	prevSlide: () => void;
	goToSlide: (index: number) => void;
	goToFirstSlide: () => void;
	goToLastSlide: () => void;
	canGoNext: boolean;
	canGoPrev: boolean;
	currentSlideData: Slide | undefined;
}

export function useDeck(): UseDeckResult {
	const [currentSlide] = useState(0);
	const [totalSlides] = useState(0);
	const [canGoNext] = useState(false);
	const [canGoPrev] = useState(false);

	const nextSlide = useCallback(() => {
		// Implementation will connect to DeckService
		Effect.log("Next slide requested");
	}, []);

	const prevSlide = useCallback(() => {
		Effect.log("Previous slide requested");
	}, []);

	const goToSlide = useCallback((index: number) => {
		Effect.log("Go to slide requested", { index });
	}, []);

	const goToFirstSlide = useCallback(() => {
		Effect.log("Go to first slide requested");
	}, []);

	const goToLastSlide = useCallback(() => {
		Effect.log("Go to last slide requested");
	}, []);

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
		currentSlideData: undefined,
	};
}
