import type { Plugin } from "vite";
import type { DeckConfig } from "@mnestia/schema/deck";
import {
	VIRTUAL_THEMES_ID,
	RESOLVED_THEMES_ID,
	generateThemesModule,
} from "../virtual/themes.js";

export interface ThemesPluginOptions {
	getDeckConfig: () => DeckConfig | null;
	importer: string;
}

export function createThemesPlugin(options: ThemesPluginOptions): Plugin {
	return {
		name: "mnestia:themes",
		enforce: "pre",
		async resolveId(id) {
			if (id === VIRTUAL_THEMES_ID) {
				return RESOLVED_THEMES_ID;
			}
		},
		async load(id) {
			if (id !== RESOLVED_THEMES_ID) return;

			const deckConfig = options.getDeckConfig();
			if (!deckConfig) {
				throw new Error("Deck config not available for theme resolution");
			}

			const content = await generateThemesModule({
				root: "", // Not used for themes
				deckConfig,
				importer: options.importer,
			});

			return content;
		},
	};
}
