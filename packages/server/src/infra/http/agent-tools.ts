import { toolDefinition } from "@tanstack/ai";
import {
  addSlideInputSchema,
  removeSlideInputSchema,
  updateSlideInputSchema,
  reorderSlidesInputSchema,
  changeCurrentSlideInputSchema,
  toolResultSchema,
} from "@mnestia/schema";

// ── Tool Definitions ──────────────────────────────────────────────

export const addSlideDef = toolDefinition({
  name: "add_slide",
  description:
    "Add a new slide to the presentation deck. Optionally specify content, layout, notes, and position.",
  inputSchema: addSlideInputSchema,
  outputSchema: toolResultSchema,
});

export const removeSlideDef = toolDefinition({
  name: "remove_slide",
  description:
    "Remove a slide from the deck by its index. Adjusts current slide if needed.",
  inputSchema: removeSlideInputSchema,
  outputSchema: toolResultSchema,
});

export const updateSlideDef = toolDefinition({
  name: "update_slide",
  description:
    "Update the content, layout, or notes of an existing slide in the deck.",
  inputSchema: updateSlideInputSchema,
  outputSchema: toolResultSchema,
});

export const reorderSlidesDef = toolDefinition({
  name: "reorder_slides",
  description:
    "Move a slide from one position to another within the deck.",
  inputSchema: reorderSlidesInputSchema,
  outputSchema: toolResultSchema,
});

export const changeCurrentSlideDef = toolDefinition({
  name: "change_current_slide",
  description:
    "Navigate to a specific slide in the deck by index.",
  inputSchema: changeCurrentSlideInputSchema,
  outputSchema: toolResultSchema,
});
