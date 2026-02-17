import type {
	DeckConfig,
	DeckDefinitionInput,
	Slide,
	NavigationConfig,
} from "@mnestia/schema";

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
	slides: Slide[],
	options: DefineDeckOptions = {},
): DeckConfig {
	if (!slides.length) {
		throw new Error("Deck must have at least one slide");
	}

	const navigation: NavigationConfig = {
		...DEFAULT_NAVIGATION,
		...options.navigation,
	};

	return {
		slides,
		theme: options.theme ?? DEFAULT_THEME,
		navigation,
		aspectRatio: (options.aspectRatio as DeckConfig["aspectRatio"]) ?? DEFAULT_ASPECT_RATIO,
		export: options.export,
	};
}
