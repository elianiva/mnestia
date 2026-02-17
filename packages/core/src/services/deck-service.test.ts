import { test, expect, describe } from "bun:test";
import { DeckService } from "./deck-service.js";
import { InvalidSlideIndexError } from "../errors/slide-errors.js";

describe("deck-service", () => {
  test("DeckService is defined", () => {
    expect(DeckService).toBeDefined();
  });

  test("DeckService has navigation methods", () => {
    expect(typeof DeckService.nextSlide).toBe("function");
    expect(typeof DeckService.prevSlide).toBe("function");
    expect(typeof DeckService.goToSlide).toBe("function");
    expect(typeof DeckService.canGoNext).toBe("function");
    expect(typeof DeckService.canGoPrev).toBe("function");
    expect(typeof DeckService.getCurrentSlide).toBe("function");
  });

  test("InvalidSlideIndexError is exported", () => {
    const error = new InvalidSlideIndexError({
      index: 5,
      totalSlides: 3,
      message: "test",
    });
    expect(error._tag).toBe("InvalidSlideIndexError");
    expect(error.index).toBe(5);
  });
});
