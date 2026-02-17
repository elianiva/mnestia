import * as v from "valibot";
import { SlideFrontmatterSchema } from "./slide.js";

export const LayoutPropsSchema = v.object({
  children: v.unknown(),
  className: v.optional(v.string()),
  style: v.optional(v.record(v.string(), v.unknown())),
});

export type LayoutProps = v.InferOutput<typeof LayoutPropsSchema>;

export const LayoutComponentSchema = v.function();

export type LayoutComponent = v.InferOutput<typeof LayoutComponentSchema>;

export const ThemeComponentPropsSchema = v.object({
  className: v.optional(v.string()),
  style: v.optional(v.record(v.string(), v.unknown())),
});

export type ThemeComponentProps = v.InferOutput<typeof ThemeComponentPropsSchema>;

export const ThemeModuleSchema = v.object({
  name: v.string(),
  layouts: v.record(v.string(), LayoutComponentSchema),
  components: v.record(v.string(), v.function()),
  styles: v.object({
    variables: v.string(),
    global: v.optional(v.string()),
  }),
  setup: v.optional(v.function()),
});

export type ThemeModule = v.InferOutput<typeof ThemeModuleSchema>;

export const ThemeConfigSchema = v.object({
  name: v.string(),
  extends: v.optional(v.string()),
  layouts: v.optional(v.record(v.string(), LayoutComponentSchema)),
  components: v.optional(v.record(v.string(), v.function())),
  styles: v.optional(
    v.object({
      variables: v.optional(v.record(v.string(), v.string())),
      global: v.optional(v.string()),
    }),
  ),
});

export type ThemeConfig = v.InferOutput<typeof ThemeConfigSchema>;
