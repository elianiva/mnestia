import type { Plugin, ViteDevServer } from "vite";
import { resolve } from "pathe";
import mdx from "@mdx-js/rollup";
import type { DeckConfig } from "@mnestia/schema/deck";
import {
	generateSlidesModule,
	VIRTUAL_SLIDES_ID,
	RESOLVED_SLIDES_ID,
} from "../virtual/slides.js";

export interface SlidesPluginOptions {
	root: string;
	getDeckConfig: () => DeckConfig | null;
}

export function createSlidesPlugin(options: SlidesPluginOptions): Plugin[] {
	return [
		mdx({
			jsxImportSource: "react",
		}) as Plugin,
		{
			name: "mnestia:slides-virtual",
			enforce: "pre",
			resolveId(id) {
				if (id === VIRTUAL_SLIDES_ID) {
					return RESOLVED_SLIDES_ID;
				}
			},
			load(id) {
				if (id !== RESOLVED_SLIDES_ID) return;

				const deckConfig = options.getDeckConfig();
				if (!deckConfig) {
					throw new Error("Deck config not available");
				}

				return generateSlidesModule({
					root: options.root,
					deckConfig,
				});
			},
			configureServer(server) {
				const slidesDir = resolve(options.root, "slides");

				// Watch for slide file changes
				server.watcher.on("change", (file) => {
					if (file.startsWith(slidesDir)) {
						console.log("[mnestia] Slide changed:", file);
						const mod = server.moduleGraph.getModuleById(RESOLVED_SLIDES_ID);
						if (mod) {
							server.reloadModule(mod);
						}
					}
				});
			},
		},
	];
}
