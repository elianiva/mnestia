import * as v from "valibot";
import { SlideSchema, SlideFrontmatterSchema } from "./slide.js";
import { NavigationConfigSchema } from "./navigation.js";
import { ThemeModuleSchema } from "./theme.js";
import { ExportConfigSchema } from "./export.js";

export const AspectRatioSchema = v.union([
  v.literal("16/9"),
  v.literal("4/3"),
  v.literal("16/10"),
  v.string(),
]);

export type AspectRatio = v.InferOutput<typeof AspectRatioSchema>;

export const DeckConfigSchema = v.object({
  slides: v.array(SlideSchema),
  theme: v.union([v.string(), ThemeModuleSchema]),
  navigation: NavigationConfigSchema,
  aspectRatio: AspectRatioSchema,
  export: v.optional(ExportConfigSchema),
});

export type DeckConfig = v.InferOutput<typeof DeckConfigSchema>;

export const DeckDefinitionInputSchema = v.object({
  slides: v.array(SlideSchema),
  theme: v.optional(v.union([v.string(), ThemeModuleSchema])),
  navigation: v.optional(
    v.object({
      mode: v.optional(NavigationConfigSchema.entries.mode),
      shortcuts: v.optional(NavigationConfigSchema.entries.shortcuts),
      enableMouseClick: v.optional(NavigationConfigSchema.entries.enableMouseClick),
      enableTouchSwipe: v.optional(NavigationConfigSchema.entries.enableTouchSwipe),
    }),
  ),
  aspectRatio: v.optional(AspectRatioSchema),
  export: v.optional(ExportConfigSchema),
});

export type DeckDefinitionInput = v.InferOutput<typeof DeckDefinitionInputSchema>;

export const DeckStateSchema = v.object({
  currentSlide: v.number(),
  totalSlides: v.number(),
  history: v.array(v.number()),
  isPresenterMode: v.boolean(),
  isFullscreen: v.boolean(),
});

export type DeckState = v.InferOutput<typeof DeckStateSchema>;
