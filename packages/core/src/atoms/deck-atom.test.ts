import { test, expect, describe } from "bun:test";
import { createDeckAtom, DEFAULT_STATE } from "./deck-atom.js";
import type { DeckConfig } from "@mnestia/schema/deck";
import type { Slide } from "@mnestia/schema/slide";

const createMockSlide = (id: string): Slide => ({
  id,
  index: 0,
  component: () => null,
  frontmatter: {},
  filepath: `./slides/${id}.mdx`,
});

const createMockConfig = (slides: Slide[]): DeckConfig => ({
  slides,
  theme: "@mnestia/theme-base",
  navigation: { mode: "both", enableMouseClick: true, enableTouchSwipe: true },
  aspectRatio: "16/9",
});

describe("deck-atom", () => {
  test("DEFAULT_STATE has correct initial values", () => {
    expect(DEFAULT_STATE.currentSlide).toBe(0);
    expect(DEFAULT_STATE.totalSlides).toBe(0);
    expect(DEFAULT_STATE.isPresenterMode).toBe(false);
    expect(DEFAULT_STATE.isFullscreen).toBe(false);
    expect(DEFAULT_STATE.history).toEqual([]);
  });

  test("createDeckAtom returns an atom", () => {
    const slides = [createMockSlide("slide1")];
    const config = createMockConfig(slides);
    const atom = createDeckAtom(config);

    expect(atom).toBeDefined();
    expect(typeof atom).toBe("object");
  });
});
