import { Effect } from "effect";
import type { Slide, SlideModule } from "@mnestia/schema/slide";
import { SlideLoadError } from "../errors/slide-errors.js";

export interface SlideOptions {
	id?: string;
	frontmatter?: Record<string, unknown>;
}

export function slide(
	filepath: string,
	options: SlideOptions = {},
): Effect.Effect<Slide, SlideLoadError> {
	return Effect.gen(function* () {
		yield* Effect.log("Loading slide", { filepath });

		try {
			const module = yield* Effect.promise(() =>
				import(/* @vite-ignore */ filepath),
			);

			const slideModule = module as SlideModule;
			const component = slideModule.default;

			if (!component) {
				return yield* Effect.fail(
					new SlideLoadError({
						filepath,
						message: `Slide at "${filepath}" does not have a default export`,
					}),
				);
			}

			const slide: Slide = {
				id: options.id || deriveIdFromPath(filepath),
				index: -1,
				component: () => component,
				frontmatter: slideModule.options?.frontmatter || {},
				filepath,
			};

			yield* Effect.log("Slide loaded successfully", { filepath, id: slide.id });
			return slide;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return yield* Effect.fail(
				new SlideLoadError({
					filepath,
					message: `Failed to load slide at "${filepath}"`,
					cause: errorMessage,
				}),
			);
		}
	});
}

function deriveIdFromPath(filepath: string): string {
	const filename = filepath.split("/").pop() || "slide";
	return filename.replace(/\.[^/.]+$/, "");
}
