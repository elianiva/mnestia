import { test, expect, describe } from "bun:test";
import { defineDeck } from "./define-deck.js";
import type { Slide } from "@mnestia/schema/slide";

const mockSlide = (id: string, index: number): Slide => ({
	id,
	index,
	component: () => null,
	frontmatter: {},
	filepath: `/slides/${id}.mdx`,
});

describe("defineDeck", () => {
	test("creates deck config with default values", () => {
		const slides = [mockSlide("slide-0", 0)];
		const config = defineDeck(slides);

		expect(config.slides).toEqual(slides);
		expect(config.theme).toBe("@mnestia/theme-base");
		expect(config.navigation.mode).toBe("both");
		expect(config.aspectRatio).toBe("16/9");
	});

	test("throws error for empty slides array", () => {
		expect(() => defineDeck([])).toThrow("Deck must have at least one slide");
	});

	test("allows custom theme", () => {
		const slides = [mockSlide("slide-0", 0)];
		const config = defineDeck(slides, { theme: "@custom/theme" });

		expect(config.theme).toBe("@custom/theme");
	});

	test("allows custom navigation config", () => {
		const slides = [mockSlide("slide-0", 0)];
		const config = defineDeck(slides, {
			navigation: { mode: "vim", enableMouseClick: false },
		});

		expect(config.navigation.mode).toBe("vim");
		expect(config.navigation.enableMouseClick).toBe(false);
		expect(config.navigation.enableTouchSwipe).toBe(true);
	});

	test("allows custom aspect ratio", () => {
		const slides = [mockSlide("slide-0", 0)];
		const config = defineDeck(slides, { aspectRatio: "4/3" });

		expect(config.aspectRatio).toBe("4/3");
	});
});
