import * as v from "valibot";

export const ExportConfigSchema = v.object({
  enabled: v.optional(v.boolean()),
  format: v.optional(
    v.union([v.literal("pdf"), v.literal("html"), v.literal("pptx"), v.literal("all")]),
  ),
  outputDir: v.optional(v.string()),
  filename: v.optional(v.string()),
});

export type ExportConfig = v.InferOutput<typeof ExportConfigSchema>;

export const ExportOptionsSchema = v.object({
  format: v.union([v.literal("pdf"), v.literal("html"), v.literal("pptx")]),
  outputDir: v.string(),
  filename: v.string(),
  includeSpeakerNotes: v.optional(v.boolean()),
  includeAnimations: v.optional(v.boolean()),
  pageSize: v.optional(
    v.object({
      width: v.number(),
      height: v.number(),
    }),
  ),
});

export type ExportOptions = v.InferOutput<typeof ExportOptionsSchema>;

export const ExportResultSchema = v.object({
  success: v.boolean(),
  filepath: v.string(),
  format: v.string(),
  message: v.optional(v.string()),
});

export type ExportResult = v.InferOutput<typeof ExportResultSchema>;
