import * as v from "valibot";

export const SlideFrontmatterSchema = v.object({
  layout: v.optional(v.string()),
  transition: v.optional(
    v.object({
      type: v.union([v.literal("css"), v.literal("framer-motion")]),
      name: v.optional(
        v.union([
          v.literal("slide-left"),
          v.literal("slide-right"),
          v.literal("fade"),
          v.literal("zoom"),
          v.literal("none"),
        ]),
      ),
      config: v.optional(
        v.object({
          initial: v.optional(v.record(v.string(), v.unknown())),
          animate: v.optional(v.record(v.string(), v.unknown())),
          exit: v.optional(v.record(v.string(), v.unknown())),
        }),
      ),
    }),
  ),
  background: v.optional(v.string()),
  backgroundPosition: v.optional(v.string()),
  backgroundSize: v.optional(v.string()),
  backgroundOpacity: v.optional(v.number()),
  notes: v.optional(v.string()),
  clicks: v.optional(v.number()),
});

export type SlideFrontmatter = v.InferOutput<typeof SlideFrontmatterSchema>;

export const TransitionConfigSchema = v.object({
  type: v.union([v.literal("css"), v.literal("framer-motion")]),
  name: v.optional(
    v.union([
      v.literal("slide-left"),
      v.literal("slide-right"),
      v.literal("fade"),
      v.literal("zoom"),
      v.literal("none"),
    ]),
  ),
  config: v.optional(
    v.object({
      initial: v.optional(v.record(v.string(), v.unknown())),
      animate: v.optional(v.record(v.string(), v.unknown())),
      exit: v.optional(v.record(v.string(), v.unknown())),
    }),
  ),
});

export type TransitionConfig = v.InferOutput<typeof TransitionConfigSchema>;

export const SlideModuleSchema = v.object({
  default: v.function(),
  options: v.optional(
    v.object({
      frontmatter: v.optional(SlideFrontmatterSchema),
    }),
  ),
});

export type SlideModule = v.InferOutput<typeof SlideModuleSchema>;

export const SlideSchema = v.object({
  id: v.string(),
  index: v.number(),
  component: v.function(),
  frontmatter: SlideFrontmatterSchema,
  filepath: v.string(),
});

export type Slide = v.InferOutput<typeof SlideSchema>;

export const ParsedSlideSchema = v.intersect([
  SlideSchema,
  v.object({
    content: v.optional(v.string()),
  }),
]);

export type ParsedSlide = v.InferOutput<typeof ParsedSlideSchema>;
