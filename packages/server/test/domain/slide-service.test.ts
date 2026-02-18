import { test, expect, describe } from "bun:test";
import { Layer } from "effect";
import type { ServerDeckState } from "@mnestia/schema";
import { SlideService } from "../../src/domain/slide-service";
import { type DeckStateInternal } from "../../src/domain/slide-store";
import { SlideServiceLive, createSlideStoreLive } from "../../src/domain/slide-layer";
import {
  seedDeck,
  expectSuccess,
  expectFailureWithTag,
  runWithService,
} from "../helpers";

// ── Test Helpers ──────────────────────────────────────────────────

function createTestLayer(): {
  layer: Layer.Layer<SlideService>;
  storeMap: Map<string, DeckStateInternal>;
} {
  const storeMap = new Map<string, DeckStateInternal>();
  const storeLayer = createSlideStoreLive(storeMap);
  const layer = SlideServiceLive.pipe(Layer.provide(storeLayer));
  return { layer, storeMap };
}

// ── getOrCreateDeck ───────────────────────────────────────────────

describe("SlideService.getOrCreateDeck", () => {
  test("creates a new empty deck if it does not exist", async () => {
    const { layer } = createTestLayer();

    const exit = await runWithService(
      (svc) => svc.getOrCreateDeck("deck-1"),
      layer
    );

    const state: ServerDeckState = expectSuccess(exit);
    expect(state.currentSlide).toBe(0);
    expect(state.slides).toEqual([]);
  });

  test("returns existing deck if it already exists", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3, 1);

    const exit = await runWithService(
      (svc) => svc.getOrCreateDeck("deck-1"),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(3);
    expect(state.currentSlide).toBe(1);
  });

  test("does not include clients in returned ServerDeckState", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 1);

    const exit = await runWithService(
      (svc) => svc.getOrCreateDeck("deck-1"),
      layer
    );

    const result = expectSuccess(exit) as Record<string, unknown>;
    expect(result).not.toHaveProperty("clients");
  });
});

// ── getDeck ───────────────────────────────────────────────────────

describe("SlideService.getDeck", () => {
  test("returns deck state when it exists", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.getDeck("deck-1"),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(2);
    expect(state.currentSlide).toBe(0);
  });

  test("fails with DeckNotFoundError when deck does not exist", async () => {
    const { layer } = createTestLayer();

    const exit = await runWithService(
      (svc) => svc.getDeck("nonexistent"),
      layer
    );

    expectFailureWithTag(exit, "DeckNotFoundError");
  });
});

// ── addSlide ──────────────────────────────────────────────────────

describe("SlideService.addSlide", () => {
  test("adds a slide to the end by default", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.addSlide("deck-1", { content: "New slide", layout: "title" }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(3);
    expect(state.slides[2]!.content).toBe("New slide");
    expect(state.slides[2]!.layout).toBe("title");
    expect(state.slides[2]!.index).toBe(2);
  });

  test("adds a slide at a specific position", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.addSlide("deck-1", { content: "Inserted" }, 1),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(4);
    expect(state.slides[1]!.content).toBe("Inserted");
    // Verify re-indexing
    state.slides.forEach((slide, i) => {
      expect(slide.index).toBe(i);
    });
  });

  test("adds a slide at position 0 (beginning)", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.addSlide("deck-1", { content: "First" }, 0),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides[0]!.content).toBe("First");
    expect(state.slides).toHaveLength(3);
  });

  test("clamps position if out of range", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.addSlide("deck-1", { content: "End" }, 999),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(3);
    expect(state.slides[2]!.content).toBe("End");
  });

  test("generates unique slide IDs", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 0);

    const exit1 = await runWithService(
      (svc) => svc.addSlide("deck-1", { content: "A" }),
      layer
    );

    const exit2 = await runWithService(
      (svc) => svc.addSlide("deck-1", { content: "B" }),
      layer
    );

    const state1 = expectSuccess(exit1);
    const state2 = expectSuccess(exit2);
    const id1 = state1.slides[0]!.id;
    const id2 = state2.slides[1]!.id;
    expect(id1).not.toBe(id2);
  });

  test("fails with DeckNotFoundError for unknown deck", async () => {
    const { layer } = createTestLayer();

    const exit = await runWithService(
      (svc) => svc.addSlide("nonexistent", { content: "X" }),
      layer
    );

    expectFailureWithTag(exit, "DeckNotFoundError");
  });

  test("supports optional notes field", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 0);

    const exit = await runWithService(
      (svc) =>
        svc.addSlide("deck-1", {
          content: "With notes",
          notes: "Speaker notes here",
        }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides[0]!.notes).toBe("Speaker notes here");
  });
});

