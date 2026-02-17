import { test, expect, describe } from "bun:test";
import { defineDeck } from "./define-deck.js";
import type { Slide } from "@mnestia/schema/slide";

const createMockSlide = (id: string): Slide => ({
  id,
  index: 0,
  component: () => null,
  frontmatter: {},
  filepath: `./slides/${id}.mdx`,
});

describe("defineDeck", () => {
  test("creates deck config with slides", () => {
    const slides = [createMockSlide("a"), createMockSlide("b")];
    const config = defineDeck(slides);

    expect(config.slides).toHaveLength(2);
    expect(config.theme).toBe("@mnestia/theme-base");
  });

  test("throws for empty slides", () => {
    expect(() => defineDeck([])).toThrow("Deck must have at least one slide");
  });

  test("accepts custom options", () => {
    const config = defineDeck([createMockSlide("slide")], {
      theme: "custom",
      aspectRatio: "4/3",
      navigation: { mode: "vim" },
    });

    expect(config.theme).toBe("custom");
    expect(config.aspectRatio).toBe("4/3");
    expect(config.navigation.mode).toBe("vim");
  });
});
