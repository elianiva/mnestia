import { Data } from "effect";
import type { Slide, SlideFrontmatter } from "@mnestia/schema/slide";

export interface SlideReferenceOptions {
	id?: string;
	frontmatter?: SlideFrontmatter;
}

export class SlideReference extends Data.TaggedClass("SlideReference")<{
	filepath: string;
	id?: string;
	frontmatter?: SlideFrontmatter;
}> {}

export function slide(
	filepath: string,
	options: SlideReferenceOptions = {},
): SlideReference {
	return new SlideReference({
		filepath,
		id: options.id,
		frontmatter: options.frontmatter,
	});
}

export type SlideInput = Slide | SlideReference;

export function isSlideReference(value: unknown): value is SlideReference {
	return value instanceof SlideReference;
}
