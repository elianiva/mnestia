import { Effect } from "effect";
import type { DeckConfig } from "@mnestia/schema/deck";
import type { Slide } from "@mnestia/schema/slide";
import { InvalidSlideIndexError } from "../errors/slide-errors.js";
import { createDeckAtom } from "../atoms/deck-atom.js";

export interface DeckState {
	currentSlide: number;
	totalSlides: number;
	history: number[];
	isPresenterMode: boolean;
}

export class DeckService extends Effect.Service<DeckService>()("DeckService", {
	accessors: true,
	effect: Effect.gen(function* () {
		const config: DeckConfig = yield* Effect.context<DeckConfig>().pipe(
			Effect.map((ctx) => ctx as unknown as DeckConfig),
		);
		const _atom = createDeckAtom(config);

		let state: DeckState = {
			currentSlide: 0,
			totalSlides: config.slides.length,
			history: [],
			isPresenterMode: false,
		};

		const getState = (): DeckState => state;

		const nextSlide = Effect.fn("DeckService.nextSlide")(function* () {
			const currentState = getState();
			if (currentState.currentSlide < currentState.totalSlides - 1) {
				state = {
					...currentState,
					currentSlide: currentState.currentSlide + 1,
					history: [...currentState.history, currentState.currentSlide],
				};
				yield* Effect.log("Navigating to next slide", {
					from: currentState.currentSlide,
					to: state.currentSlide,
				});
			}
		});

		const prevSlide = Effect.fn("DeckService.prevSlide")(function* () {
			const currentState = getState();
			if (currentState.currentSlide > 0) {
				state = {
					...currentState,
					currentSlide: currentState.currentSlide - 1,
					history: [...currentState.history, currentState.currentSlide],
				};
				yield* Effect.log("Navigating to previous slide", {
					from: currentState.currentSlide,
					to: state.currentSlide,
				});
			}
		});

		const goToSlide = Effect.fn("DeckService.goToSlide")(
			function* (index: number) {
				const currentState = getState();
				if (index < 0 || index >= currentState.totalSlides) {
					return yield* Effect.fail(
						new InvalidSlideIndexError({
							index,
							totalSlides: currentState.totalSlides,
							message: `Slide index ${index} is out of bounds (0-${currentState.totalSlides - 1})`,
						}),
					);
				}
				state = {
					...currentState,
					currentSlide: index,
					history: [...currentState.history, currentState.currentSlide],
				};
				yield* Effect.log("Navigating to slide", { index });
			},
		);

		const goToFirstSlide = Effect.fn("DeckService.goToFirstSlide")(
			function* () {
				yield* goToSlide(0);
			},
		);

		const goToLastSlide = Effect.fn("DeckService.goToLastSlide")(
			function* () {
				const currentState = getState();
				yield* goToSlide(currentState.totalSlides - 1);
			},
		);

		const canGoNext = (): boolean => {
			const currentState = getState();
			return currentState.currentSlide < currentState.totalSlides - 1;
		};

		const canGoPrev = (): boolean => {
			const currentState = getState();
			return currentState.currentSlide > 0;
		};

		const getCurrentSlide = (): Slide | undefined => {
			const currentState = getState();
			return config.slides[currentState.currentSlide];
		};

		return {
			nextSlide,
			prevSlide,
			goToSlide,
			goToFirstSlide,
			goToLastSlide,
			canGoNext,
			canGoPrev,
			getCurrentSlide,
			getState,
		};
	}),
}) {}
