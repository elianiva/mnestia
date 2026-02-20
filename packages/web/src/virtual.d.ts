import type { DeckConfig, SlideFrontmatter } from "@mnestia/schema/deck";
import type { SerializableDeckConfig } from "./components/deck-provider";

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
