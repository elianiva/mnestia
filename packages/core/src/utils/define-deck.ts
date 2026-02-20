import type { DeckConfig } from "@mnestia/schema/deck";
import type { NavigationConfig } from "@mnestia/schema/navigation";
import type { SlideInput } from "./slide.js";
import { isSlideReference } from "./slide.js";

const DEFAULT_THEME = "@mnestia/theme-base";

const DEFAULT_NAVIGATION: NavigationConfig = {
	mode: "both",
	enableMouseClick: true,
	enableTouchSwipe: true,
};

const DEFAULT_ASPECT_RATIO = "16/9";

export interface DefineDeckOptions {
	theme?: string;
	navigation?: Partial<NavigationConfig>;
	aspectRatio?: string;
	export?: DeckConfig["export"];
}

export function defineDeck(
	slides: SlideInput[],
	options: DefineDeckOptions = {},
): DeckConfig {
	if (!slides.length) {
		throw new Error("Deck must have at least one slide");
	}

	const navigation: NavigationConfig = {
		...DEFAULT_NAVIGATION,
		...options.navigation,
	};

	const processedSlides = slides.map((slide, index) => {
		if (isSlideReference(slide)) {
			return {
				id: slide.id || deriveIdFromPath(slide.filepath),
				index,
				filepath: slide.filepath,
				frontmatter: slide.frontmatter || {},
				component: async () => {
					const mod = await import(/* @vite-ignore */ slide.filepath);
					return mod.default;
				},
			};
		}
		return { ...slide, index };
	});

	return {
		slides: processedSlides,
		theme: options.theme ?? DEFAULT_THEME,
		navigation,
		aspectRatio: (options.aspectRatio as DeckConfig["aspectRatio"]) ??
			DEFAULT_ASPECT_RATIO,
		export: options.export,
	};
}

function deriveIdFromPath(filepath: string): string {
	const filename = filepath.split("/").pop() || "slide";
	return filename.replace(/\.[^/.]+$/, "");
}

export type { SlideInput, SlideReference } from "./slide.js";
