import type { DeckConfig } from "@mnestia/schema/deck";
import type { SlideFrontmatter } from "@mnestia/schema/slide";

export interface VirtualSlide {
	id: string;
	index: number;
	filepath: string;
	frontmatter: SlideFrontmatter;
}

export interface VirtualModuleContext {
	root: string;
	deckConfig: DeckConfig;
}

export interface VirtualModuleTemplate {
	id: string;
	getContent: (ctx: VirtualModuleContext) => string | Promise<string>;
}
