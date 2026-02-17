import type { DeckConfig } from "@mnestia/schema/deck";
import type { Slide } from "@mnestia/schema/slide";

const testSlides: Slide[] = [
	{
		id: "slide-1",
		index: 0,
		filepath: "slides/01-intro.mdx",
		frontmatter: {
			layout: "cover",
		},
		component: async () => ({ default: () => null }),
	},
	{
		id: "slide-2",
		index: 1,
		filepath: "slides/02-content.mdx",
		frontmatter: {
			layout: "default",
		},
		component: async () => ({ default: () => null }),
	},
	{
		id: "slide-3",
		index: 2,
		filepath: "slides/03-features.mdx",
		frontmatter: {
			layout: "center",
		},
		component: async () => ({ default: () => null }),
	},
	{
		id: "slide-4",
		index: 3,
		filepath: "slides/04-end.mdx",
		frontmatter: {
			layout: "cover",
		},
		component: async () => ({ default: () => null }),
	},
];

export const testDeckConfig: DeckConfig = {
	slides: testSlides,
	theme: "@mnestia/theme-base",
	navigation: {
		mode: "both",
		shortcuts: [],
		enableMouseClick: true,
		enableTouchSwipe: true,
	},
	aspectRatio: "16/9",
};
