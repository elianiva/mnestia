import type { Plugin, UserConfig } from "vite";
import { resolve } from "pathe";
import { readFile } from "node:fs/promises";
import tailwindcss from "@tailwindcss/vite";

export interface ConfigPluginOptions {
	root: string;
	webRoot: string;
}

/**
 * Convert path to /@fs/ URL for Vite
 */
function toAtFsPath(filepath: string): string {
	return `/@fs${filepath.startsWith("/") ? "" : "/"}${filepath}`;
}

export function createConfigPlugin(options: ConfigPluginOptions): Plugin[] {
	const webSrcRoot = resolve(options.webRoot, "src");
	const mainEntryPath = resolve(options.webRoot, "src", "main.tsx");

	return [
		tailwindcss(),
		{
			name: "mnestia:config",
			enforce: "pre",
			config(_config): UserConfig {
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
								let content = await readFile(indexPath, "utf-8");
								// Replace @mnestia/web entry path with /@fs/ absolute path
								// This allows Vite to serve files outside the project root
								content = content.replace(
									/@mnestia\/web\/src\/main\.tsx/,
									toAtFsPath(mainEntryPath),
								);
								res.setHeader("Content-Type", "text/html");
								res.end(content);
								return;
							} catch {
								// Continue to next middleware if file not found
							}
						}
						next();
					});
				};
			},
		},
	];
}
