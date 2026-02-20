import type { Plugin } from "vite";
import type { DeckConfig } from "@mnestia/schema/deck";

export const VIRTUAL_DECK_ID = "virtual:mnestia/deck";
export const RESOLVED_DECK_ID = "\0" + VIRTUAL_DECK_ID;

export interface DeckPluginOptions {
	root: string;
	getDeckConfig: () => DeckConfig | null;
}

export interface DeckPluginResult {
	plugins: Plugin[];
	getDeckConfig: () => DeckConfig | null;
}

export function createDeckPlugin(options: DeckPluginOptions): DeckPluginResult {
	const plugins: Plugin[] = [
		{
			name: "mnestia:deck",
			enforce: "pre",
			async resolveId(id) {
				if (id === VIRTUAL_DECK_ID) {
					return RESOLVED_DECK_ID;
				}
			},
			async load(id) {
				if (id !== RESOLVED_DECK_ID) return;

				const deckConfig = options.getDeckConfig();
				if (!deckConfig) {
					throw new Error("Deck config not available");
				}

				// Only export serializable config (no component functions)
				const serializableConfig = {
					slides: deckConfig.slides.map((s) => ({
						id: s.id,
						index: s.index,
						filepath: s.filepath,
						frontmatter: s.frontmatter,
					})),
					theme: typeof deckConfig.theme === "string" ? deckConfig.theme : "@mnestia/theme-base",
					navigation: deckConfig.navigation,
					aspectRatio: deckConfig.aspectRatio,
					export: deckConfig.export,
				};

				return `export const deckConfig = ${JSON.stringify(serializableConfig, null, 2)};`;
			},
		},
	];

	const getDeckConfig = () => options.getDeckConfig();

	return { plugins, getDeckConfig };
}
