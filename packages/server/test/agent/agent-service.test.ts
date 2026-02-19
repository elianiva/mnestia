import { test, expect, describe } from "bun:test";
import { Layer } from "effect";
import type { ServerDeckState } from "@mnestia/schema";
import { createAgentTools } from "@/application/agent-tool-factory";
import type { BroadcastFn } from "@/application/agent-tool-executor";
import { createSlideRuntime } from "@/infra/ws/effect-runtime";
import type { DeckStateInternal } from "@/domain/ports/slide-store";
import { seedDeck } from "../helpers";

// ── Test Helpers ──────────────────────────────────────────────────

interface BroadcastRecord {
  deckId: string;
  state: ServerDeckState;
}

function createTestContext() {
  const storeMap = new Map<string, DeckStateInternal>();
  const runtime = createSlideRuntime(storeMap, Layer.empty);
  const broadcasts: BroadcastRecord[] = [];
  const broadcast: BroadcastFn = (deckId, state) => {
    broadcasts.push({ deckId, state });
  };
  const tools = createAgentTools(runtime, broadcast);

  // Tools are returned in order: [addSlide, removeSlide, updateSlide, reorderSlides, changeCurrentSlide]
  const [addSlide, removeSlide, updateSlide, reorderSlides, changeCurrentSlide] = tools;

  return {
    storeMap,
    runtime,
    broadcasts,
    tools: { addSlide, removeSlide, updateSlide, reorderSlides, changeCurrentSlide },
  };
}

// ── add_slide tool ────────────────────────────────────────────────

