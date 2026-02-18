import type { Plugin, UserConfig } from "vite";
import { resolve } from "pathe";
import { fileURLToPath } from "node:url";

export interface ConfigPluginOptions {
	root: string;
	webRoot: string;
}

export function createConfigPlugin(options: ConfigPluginOptions): Plugin[] {
	const webSrcRoot = resolve(options.webRoot, "src");

	return [
		{
			name: "mnestia:config",
			enforce: "pre",
			config(config): UserConfig {
				return {
					resolve: {
						alias: {
							"@mnestia/web": options.webRoot,
							"@": webSrcRoot,
						},
					},
					server: {
						fs: {
							allow: [options.root, options.webRoot],
						},
					},
					root: options.root,
				};
			},
		},
		{
			name: "mnestia:html",
			enforce: "pre",
			resolveId(id) {
				if (id === "/index.html") {
					return resolve(options.root, "index.html");
				}
			},
			configureServer(server) {
				return () => {
					server.middlewares.use(async (req, res, next) => {
						if (req.url === "/" || req.url === "/index.html") {
							const indexPath = resolve(options.root, "index.html");
							try {
								const content = await Bun.file(indexPath).text();
								res.setHeader("Content-Type", "text/html");
								res.end(content);
								return;
							} catch {
							}
						}
						next();
					});
				};
			},
		},
	];
}
