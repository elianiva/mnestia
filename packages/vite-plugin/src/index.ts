import type { Plugin } from "vite";
import { resolve } from "pathe";
import type { DeckConfig } from "@mnestia/schema/deck";
import { createConfigPlugin } from "./plugins/config.js";
import { createDeckPlugin, type DeckPluginResult, VIRTUAL_DECK_ID, RESOLVED_DECK_ID } from "./plugins/deck.js";
import { createSlidesPlugin } from "./plugins/slides.js";

export interface MnestiaOptions {
	root: string;
	webRoot?: string;
	/** Pre-loaded deck config (optional - will be loaded from file if not provided) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	deckConfig?: any;
}

export function mnestia(options: MnestiaOptions): Plugin[] {
	const monorepoRoot = resolve(__dirname, "..", "..", "..", "..");
	const webRoot = options.webRoot ?? resolve(monorepoRoot, "packages", "web");

	// Use pre-loaded config or create a getter that will load it lazily
	let deckConfig = options.deckConfig ?? null;

	const deckPluginResult = createDeckPlugin({
		root: options.root,
		getDeckConfig: () => deckConfig,
	});

	return [
		...createConfigPlugin({ root: options.root, webRoot }),
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
export type { VirtualSlide, VirtualModuleContext, VirtualModuleTemplate } from "./virtual/types.js";
export {
	VIRTUAL_SLIDES_ID,
	RESOLVED_SLIDES_ID,
	generateSlidesModule,
	templateSlides,
} from "./virtual/slides.js";
