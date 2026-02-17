import * as v from "valibot";
export declare const NavigationModeSchema: v.UnionSchema<[v.LiteralSchema<"standard", undefined>, v.LiteralSchema<"vim", undefined>, v.LiteralSchema<"both", undefined>], undefined>;
export type NavigationMode = v.InferOutput<typeof NavigationModeSchema>;
export declare const NavigationShortcutSchema: v.ObjectSchema<{
    readonly key: v.StringSchema<undefined>;
    readonly action: v.UnionSchema<[v.LiteralSchema<"next", undefined>, v.LiteralSchema<"prev", undefined>, v.LiteralSchema<"first", undefined>, v.LiteralSchema<"last", undefined>, v.LiteralSchema<"goTo", undefined>], undefined>;
    readonly value: v.OptionalSchema<v.NumberSchema<undefined>, undefined>;
}, undefined>;
export type NavigationShortcut = v.InferOutput<typeof NavigationShortcutSchema>;
export declare const NavigationConfigSchema: v.ObjectSchema<{
    readonly mode: v.UnionSchema<[v.LiteralSchema<"standard", undefined>, v.LiteralSchema<"vim", undefined>, v.LiteralSchema<"both", undefined>], undefined>;
    readonly shortcuts: v.OptionalSchema<v.ArraySchema<v.ObjectSchema<{
        readonly key: v.StringSchema<undefined>;
        readonly action: v.UnionSchema<[v.LiteralSchema<"next", undefined>, v.LiteralSchema<"prev", undefined>, v.LiteralSchema<"first", undefined>, v.LiteralSchema<"last", undefined>, v.LiteralSchema<"goTo", undefined>], undefined>;
        readonly value: v.OptionalSchema<v.NumberSchema<undefined>, undefined>;
    }, undefined>, undefined>, undefined>;
    readonly enableMouseClick: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    readonly enableTouchSwipe: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
}, undefined>;
export type NavigationConfig = v.InferOutput<typeof NavigationConfigSchema>;
