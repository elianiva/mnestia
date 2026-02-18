import type { Plugin, UserConfig } from "vite";
import { resolve } from "pathe";
import { createConfigPlugin } from "./plugins/config.js";
import { createDeckPlugin } from "./plugins/deck.js";
import { createSlidesPlugin } from "./plugins/slides.js";

export interface MnestiaOptions {
	root: string;
	webRoot?: string;
}

export function mnestia(options: MnestiaOptions): Plugin[] {
	const monorepoRoot = resolve(__dirname, "..", "..", "..", "..");
	const webRoot = options.webRoot ?? resolve(monorepoRoot, "packages", "web");

	return [
		...createConfigPlugin({ root: options.root, webRoot }),
		...createDeckPlugin(options),
		...createSlidesPlugin(options),
	];
}

export { createConfigPlugin } from "./plugins/config.js";
export { createDeckPlugin } from "./plugins/deck.js";
export { createSlidesPlugin } from "./plugins/slides.js";