// ── removeSlide ───────────────────────────────────────────────────

describe("SlideService.removeSlide", () => {
  test("removes a slide at the given index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.removeSlide("deck-1", 1),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(2);
    // Verify re-indexing
    state.slides.forEach((slide, i) => {
      expect(slide.index).toBe(i);
    });
  });

  test("adjusts currentSlide when removing current or after", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3, 2);

    const exit = await runWithService(
      (svc) => svc.removeSlide("deck-1", 2),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(2);
    expect(state.currentSlide).toBeLessThanOrEqual(1);
  });

  test("keeps currentSlide at 0 when removing the last slide", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 1);

    const exit = await runWithService(
      (svc) => svc.removeSlide("deck-1", 0),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(0);
    expect(state.currentSlide).toBe(0);
  });

  test("fails with InvalidSlideIndexError for negative index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.removeSlide("deck-1", -1),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });

  test("fails with InvalidSlideIndexError for out-of-bounds index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.removeSlide("deck-1", 5),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });

  test("fails with DeckNotFoundError for unknown deck", async () => {
    const { layer } = createTestLayer();

    const exit = await runWithService(
      (svc) => svc.removeSlide("nonexistent", 0),
      layer
    );

    expectFailureWithTag(exit, "DeckNotFoundError");
  });
});

// ── updateSlide ───────────────────────────────────────────────────

describe("SlideService.updateSlide", () => {
  test("updates content of an existing slide", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.updateSlide("deck-1", 1, { content: "Updated content" }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides[1]!.content).toBe("Updated content");
    // Other slides should be unchanged
    expect(state.slides[0]!.content).toBe("Content for slide 0");
    expect(state.slides[2]!.content).toBe("Content for slide 2");
  });

  test("updates layout of an existing slide", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.updateSlide("deck-1", 0, { layout: "two-column" }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides[0]!.layout).toBe("two-column");
  });

  test("updates notes of an existing slide", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.updateSlide("deck-1", 0, { notes: "Remember to demo this" }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides[0]!.notes).toBe("Remember to demo this");
  });

  test("updates multiple fields at once", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) =>
        svc.updateSlide("deck-1", 0, {
          content: "New content",
          layout: "image-right",
          notes: "New notes",
        }),
      layer
    );

    const state = expectSuccess(exit);
    const slide = state.slides[0]!;
    expect(slide.content).toBe("New content");
    expect(slide.layout).toBe("image-right");
    expect(slide.notes).toBe("New notes");
  });

  test("preserves unchanged fields", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.updateSlide("deck-1", 0, { notes: "Just notes" }),
      layer
    );

    const state = expectSuccess(exit);
    const slide = state.slides[0]!;
    expect(slide.content).toBe("Content for slide 0");
    expect(slide.layout).toBe("default");
    expect(slide.notes).toBe("Just notes");
  });

  test("fails with SlideNotFoundError for out-of-bounds index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.updateSlide("deck-1", 10, { content: "X" }),
      layer
    );

    expectFailureWithTag(exit, "SlideNotFoundError");
  });

  test("fails with SlideNotFoundError for negative index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) => svc.updateSlide("deck-1", -1, { content: "X" }),
      layer
    );

    expectFailureWithTag(exit, "SlideNotFoundError");
  });

  test("fails with DeckNotFoundError for unknown deck", async () => {
    const { layer } = createTestLayer();

    const exit = await runWithService(
      (svc) => svc.updateSlide("nonexistent", 0, { content: "X" }),
      layer
    );

    expectFailureWithTag(exit, "DeckNotFoundError");
  });
});

// ── reorderSlides ─────────────────────────────────────────────────

