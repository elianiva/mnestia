import { Schema } from "effect";

export class SlideNotFoundError extends Schema.TaggedError<SlideNotFoundError>()(
	"SlideNotFoundError",
	{
		filepath: Schema.String,
		message: Schema.String,
	},
) {}

export class SlideLoadError extends Schema.TaggedError<SlideLoadError>()(
	"SlideLoadError",
	{
		filepath: Schema.String,
		message: Schema.String,
		cause: Schema.optional(Schema.String),
	},
) {}

export class InvalidSlideIndexError extends Schema.TaggedError<InvalidSlideIndexError>()(
	"InvalidSlideIndexError",
	{
		index: Schema.Number,
		totalSlides: Schema.Number,
		message: Schema.String,
	},
) {}
