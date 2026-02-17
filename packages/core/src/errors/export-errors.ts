import { Schema } from "effect";

export class ExportError extends Schema.TaggedError<ExportError>()(
	"ExportError",
	{
		format: Schema.String,
		message: Schema.String,
		cause: Schema.optional(Schema.String),
	},
) {}
