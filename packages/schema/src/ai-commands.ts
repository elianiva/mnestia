import * as v from "valibot";

// ── Command Schemas ───────────────────────────────────────────────

const AddSlideCommandSchema = v.object({
  type: v.literal("ADD_SLIDE"),
  deckId: v.string(),
  slide: v.object({
    content: v.optional(v.string()),
    layout: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),
  position: v.optional(v.number()),
});

const RemoveSlideCommandSchema = v.object({
  type: v.literal("REMOVE_SLIDE"),
  deckId: v.string(),
  slideIndex: v.number(),
});

const UpdateSlideCommandSchema = v.object({
  type: v.literal("UPDATE_SLIDE"),
  deckId: v.string(),
  slideIndex: v.number(),
  content: v.optional(v.string()),
  layout: v.optional(v.string()),
  notes: v.optional(v.string()),
});

const ReorderSlidesCommandSchema = v.object({
  type: v.literal("REORDER_SLIDES"),
  deckId: v.string(),
  fromIndex: v.number(),
  toIndex: v.number(),
});

const ChangeCurrentSlideCommandSchema = v.object({
  type: v.literal("CHANGE_CURRENT_SLIDE"),
  deckId: v.string(),
  slideIndex: v.number(),
});

export const SlideCommandSchema = v.variant("type", [
  AddSlideCommandSchema,
  RemoveSlideCommandSchema,
  UpdateSlideCommandSchema,
  ReorderSlidesCommandSchema,
  ChangeCurrentSlideCommandSchema,
]);

export type SlideCommand = v.InferOutput<typeof SlideCommandSchema>;

// ── Tool Descriptions (injected into AI system prompt) ────────────

export const SLIDE_TOOL_DESCRIPTIONS = `You can manipulate slides by outputting a JSON command block wrapped in \`\`\`json fences.

Available commands:

1. ADD_SLIDE — Add a new slide
   { "type": "ADD_SLIDE", "deckId": "<id>", "slide": { "content?": "string", "layout?": "string", "notes?": "string" }, "position?": number }

2. REMOVE_SLIDE — Remove a slide by index (0-based)
   { "type": "REMOVE_SLIDE", "deckId": "<id>", "slideIndex": number }

3. UPDATE_SLIDE — Update content/layout/notes of an existing slide
   { "type": "UPDATE_SLIDE", "deckId": "<id>", "slideIndex": number, "content?": "string", "layout?": "string", "notes?": "string" }

4. REORDER_SLIDES — Move a slide from one position to another
   { "type": "REORDER_SLIDES", "deckId": "<id>", "fromIndex": number, "toIndex": number }

5. CHANGE_CURRENT_SLIDE — Navigate to a specific slide
   { "type": "CHANGE_CURRENT_SLIDE", "deckId": "<id>", "slideIndex": number }

Output exactly one JSON command per code block. You may output multiple code blocks for multiple operations.
Always confirm what you did after making changes.`;