describe("SlideService.reorderSlides", () => {
  test("moves a slide from one position to another", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 4);

    const exit = await runWithService(
      (svc) => svc.reorderSlides("deck-1", 0, 2),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(4);
    // Original slide-0 should now be at index 2
    expect(state.slides[2]!.id).toBe("slide-0");
    // Verify re-indexing
    state.slides.forEach((slide, i) => {
      expect(slide.index).toBe(i);
    });
  });

  test("moving currentSlide updates currentSlide to new position", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 4, 1);

    const exit = await runWithService(
      (svc) => svc.reorderSlides("deck-1", 1, 3),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.currentSlide).toBe(3);
  });

  test("moving slide before currentSlide shifts currentSlide", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 5, 2);

    // Move slide at index 0 to index 3 (past currentSlide=2)
    const exit = await runWithService(
      (svc) => svc.reorderSlides("deck-1", 0, 3),
      layer
    );

    const state = expectSuccess(exit);
    // currentSlide was 2, moved from 0 (before) to 3 (after/at), so it decrements
    expect(state.currentSlide).toBe(1);
  });

  test("same fromIndex and toIndex is a no-op", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.reorderSlides("deck-1", 1, 1),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides[1]!.id).toBe("slide-1");
  });

  test("fails with InvalidSlideIndexError for invalid fromIndex", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.reorderSlides("deck-1", -1, 1),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });

  test("fails with InvalidSlideIndexError for invalid toIndex", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.reorderSlides("deck-1", 0, 10),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });

  test("fails with DeckNotFoundError for unknown deck", async () => {
    const { layer } = createTestLayer();

    const exit = await runWithService(
      (svc) => svc.reorderSlides("nonexistent", 0, 1),
      layer
    );

    expectFailureWithTag(exit, "DeckNotFoundError");
  });
});

// ── changeCurrentSlide ────────────────────────────────────────────

describe("SlideService.changeCurrentSlide", () => {
  test("changes the current slide index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 5);

    const exit = await runWithService(
      (svc) => svc.changeCurrentSlide("deck-1", 3),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.currentSlide).toBe(3);
  });

  test("allows setting currentSlide to 0", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3, 2);

    const exit = await runWithService(
      (svc) => svc.changeCurrentSlide("deck-1", 0),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.currentSlide).toBe(0);
  });

  test("allows setting currentSlide to last index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 5);

    const exit = await runWithService(
      (svc) => svc.changeCurrentSlide("deck-1", 4),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.currentSlide).toBe(4);
  });

  test("fails with InvalidSlideIndexError for negative index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.changeCurrentSlide("deck-1", -1),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });

  test("fails with InvalidSlideIndexError for out-of-bounds index", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) => svc.changeCurrentSlide("deck-1", 5),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });

  test("allows any index when deck has no slides", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 0);

    const exit = await runWithService(
      (svc) => svc.changeCurrentSlide("deck-1", 0),
      layer
    );

    expectSuccess(exit);
  });

  test("fails with DeckNotFoundError for unknown deck", async () => {
    const { layer } = createTestLayer();

    const exit = await runWithService(
      (svc) => svc.changeCurrentSlide("nonexistent", 0),
      layer
    );

    expectFailureWithTag(exit, "DeckNotFoundError");
  });
});

// ── executeCommand ────────────────────────────────────────────────

