import * as v from "valibot";

export const NavigationModeSchema = v.union([
  v.literal("standard"),
  v.literal("vim"),
  v.literal("both"),
]);

export type NavigationMode = v.InferOutput<typeof NavigationModeSchema>;

export const NavigationShortcutSchema = v.object({
  key: v.string(),
  action: v.union([
    v.literal("next"),
    v.literal("prev"),
    v.literal("first"),
    v.literal("last"),
    v.literal("goTo"),
  ]),
  value: v.optional(v.number()),
});

export type NavigationShortcut = v.InferOutput<typeof NavigationShortcutSchema>;

export const NavigationConfigSchema = v.object({
  mode: NavigationModeSchema,
  shortcuts: v.optional(v.array(NavigationShortcutSchema)),
  enableMouseClick: v.optional(v.boolean()),
  enableTouchSwipe: v.optional(v.boolean()),
});

export type NavigationConfig = v.InferOutput<typeof NavigationConfigSchema>;
