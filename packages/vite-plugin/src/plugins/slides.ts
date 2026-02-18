import type { Plugin } from "vite";
import { resolve } from "pathe";
import mdx from "@mdx-js/rollup";

export interface SlidesPluginOptions {
	root: string;
}

export function createSlidesPlugin(options: SlidesPluginOptions): Plugin[] {
	return [
		mdx({
			jsxImportSource: "react",
		}) as Plugin,
		{
			name: "mnestia:slides-hmr",
			enforce: "post",
			configureServer(server) {
				const slidesDir = resolve(options.root, "slides");

				server.watcher.on("change", (file) => {
					if (file.startsWith(slidesDir)) {
						console.log("[mnestia] Slide changed:", file);
						const mod = server.moduleGraph.getModuleById(file);
						if (mod) {
							server.reloadModule(mod);
						}
					}
				});
			},
		},
	];
}
