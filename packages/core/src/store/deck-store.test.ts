import { test, expect, describe } from "bun:test";
import { createInitialState, createDeckStore } from "./deck-store.js";
import type { DeckConfig } from "@mnestia/schema/deck";
import type { Slide } from "@mnestia/schema/slide";

const mockSlide = (id: string, index: number): Slide => ({
	id,
	index,
	component: () => null,
	frontmatter: {},
	filepath: `/slides/${id}.mdx`,
});

const createMockConfig = (slideCount: number): DeckConfig => ({
	slides: Array.from({ length: slideCount }, (_, i) => mockSlide(`slide-${i}`, i)),
	theme: "@mnestia/theme-base",
	navigation: { mode: "both" },
	aspectRatio: "16/9",
});

describe("createInitialState", () => {
	test("creates initial state with correct values", () => {
		const config = createMockConfig(5);
		const state = createInitialState(config);

		expect(state.currentSlide).toBe(0);
		expect(state.totalSlides).toBe(5);
		expect(state.history).toEqual([]);
		expect(state.isPresenterMode).toBe(false);
		expect(state.slides).toEqual(config.slides);
	});
});

describe("deckStore navigation", () => {
	test("nextSlide increments currentSlide", () => {
		const config = createMockConfig(3);
		const store = createDeckStore(config);

		expect(store.getState().currentSlide).toBe(0);

		store.getState().nextSlide();
		expect(store.getState().currentSlide).toBe(1);
		expect(store.getState().history).toEqual([0]);
	});

	test("nextSlide does not exceed total slides", () => {
		const config = createMockConfig(2);
		const store = createDeckStore(config);

		store.getState().nextSlide();
		store.getState().nextSlide();
		expect(store.getState().currentSlide).toBe(1);

		store.getState().nextSlide();
		expect(store.getState().currentSlide).toBe(1);
	});

	test("prevSlide decrements currentSlide", () => {
		const config = createMockConfig(3);
		const store = createDeckStore(config);

		store.getState().nextSlide();
		store.getState().nextSlide();
		expect(store.getState().currentSlide).toBe(2);

		store.getState().prevSlide();
		expect(store.getState().currentSlide).toBe(1);
		expect(store.getState().history).toEqual([0, 1, 2]);
	});

	test("prevSlide does not go below 0", () => {
		const config = createMockConfig(3);
		const store = createDeckStore(config);

		expect(store.getState().currentSlide).toBe(0);

		store.getState().prevSlide();
		expect(store.getState().currentSlide).toBe(0);
	});

	test("goToSlide moves to specific slide", () => {
		const config = createMockConfig(5);
		const store = createDeckStore(config);

		store.getState().goToSlide(3);
		expect(store.getState().currentSlide).toBe(3);
		expect(store.getState().history).toEqual([0]);
	});

	test("goToSlide does not go out of bounds", () => {
		const config = createMockConfig(3);
		const store = createDeckStore(config);

		store.getState().goToSlide(-1);
		expect(store.getState().currentSlide).toBe(0);

		store.getState().goToSlide(10);
		expect(store.getState().currentSlide).toBe(0);
	});

	test("goToFirstSlide moves to first slide", () => {
		const config = createMockConfig(3);
		const store = createDeckStore(config);

		store.getState().nextSlide();
		store.getState().nextSlide();
		expect(store.getState().currentSlide).toBe(2);

		store.getState().goToFirstSlide();
		expect(store.getState().currentSlide).toBe(0);
	});

	test("goToLastSlide moves to last slide", () => {
		const config = createMockConfig(3);
		const store = createDeckStore(config);

		store.getState().goToLastSlide();
		expect(store.getState().currentSlide).toBe(2);
	});

	test("canGoNext returns correct value", () => {
		const config = createMockConfig(2);
		const store = createDeckStore(config);

		expect(store.getState().canGoNext()).toBe(true);

		store.getState().nextSlide();
		expect(store.getState().canGoNext()).toBe(false);
	});

	test("canGoPrev returns correct value", () => {
		const config = createMockConfig(2);
		const store = createDeckStore(config);

		expect(store.getState().canGoPrev()).toBe(false);

		store.getState().nextSlide();
		expect(store.getState().canGoPrev()).toBe(true);
	});
});
