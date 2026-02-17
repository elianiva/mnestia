import * as v from "valibot";
export declare const ExportConfigSchema: v.ObjectSchema<{
    readonly enabled: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    readonly format: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<"pdf", undefined>, v.LiteralSchema<"html", undefined>, v.LiteralSchema<"pptx", undefined>, v.LiteralSchema<"all", undefined>], undefined>, undefined>;
    readonly outputDir: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    readonly filename: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
}, undefined>;
export type ExportConfig = v.InferOutput<typeof ExportConfigSchema>;
export declare const ExportOptionsSchema: v.ObjectSchema<{
    readonly format: v.UnionSchema<[v.LiteralSchema<"pdf", undefined>, v.LiteralSchema<"html", undefined>, v.LiteralSchema<"pptx", undefined>], undefined>;
    readonly outputDir: v.StringSchema<undefined>;
    readonly filename: v.StringSchema<undefined>;
    readonly includeSpeakerNotes: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    readonly includeAnimations: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    readonly pageSize: v.OptionalSchema<v.ObjectSchema<{
        readonly width: v.NumberSchema<undefined>;
        readonly height: v.NumberSchema<undefined>;
    }, undefined>, undefined>;
}, undefined>;
export type ExportOptions = v.InferOutput<typeof ExportOptionsSchema>;
export declare const ExportResultSchema: v.ObjectSchema<{
    readonly success: v.BooleanSchema<undefined>;
    readonly filepath: v.StringSchema<undefined>;
    readonly format: v.StringSchema<undefined>;
    readonly message: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
}, undefined>;
export type ExportResult = v.InferOutput<typeof ExportResultSchema>;
