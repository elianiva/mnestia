import * as v from "valibot";
export declare const AspectRatioSchema: v.UnionSchema<[v.LiteralSchema<"16/9", undefined>, v.LiteralSchema<"4/3", undefined>, v.LiteralSchema<"16/10", undefined>, v.StringSchema<undefined>], undefined>;
export type AspectRatio = v.InferOutput<typeof AspectRatioSchema>;
export declare const DeckConfigSchema: v.ObjectSchema<{
    readonly slides: v.ArraySchema<v.ObjectSchema<{
        readonly id: v.StringSchema<undefined>;
        readonly index: v.NumberSchema<undefined>;
        readonly component: v.FunctionSchema<undefined>;
        readonly frontmatter: v.ObjectSchema<{
            readonly layout: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly transition: v.OptionalSchema<v.ObjectSchema<{
                readonly type: v.UnionSchema<[v.LiteralSchema<"css", undefined>, v.LiteralSchema<"framer-motion", undefined>], undefined>;
                readonly name: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<"slide-left", undefined>, v.LiteralSchema<"slide-right", undefined>, v.LiteralSchema<"fade", undefined>, v.LiteralSchema<"zoom", undefined>, v.LiteralSchema<"none", undefined>], undefined>, undefined>;
                readonly config: v.OptionalSchema<v.ObjectSchema<{
                    readonly initial: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
                    readonly animate: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
                    readonly exit: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
                }, undefined>, undefined>;
            }, undefined>, undefined>;
            readonly background: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly backgroundPosition: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly backgroundSize: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly backgroundOpacity: v.OptionalSchema<v.NumberSchema<undefined>, undefined>;
            readonly notes: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly clicks: v.OptionalSchema<v.NumberSchema<undefined>, undefined>;
        }, undefined>;
        readonly filepath: v.StringSchema<undefined>;
    }, undefined>, undefined>;
    readonly theme: v.UnionSchema<[v.StringSchema<undefined>, v.ObjectSchema<{
        readonly name: v.StringSchema<undefined>;
        readonly layouts: v.RecordSchema<v.StringSchema<undefined>, v.FunctionSchema<undefined>, undefined>;
        readonly components: v.RecordSchema<v.StringSchema<undefined>, v.FunctionSchema<undefined>, undefined>;
        readonly styles: v.ObjectSchema<{
            readonly variables: v.StringSchema<undefined>;
            readonly global: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        }, undefined>;
        readonly setup: v.OptionalSchema<v.FunctionSchema<undefined>, undefined>;
    }, undefined>], undefined>;
    readonly navigation: v.ObjectSchema<{
        readonly mode: v.UnionSchema<[v.LiteralSchema<"standard", undefined>, v.LiteralSchema<"vim", undefined>, v.LiteralSchema<"both", undefined>], undefined>;
        readonly shortcuts: v.OptionalSchema<v.ArraySchema<v.ObjectSchema<{
            readonly key: v.StringSchema<undefined>;
            readonly action: v.UnionSchema<[v.LiteralSchema<"next", undefined>, v.LiteralSchema<"prev", undefined>, v.LiteralSchema<"first", undefined>, v.LiteralSchema<"last", undefined>, v.LiteralSchema<"goTo", undefined>], undefined>;
            readonly value: v.OptionalSchema<v.NumberSchema<undefined>, undefined>;
        }, undefined>, undefined>, undefined>;
        readonly enableMouseClick: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        readonly enableTouchSwipe: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    }, undefined>;
    readonly aspectRatio: v.UnionSchema<[v.LiteralSchema<"16/9", undefined>, v.LiteralSchema<"4/3", undefined>, v.LiteralSchema<"16/10", undefined>, v.StringSchema<undefined>], undefined>;
    readonly export: v.OptionalSchema<v.ObjectSchema<{
        readonly enabled: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        readonly format: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<"pdf", undefined>, v.LiteralSchema<"html", undefined>, v.LiteralSchema<"pptx", undefined>, v.LiteralSchema<"all", undefined>], undefined>, undefined>;
        readonly outputDir: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        readonly filename: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    }, undefined>, undefined>;
}, undefined>;
export type DeckConfig = v.InferOutput<typeof DeckConfigSchema>;
export declare const DeckDefinitionInputSchema: v.ObjectSchema<{
    readonly slides: v.ArraySchema<v.ObjectSchema<{
        readonly id: v.StringSchema<undefined>;
        readonly index: v.NumberSchema<undefined>;
        readonly component: v.FunctionSchema<undefined>;
        readonly frontmatter: v.ObjectSchema<{
            readonly layout: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly transition: v.OptionalSchema<v.ObjectSchema<{
                readonly type: v.UnionSchema<[v.LiteralSchema<"css", undefined>, v.LiteralSchema<"framer-motion", undefined>], undefined>;
                readonly name: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<"slide-left", undefined>, v.LiteralSchema<"slide-right", undefined>, v.LiteralSchema<"fade", undefined>, v.LiteralSchema<"zoom", undefined>, v.LiteralSchema<"none", undefined>], undefined>, undefined>;
                readonly config: v.OptionalSchema<v.ObjectSchema<{
                    readonly initial: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
                    readonly animate: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
                    readonly exit: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
                }, undefined>, undefined>;
            }, undefined>, undefined>;
            readonly background: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly backgroundPosition: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly backgroundSize: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly backgroundOpacity: v.OptionalSchema<v.NumberSchema<undefined>, undefined>;
            readonly notes: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly clicks: v.OptionalSchema<v.NumberSchema<undefined>, undefined>;
        }, undefined>;
        readonly filepath: v.StringSchema<undefined>;
    }, undefined>, undefined>;
    readonly theme: v.OptionalSchema<v.UnionSchema<[v.StringSchema<undefined>, v.ObjectSchema<{
        readonly name: v.StringSchema<undefined>;
        readonly layouts: v.RecordSchema<v.StringSchema<undefined>, v.FunctionSchema<undefined>, undefined>;
        readonly components: v.RecordSchema<v.StringSchema<undefined>, v.FunctionSchema<undefined>, undefined>;
        readonly styles: v.ObjectSchema<{
            readonly variables: v.StringSchema<undefined>;
            readonly global: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        }, undefined>;
        readonly setup: v.OptionalSchema<v.FunctionSchema<undefined>, undefined>;
    }, undefined>], undefined>, undefined>;
    readonly navigation: v.OptionalSchema<v.ObjectSchema<{
        readonly mode: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<"standard", undefined>, v.LiteralSchema<"vim", undefined>, v.LiteralSchema<"both", undefined>], undefined>, undefined>;
        readonly shortcuts: v.OptionalSchema<v.OptionalSchema<v.ArraySchema<v.ObjectSchema<{
            readonly key: v.StringSchema<undefined>;
            readonly action: v.UnionSchema<[v.LiteralSchema<"next", undefined>, v.LiteralSchema<"prev", undefined>, v.LiteralSchema<"first", undefined>, v.LiteralSchema<"last", undefined>, v.LiteralSchema<"goTo", undefined>], undefined>;
            readonly value: v.OptionalSchema<v.NumberSchema<undefined>, undefined>;
        }, undefined>, undefined>, undefined>, undefined>;
        readonly enableMouseClick: v.OptionalSchema<v.OptionalSchema<v.BooleanSchema<undefined>, undefined>, undefined>;
        readonly enableTouchSwipe: v.OptionalSchema<v.OptionalSchema<v.BooleanSchema<undefined>, undefined>, undefined>;
    }, undefined>, undefined>;
    readonly aspectRatio: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<"16/9", undefined>, v.LiteralSchema<"4/3", undefined>, v.LiteralSchema<"16/10", undefined>, v.StringSchema<undefined>], undefined>, undefined>;
    readonly export: v.OptionalSchema<v.ObjectSchema<{
        readonly enabled: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        readonly format: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<"pdf", undefined>, v.LiteralSchema<"html", undefined>, v.LiteralSchema<"pptx", undefined>, v.LiteralSchema<"all", undefined>], undefined>, undefined>;
        readonly outputDir: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        readonly filename: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    }, undefined>, undefined>;
}, undefined>;
export type DeckDefinitionInput = v.InferOutput<typeof DeckDefinitionInputSchema>;
export declare const DeckStateSchema: v.ObjectSchema<{
    readonly currentSlide: v.NumberSchema<undefined>;
    readonly totalSlides: v.NumberSchema<undefined>;
    readonly history: v.ArraySchema<v.NumberSchema<undefined>, undefined>;
    readonly isPresenterMode: v.BooleanSchema<undefined>;
    readonly isFullscreen: v.BooleanSchema<undefined>;
}, undefined>;
export type DeckState = v.InferOutput<typeof DeckStateSchema>;
