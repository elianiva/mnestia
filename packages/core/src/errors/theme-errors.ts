import { Schema } from "effect";

export class ThemeLoadError extends Schema.TaggedError<ThemeLoadError>()(
	"ThemeLoadError",
	{
		themeName: Schema.String,
		message: Schema.String,
		cause: Schema.optional(Schema.String),
	},
) {}

export class ThemeNotFoundError extends Schema.TaggedError<ThemeNotFoundError>()(
	"ThemeNotFoundError",
	{
		themeName: Schema.String,
		message: Schema.String,
	},
) {}