describe("SlideService.executeCommand", () => {
  test("executes ADD_SLIDE command", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 1);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "ADD_SLIDE",
          deckId: "deck-1",
          slide: { content: "Via command", layout: "blank" },
        }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(2);
    expect(state.slides[1]!.content).toBe("Via command");
  });

  test("executes REMOVE_SLIDE command", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "REMOVE_SLIDE",
          deckId: "deck-1",
          slideIndex: 1,
        }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides).toHaveLength(2);
  });

  test("executes UPDATE_SLIDE command", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "UPDATE_SLIDE",
          deckId: "deck-1",
          slideIndex: 0,
          content: "Updated via command",
        }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides[0]!.content).toBe("Updated via command");
  });

  test("executes REORDER_SLIDES command", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 4);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "REORDER_SLIDES",
          deckId: "deck-1",
          fromIndex: 0,
          toIndex: 3,
        }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.slides[3]!.id).toBe("slide-0");
  });

  test("executes CHANGE_CURRENT_SLIDE command", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 5);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "CHANGE_CURRENT_SLIDE",
          deckId: "deck-1",
          slideIndex: 4,
        }),
      layer
    );

    const state = expectSuccess(exit);
    expect(state.currentSlide).toBe(4);
  });

  test("propagates DeckNotFoundError from underlying service methods", async () => {
    const { layer } = createTestLayer();

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "ADD_SLIDE",
          deckId: "nonexistent",
          slide: { content: "X" },
        }),
      layer
    );

    expectFailureWithTag(exit, "DeckNotFoundError");
  });

  test("propagates InvalidSlideIndexError from REMOVE_SLIDE", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "REMOVE_SLIDE",
          deckId: "deck-1",
          slideIndex: 99,
        }),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });

  test("propagates SlideNotFoundError from UPDATE_SLIDE", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "UPDATE_SLIDE",
          deckId: "deck-1",
          slideIndex: 99,
          content: "X",
        }),
      layer
    );

    expectFailureWithTag(exit, "SlideNotFoundError");
  });

  test("propagates InvalidSlideIndexError from REORDER_SLIDES", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 2);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "REORDER_SLIDES",
          deckId: "deck-1",
          fromIndex: -1,
          toIndex: 0,
        }),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });

  test("propagates InvalidSlideIndexError from CHANGE_CURRENT_SLIDE", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 3);

    const exit = await runWithService(
      (svc) =>
        svc.executeCommand({
          type: "CHANGE_CURRENT_SLIDE",
          deckId: "deck-1",
          slideIndex: 99,
        }),
      layer
    );

    expectFailureWithTag(exit, "InvalidSlideIndexError");
  });
});

// ── State Isolation ───────────────────────────────────────────────

describe("SlideService state isolation", () => {
  test("operations on one deck do not affect another", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-a", 2);
    seedDeck(storeMap, "deck-b", 3);

    await runWithService(
      (svc) => svc.addSlide("deck-a", { content: "New A" }),
      layer
    );

    const exitB = await runWithService(
      (svc) => svc.getDeck("deck-b"),
      layer
    );

    const stateB = expectSuccess(exitB);
    expect(stateB.slides).toHaveLength(3);
  });

  test("multiple operations compose correctly", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 0);

    // Add 3 slides
    for (let i = 0; i < 3; i++) {
      await runWithService(
        (svc) => svc.addSlide("deck-1", { content: `Slide ${i}` }),
        layer
      );
    }

    // Update the second one
    await runWithService(
      (svc) =>
        svc.updateSlide("deck-1", 1, { content: "Updated Slide 1" }),
      layer
    );

    // Navigate to last
    await runWithService(
      (svc) => svc.changeCurrentSlide("deck-1", 2),
      layer
    );

    // Remove first
    await runWithService(
      (svc) => svc.removeSlide("deck-1", 0),
      layer
    );

    // Verify final state
    const exitFinal = await runWithService(
      (svc) => svc.getDeck("deck-1"),
      layer
    );

    const state = expectSuccess(exitFinal);
    expect(state.slides).toHaveLength(2);
    expect(state.slides[0]!.content).toBe("Updated Slide 1");
    expect(state.slides[1]!.content).toBe("Slide 2");
    // currentSlide was 2, after removing index 0 it should adjust to 1
    expect(state.currentSlide).toBe(1);
  });

  test("concurrent addSlide operations on same deck are serializable", async () => {
    const { layer, storeMap } = createTestLayer();
    seedDeck(storeMap, "deck-1", 0);

    // Run multiple adds sequentially (in-memory store is sync, but verifies consistency)
    const promises = Array.from({ length: 5 }, (_, i) =>
      runWithService(
        (svc) => svc.addSlide("deck-1", { content: `Concurrent ${i}` }),
        layer
      )
    );

    const exits = await Promise.all(promises);
    for (const exit of exits) {
      expectSuccess(exit);
    }

    const finalExit = await runWithService(
      (svc) => svc.getDeck("deck-1"),
      layer
    );

    const state = expectSuccess(finalExit);
    expect(state.slides).toHaveLength(5);
    // All indices should be sequential
    state.slides.forEach((slide, i) => {
      expect(slide.index).toBe(i);
    });
  });
});
