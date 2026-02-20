import type { DeckConfig, SlideFrontmatter } from "@mnestia/schema/deck";
import type { SerializableDeckConfig } from "./components/deck-provider";
import type { ThemeModule } from "@mnestia/schema/theme";

declare module "virtual:mnestia/deck" {
	export const deckConfig: SerializableDeckConfig;
}

declare module "virtual:mnestia/slides" {
	import type { LazyExoticComponent, ComponentType } from "react";

	export interface VirtualSlide {
		id: string;
		index: number;
		frontmatter: SlideFrontmatter;
		component: LazyExoticComponent<ComponentType>;
		load: () => Promise<unknown>;
	}

	export const slides: VirtualSlide[];
}

declare module "virtual:mnestia/themes" {
	export const themes: Record<string, ThemeModule>;
	export const defaultTheme: string;
	export function getTheme(name: string): ThemeModule;
}
