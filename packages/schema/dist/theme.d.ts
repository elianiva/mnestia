import * as v from "valibot";
export declare const LayoutPropsSchema: v.ObjectSchema<{
    readonly children: v.UnknownSchema;
    readonly className: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    readonly style: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
}, undefined>;
export type LayoutProps = v.InferOutput<typeof LayoutPropsSchema>;
export declare const LayoutComponentSchema: v.FunctionSchema<undefined>;
export type LayoutComponent = v.InferOutput<typeof LayoutComponentSchema>;
export declare const ThemeComponentPropsSchema: v.ObjectSchema<{
    readonly className: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    readonly style: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>, undefined>;
}, undefined>;
export type ThemeComponentProps = v.InferOutput<typeof ThemeComponentPropsSchema>;
export declare const ThemeModuleSchema: v.ObjectSchema<{
    readonly name: v.StringSchema<undefined>;
    readonly layouts: v.RecordSchema<v.StringSchema<undefined>, v.FunctionSchema<undefined>, undefined>;
    readonly components: v.RecordSchema<v.StringSchema<undefined>, v.FunctionSchema<undefined>, undefined>;
    readonly styles: v.ObjectSchema<{
        readonly variables: v.StringSchema<undefined>;
        readonly global: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    }, undefined>;
    readonly setup: v.OptionalSchema<v.FunctionSchema<undefined>, undefined>;
}, undefined>;
export type ThemeModule = v.InferOutput<typeof ThemeModuleSchema>;
export declare const ThemeConfigSchema: v.ObjectSchema<{
    readonly name: v.StringSchema<undefined>;
    readonly extends: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    readonly layouts: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.FunctionSchema<undefined>, undefined>, undefined>;
    readonly components: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.FunctionSchema<undefined>, undefined>, undefined>;
    readonly styles: v.OptionalSchema<v.ObjectSchema<{
        readonly variables: v.OptionalSchema<v.RecordSchema<v.StringSchema<undefined>, v.StringSchema<undefined>, undefined>, undefined>;
        readonly global: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    }, undefined>, undefined>;
}, undefined>;
export type ThemeConfig = v.InferOutput<typeof ThemeConfigSchema>;
