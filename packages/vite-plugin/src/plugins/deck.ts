import type { Plugin } from "vite";
import { resolve } from "pathe";
import type { DeckConfig } from "@mnestia/schema/deck";
import { SlideReference } from "@mnestia/core/slide";

const VIRTUAL_DECK_ID = "virtual:mnestia/deck";
const RESOLVED_DECK_ID = "\0" + VIRTUAL_DECK_ID;

export interface DeckPluginOptions {
	root: string;
}

export function createDeckPlugin(options: DeckPluginOptions): Plugin[] {
	let deckConfig: DeckConfig | null = null;
	let configPath: string | null = null;

	return [
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

				if (!deckConfig) {
					deckConfig = await loadDeckConfig(options.root);
				}

				return `export const deckConfig = ${JSON.stringify(deckConfig, null, 2)};`;
			},
			configureServer(server) {
				server.watcher.on("change", async (file) => {
					if (file.includes("mnestia.config.ts")) {
						console.log("[mnestia] Config changed, reloading...");
						deckConfig = null;
						server.restart();
					}
				});
			},
		},
	];
}

async function loadDeckConfig(root: string): Promise<DeckConfig> {
	const configPath = resolve(root, "mnestia.config.ts");

	try {
		const mod = await import(configPath);
		const config = mod.default;

		if (!config) {
			throw new Error(`mnestia.config.ts must have a default export`);
		}

		return config;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to load mnestia.config.ts: ${message}`);
	}
}
