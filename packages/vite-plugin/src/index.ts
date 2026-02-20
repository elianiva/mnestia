import type { Plugin } from "vite";
import { resolve } from "pathe";
import { createConfigPlugin } from "./plugins/config.js";
import { createDeckPlugin, type DeckPluginResult, VIRTUAL_DECK_ID, RESOLVED_DECK_ID } from "./plugins/deck.js";
import { createSlidesPlugin } from "./plugins/slides.js";
import { createThemesPlugin } from "./plugins/themes.js";

export interface MnestiaOptions {
	root: string;
	webRoot?: string;
	/** Pre-loaded deck config (optional - will be loaded from file if not provided) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	deckConfig?: any;
}

export function mnestia(options: MnestiaOptions): Plugin[] {
	const monorepoRoot = resolve(import.meta.dirname, "..", "..", "..", "..");
	const webRoot = options.webRoot ?? resolve(monorepoRoot, "packages", "web");

	// Use pre-loaded config or create a getter that will load it lazily
	const deckConfig = options.deckConfig ?? null;

	const deckPluginResult = createDeckPlugin({
		root: options.root,
		getDeckConfig: () => deckConfig,
	});

	const importer = resolve(options.root, "package.json");

	return [
		...createConfigPlugin({ root: options.root, webRoot }),
		createThemesPlugin({
			getDeckConfig: () => deckConfig,
			importer,
		}),
		...deckPluginResult.plugins,
		...createSlidesPlugin({
			root: options.root,
			getDeckConfig: () => deckConfig,
		}),
	];
}

export { createConfigPlugin } from "./plugins/config.js";
export { createDeckPlugin, type DeckPluginResult, VIRTUAL_DECK_ID, RESOLVED_DECK_ID } from "./plugins/deck.js";
export { createSlidesPlugin } from "./plugins/slides.js";
export { createThemesPlugin } from "./plugins/themes.js";
export type { VirtualSlide, VirtualModuleContext, VirtualModuleTemplate } from "./virtual/types.js";
export {
	VIRTUAL_SLIDES_ID,
	RESOLVED_SLIDES_ID,
	generateSlidesModule,
	templateSlides,
} from "./virtual/slides.js";
export {
	VIRTUAL_THEMES_ID,
	RESOLVED_THEMES_ID,
	generateThemesModule,
} from "./virtual/themes.js";
export { resolveTheme, toAtFsPath } from "./resolver.js";
export type { ResolvedTheme } from "./resolver.js";
