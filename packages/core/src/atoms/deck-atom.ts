import { Atom } from "@effect-atom/atom-react";
import type { DeckConfig } from "@mnestia/schema/deck";
import type { Slide } from "@mnestia/schema/slide";

export interface DeckState {
	currentSlide: number;
	totalSlides: number;
	history: number[];
	isPresenterMode: boolean;
	isFullscreen: boolean;
}

export interface DeckAtomValue extends DeckState {
	slides: Slide[];
}

const DEFAULT_STATE: DeckState = {
	currentSlide: 0,
	totalSlides: 0,
	history: [],
	isPresenterMode: false,
	isFullscreen: false,
};

export function createDeckAtom(config: DeckConfig) {
	return Atom.make({
		...DEFAULT_STATE,
		totalSlides: config.slides.length,
		slides: config.slides,
	}).pipe(Atom.keepAlive);
}

export type DeckAtom = ReturnType<typeof createDeckAtom>;
