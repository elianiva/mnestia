import * as v from "valibot";

export const ServerSlideSchema = v.object({
  id: v.string(),
  index: v.number(),
  content: v.optional(v.string()),
  layout: v.optional(v.string()),
  notes: v.optional(v.string()),
});

export type ServerSlide = v.InferOutput<typeof ServerSlideSchema>;

export const ServerDeckStateSchema = v.object({
  currentSlide: v.number(),
  slides: v.array(ServerSlideSchema),
});

export type ServerDeckState = v.InferOutput<typeof ServerDeckStateSchema>;
