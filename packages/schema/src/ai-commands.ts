import * as v from "valibot";
import { toStandardJsonSchema } from "@valibot/to-json-schema";

// ── Command Schemas (used by SlideCommandSchema) ──────────────────

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

// ── AI Tool JSON Schemas (Standard JSON Schema, ready to use) ─────

export const addSlideInputSchema = toStandardJsonSchema(
  v.object({
    deckId: v.pipe(
      v.string(),
      v.description("The ID of the deck to add a slide to")
    ),
    content: v.optional(
      v.pipe(v.string(), v.description("The content of the slide"))
    ),
    layout: v.optional(
      v.pipe(v.string(), v.description("The layout template to use"))
    ),
    notes: v.optional(
      v.pipe(v.string(), v.description("Speaker notes for the slide"))
    ),
    position: v.optional(
      v.pipe(
        v.number(),
        v.description("Position to insert the slide at (0-based index)")
      )
    ),
  })
);

export const removeSlideInputSchema = toStandardJsonSchema(
  v.object({
    deckId: v.pipe(v.string(), v.description("The ID of the deck")),
    slideIndex: v.pipe(
      v.number(),
      v.description("The index of the slide to remove (0-based)")
    ),
  })
);

export const updateSlideInputSchema = toStandardJsonSchema(
  v.object({
    deckId: v.pipe(v.string(), v.description("The ID of the deck")),
    slideIndex: v.pipe(
      v.number(),
      v.description("The index of the slide to update (0-based)")
    ),
    content: v.optional(
      v.pipe(v.string(), v.description("New content for the slide"))
    ),
    layout: v.optional(
      v.pipe(
        v.string(),
        v.description("New layout template for the slide")
      )
    ),
    notes: v.optional(
      v.pipe(
        v.string(),
        v.description("New speaker notes for the slide")
      )
    ),
  })
);

export const reorderSlidesInputSchema = toStandardJsonSchema(
  v.object({
    deckId: v.pipe(v.string(), v.description("The ID of the deck")),
    fromIndex: v.pipe(
      v.number(),
      v.description("The current index of the slide to move")
    ),
    toIndex: v.pipe(
      v.number(),
      v.description("The target index to move the slide to")
    ),
  })
);

export const changeCurrentSlideInputSchema = toStandardJsonSchema(
  v.object({
    deckId: v.pipe(v.string(), v.description("The ID of the deck")),
    slideIndex: v.pipe(
      v.number(),
      v.description("The index of the slide to navigate to (0-based)")
    ),
  })
);

export const toolResultSchema = toStandardJsonSchema(
  v.object({
    success: v.boolean(),
    slideCount: v.number(),
    currentSlide: v.number(),
  })
);
