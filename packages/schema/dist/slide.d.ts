import * as v from "valibot";
export declare const SlideFrontmatterSchema: v.ObjectSchema<{
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
export type SlideFrontmatter = v.InferOutput<typeof SlideFrontmatterSchema>;
export declare const TransitionConfigSchema: v.ObjectSchema<{
    readonly type: v.UnionSchema<[v.LiteralSchema<"css", undefined>, v.LiteralSchema<"framer-motion", undefined>], undefined>;
    readonly name: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<"slide-left", undefined>, v.LiteralSchema<"slide-right", undefined>, v.LiteralSchema<"fade", undefined>, v.LiteralSchema<"zoom", undefined>, v.LiteralSchema<"none", undefined>], undefined>, undefined>;
    readonly config: v.OptionalSchema<v.ObjectSchema<{
        readonly initial: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
        readonly animate: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
        readonly exit: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
    }, undefined>, undefined>;
}, undefined>;
export type TransitionConfig = v.InferOutput<typeof TransitionConfigSchema>;
export declare const SlideModuleSchema: v.ObjectSchema<{
    readonly default: v.FunctionSchema<undefined>;
    readonly options: v.OptionalSchema<v.ObjectSchema<{
        readonly frontmatter: v.OptionalSchema<v.ObjectSchema<{
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
        }, undefined>, undefined>;
    }, undefined>, undefined>;
}, undefined>;
export type SlideModule = v.InferOutput<typeof SlideModuleSchema>;
export declare const SlideSchema: v.ObjectSchema<{
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
}, undefined>;
export type Slide = v.InferOutput<typeof SlideSchema>;
export declare const ParsedSlideSchema: v.IntersectSchema<[v.ObjectSchema<{
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
}, undefined>, v.ObjectSchema<{
    readonly content: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
}, undefined>], undefined>;
export type ParsedSlide = v.InferOutput<typeof ParsedSlideSchema>;
