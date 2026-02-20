import { resolve } from "pathe";
import type { VirtualModuleContext, VirtualModuleTemplate, VirtualSlide } from "./types.js";

export const VIRTUAL_SLIDES_ID = "virtual:mnestia/slides";
export const RESOLVED_SLIDES_ID = "\0" + VIRTUAL_SLIDES_ID;

function toAtFsPath(filepath: string): string {
	return `/@fs${filepath}`;
}

export function generateSlidesModule(
	ctx: VirtualModuleContext,
): string {
	const { deckConfig } = ctx;

	const slides: VirtualSlide[] = deckConfig.slides.map((slide, index) => ({
		id: slide.id,
		index,
		filepath: slide.filepath,
		frontmatter: slide.frontmatter || {},
	}));

	const statements: string[] = [
		`import { lazy } from "react";`,
		``,
		`const componentsCache = new Array(${slides.length});`,
		``,
		`const createLazyComponent = (idx, loader) => {`,
		`  return lazy(async () => {`,
		`    if (componentsCache[idx]) return componentsCache[idx];`,
		`    try {`,
		`      const mod = await loader();`,
		`      componentsCache[idx] = { default: mod.default };`,
		`      return componentsCache[idx];`,
		`    } catch (e) {`,
		`      console.error('Failed to load slide ' + (idx + 1), e);`,
		`      throw e;`,
		`    }`,
		`  });`,
		`};`,
		``,
	];

	for (let i = 0; i < slides.length; i++) {
		const slide = slides[i];
		if (!slide) continue;
		const importPath = toAtFsPath(resolve(ctx.root, slide.filepath));
		statements.push(
			`const loadSlide${i} = () => import("${importPath}");`,
			`const Slide${i} = createLazyComponent(${i}, loadSlide${i});`,
		);
	}

	statements.push(``, `export const slides = [`);

	for (let i = 0; i < slides.length; i++) {
		const slide = slides[i];
		if (!slide) continue;
		statements.push(
			`  {`,
			`    id: ${JSON.stringify(slide.id)},`,
			`    index: ${slide.index},`,
			`    frontmatter: ${JSON.stringify(slide.frontmatter)},`,
			`    component: Slide${i},`,
			`    load: loadSlide${i},`,
			`  }${i < slides.length - 1 ? "," : ""}`,
		);
	}

	statements.push(`];`, ``);
	statements.push(`if (import.meta.hot) {`,
		`  import.meta.hot.dispose(() => {`,
		`    componentsCache.length = 0;`,
		`  });`,
		`}`,
		``,
	);

	return statements.join("\n");
}

export const templateSlides: VirtualModuleTemplate = {
	id: VIRTUAL_SLIDES_ID,
	getContent: generateSlidesModule,
};