describe("createServerTools", () => {
  describe("add_slide tool", () => {
    test("adds a slide and returns success result", async () => {
      const { storeMap, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 1);

      const result = await tools.addSlide.execute!({
        deckId: "deck-1",
        content: "New slide content",
        layout: "title",
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(2);
      expect(result.currentSlide).toBe(0);
    });

    test("broadcasts state after adding a slide", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 0);

      await tools.addSlide.execute!({
        deckId: "deck-1",
        content: "Broadcast test",
      });

      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0]!.deckId).toBe("deck-1");
      expect(broadcasts[0]!.state.slides).toHaveLength(1);
      expect(broadcasts[0]!.state.slides[0]!.content).toBe("Broadcast test");
    });

    test("adds a slide at specific position", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 3);

      const result = await tools.addSlide.execute!({
        deckId: "deck-1",
        content: "Inserted",
        position: 1,
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(4);

      // Verify via broadcast that the slide is at the right position
      expect(broadcasts[0]!.state.slides[1]!.content).toBe("Inserted");
    });

    test("adds a slide with notes", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 0);

      await tools.addSlide.execute!({
        deckId: "deck-1",
        content: "With notes",
        notes: "Speaker notes here",
      });

      expect(broadcasts[0]!.state.slides[0]!.notes).toBe("Speaker notes here");
    });

    test("returns failure result for nonexistent deck", async () => {
      const { broadcasts, tools } = createTestContext();

      const result = await tools.addSlide.execute!({
        deckId: "nonexistent",
        content: "X",
      });

      expect(result.success).toBe(false);
      expect(result.slideCount).toBe(0);
      expect(result.currentSlide).toBe(0);
      // Should NOT broadcast on failure
      expect(broadcasts).toHaveLength(0);
    });
  });

  // ── remove_slide tool ─────────────────────────────────────────

  describe("remove_slide tool", () => {
    test("removes a slide and returns success result", async () => {
      const { storeMap, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 3);

      const result = await tools.removeSlide.execute!({
        deckId: "deck-1",
        slideIndex: 1,
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(2);
    });

    test("broadcasts state after removing a slide", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 3);

      await tools.removeSlide.execute!({
        deckId: "deck-1",
        slideIndex: 0,
      });

      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0]!.deckId).toBe("deck-1");
      expect(broadcasts[0]!.state.slides).toHaveLength(2);
    });

    test("adjusts currentSlide when removing the current slide", async () => {
      const { storeMap, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 3, 2);

      const result = await tools.removeSlide.execute!({
        deckId: "deck-1",
        slideIndex: 2,
      });

      expect(result.success).toBe(true);
      expect(result.currentSlide).toBeLessThanOrEqual(1);
    });

    test("returns failure result for invalid slide index", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 2);

      const result = await tools.removeSlide.execute!({
        deckId: "deck-1",
        slideIndex: 99,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });

    test("returns failure result for negative slide index", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 2);

      const result = await tools.removeSlide.execute!({
        deckId: "deck-1",
        slideIndex: -1,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });

    test("returns failure result for nonexistent deck", async () => {
      const { broadcasts, tools } = createTestContext();

      const result = await tools.removeSlide.execute!({
        deckId: "nonexistent",
        slideIndex: 0,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });
  });

  // ── update_slide tool ─────────────────────────────────────────

  describe("update_slide tool", () => {
    test("updates slide content and returns success result", async () => {
      const { storeMap, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 2);

      const result = await tools.updateSlide.execute!({
        deckId: "deck-1",
        slideIndex: 0,
        content: "Updated content",
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(2);
    });

    test("broadcasts state after updating a slide", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 2);

      await tools.updateSlide.execute!({
        deckId: "deck-1",
        slideIndex: 0,
        content: "Updated",
        layout: "two-column",
        notes: "New notes",
      });

      expect(broadcasts).toHaveLength(1);
      const slide = broadcasts[0]!.state.slides[0]!;
      expect(slide.content).toBe("Updated");
      expect(slide.layout).toBe("two-column");
      expect(slide.notes).toBe("New notes");
    });

    test("preserves unchanged fields", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 2);

      await tools.updateSlide.execute!({
        deckId: "deck-1",
        slideIndex: 0,
        notes: "Only notes changed",
      });

      expect(broadcasts).toHaveLength(1);
      const slide = broadcasts[0]!.state.slides[0]!;
      expect(slide.content).toBe("Content for slide 0");
      expect(slide.layout).toBe("default");
      expect(slide.notes).toBe("Only notes changed");
    });

    test("returns failure result for out-of-bounds index", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 2);

      const result = await tools.updateSlide.execute!({
        deckId: "deck-1",
        slideIndex: 10,
        content: "X",
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });

    test("returns failure result for nonexistent deck", async () => {
      const { broadcasts, tools } = createTestContext();

      const result = await tools.updateSlide.execute!({
        deckId: "ghost",
        slideIndex: 0,
        content: "X",
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });
  });

  // ── reorder_slides tool ───────────────────────────────────────

  describe("reorder_slides tool", () => {
    test("reorders slides and returns success result", async () => {
      const { storeMap, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 4);

      const result = await tools.reorderSlides.execute!({
        deckId: "deck-1",
        fromIndex: 0,
        toIndex: 3,
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(4);
    });

    test("broadcasts state after reordering", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 4);

      await tools.reorderSlides.execute!({
        deckId: "deck-1",
        fromIndex: 0,
        toIndex: 2,
      });

      expect(broadcasts).toHaveLength(1);
      // Original slide-0 should now be at index 2
      expect(broadcasts[0]!.state.slides[2]!.id).toBe("slide-0");
    });

    test("updates currentSlide when moving the active slide", async () => {
      const { storeMap, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 4, 1);

      const result = await tools.reorderSlides.execute!({
        deckId: "deck-1",
        fromIndex: 1,
        toIndex: 3,
      });

      expect(result.success).toBe(true);
      expect(result.currentSlide).toBe(3);
    });

    test("returns failure result for invalid fromIndex", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 3);

      const result = await tools.reorderSlides.execute!({
        deckId: "deck-1",
        fromIndex: -1,
        toIndex: 1,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });

    test("returns failure result for invalid toIndex", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 3);

      const result = await tools.reorderSlides.execute!({
        deckId: "deck-1",
        fromIndex: 0,
        toIndex: 99,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });

    test("returns failure result for nonexistent deck", async () => {
      const { broadcasts, tools } = createTestContext();

      const result = await tools.reorderSlides.execute!({
        deckId: "nonexistent",
        fromIndex: 0,
        toIndex: 1,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });
  });

  // ── change_current_slide tool ─────────────────────────────────

  describe("change_current_slide tool", () => {
    test("changes current slide and returns success result", async () => {
      const { storeMap, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 5);

      const result = await tools.changeCurrentSlide.execute!({
        deckId: "deck-1",
        slideIndex: 3,
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(5);
      expect(result.currentSlide).toBe(3);
    });

    test("broadcasts state after changing current slide", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 5);

      await tools.changeCurrentSlide.execute!({
        deckId: "deck-1",
        slideIndex: 4,
      });

      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0]!.deckId).toBe("deck-1");
      expect(broadcasts[0]!.state.currentSlide).toBe(4);
    });

    test("returns failure result for out-of-bounds index", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 3);

      const result = await tools.changeCurrentSlide.execute!({
        deckId: "deck-1",
        slideIndex: 99,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });

    test("returns failure result for negative index", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 3);

      const result = await tools.changeCurrentSlide.execute!({
        deckId: "deck-1",
        slideIndex: -1,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });

    test("returns failure result for nonexistent deck", async () => {
      const { broadcasts, tools } = createTestContext();

      const result = await tools.changeCurrentSlide.execute!({
        deckId: "nonexistent",
        slideIndex: 0,
      });

      expect(result.success).toBe(false);
      expect(broadcasts).toHaveLength(0);
    });
  });

  // ── Cross-tool integration ────────────────────────────────────

  describe("cross-tool integration", () => {
    test("multiple tool calls compose correctly on the same deck", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 0);

      // Add 3 slides
      await tools.addSlide.execute!({ deckId: "deck-1", content: "Slide A" });
      await tools.addSlide.execute!({ deckId: "deck-1", content: "Slide B" });
      await tools.addSlide.execute!({ deckId: "deck-1", content: "Slide C" });

      // Update the second
      await tools.updateSlide.execute!({
        deckId: "deck-1",
        slideIndex: 1,
        content: "Updated B",
      });

      // Navigate to last
      await tools.changeCurrentSlide.execute!({
        deckId: "deck-1",
        slideIndex: 2,
      });

      // Remove first
      const result = await tools.removeSlide.execute!({
        deckId: "deck-1",
        slideIndex: 0,
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(2);
      // All operations should have broadcast
      expect(broadcasts).toHaveLength(6);

      // Check final state from last broadcast
      const finalState = broadcasts[broadcasts.length - 1]!.state;
      expect(finalState.slides).toHaveLength(2);
      expect(finalState.slides[0]!.content).toBe("Updated B");
      expect(finalState.slides[1]!.content).toBe("Slide C");
    });

    test("tools on different decks are isolated", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-a", 2);
      seedDeck(storeMap, "deck-b", 3);

      await tools.addSlide.execute!({ deckId: "deck-a", content: "New A" });

      // deck-b should be unaffected
      const result = await tools.changeCurrentSlide.execute!({
        deckId: "deck-b",
        slideIndex: 1,
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(3);

      // Verify deck-a broadcast has 3 slides, deck-b broadcast has 3 slides
      const deckABroadcasts = broadcasts.filter((b) => b.deckId === "deck-a");
      const deckBBroadcasts = broadcasts.filter((b) => b.deckId === "deck-b");
      expect(deckABroadcasts[0]!.state.slides).toHaveLength(3);
      expect(deckBBroadcasts[0]!.state.slides).toHaveLength(3);
    });

    test("failure on one tool does not affect subsequent tool calls", async () => {
      const { storeMap, broadcasts, tools } = createTestContext();
      seedDeck(storeMap, "deck-1", 2);

      // Fail: remove invalid index
      const failResult = await tools.removeSlide.execute!({
        deckId: "deck-1",
        slideIndex: 99,
      });
      expect(failResult.success).toBe(false);

      // Succeed: add a slide (should still work)
      const successResult = await tools.addSlide.execute!({
        deckId: "deck-1",
        content: "After failure",
      });
      expect(successResult.success).toBe(true);
      expect(successResult.slideCount).toBe(3);

      // Only one broadcast (the successful one)
      expect(broadcasts).toHaveLength(1);
    });
  });

  // ── Tool metadata ─────────────────────────────────────────────

  describe("tool metadata", () => {
    test("tools have correct names", () => {
      const { tools } = createTestContext();

      expect(tools.addSlide.name).toBe("add_slide");
      expect(tools.removeSlide.name).toBe("remove_slide");
      expect(tools.updateSlide.name).toBe("update_slide");
      expect(tools.reorderSlides.name).toBe("reorder_slides");
      expect(tools.changeCurrentSlide.name).toBe("change_current_slide");
    });

    test("tools have descriptions", () => {
      const { tools } = createTestContext();

      expect(tools.addSlide.description).toBeTruthy();
      expect(tools.removeSlide.description).toBeTruthy();
      expect(tools.updateSlide.description).toBeTruthy();
      expect(tools.reorderSlides.description).toBeTruthy();
      expect(tools.changeCurrentSlide.description).toBeTruthy();
    });

    test("tools are marked as server-side", () => {
      const { tools } = createTestContext();

      expect((tools.addSlide as any).__toolSide).toBe("server");
      expect((tools.removeSlide as any).__toolSide).toBe("server");
      expect((tools.updateSlide as any).__toolSide).toBe("server");
      expect((tools.reorderSlides as any).__toolSide).toBe("server");
      expect((tools.changeCurrentSlide as any).__toolSide).toBe("server");
    });

    test("createAgentTools returns exactly 5 tools", () => {
      const storeMap = new Map<string, DeckStateInternal>();
      const runtime = createSlideRuntime(storeMap, Layer.empty);
      const tools = createAgentTools(runtime, () => {});

      expect(tools).toHaveLength(5);
    });
  });
});
