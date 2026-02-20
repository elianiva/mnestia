import { Command, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as path from "node:path";
import kleur from "kleur";
import { VERSION } from "../version.js";
import { getRoots } from "../utils/resolver.js";

export const devCommand = Command.make(
	"dev",
	{
		port: Options.integer("port").pipe(
			Options.withDefault(3000),
			Options.withDescription("Port to run the dev server on"),
		),
		host: Options.text("host").pipe(
			Options.withDefault("localhost"),
			Options.withDescription("Host to bind the dev server to"),
		),
		open: Options.boolean("open").pipe(
			Options.withDefault(false),
			Options.withDescription("Open in browser"),
		),
	},
	({ port, host, open }) =>
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const cwd = process.cwd();

			const configPath = path.join(cwd, "mnestia.config.ts");
			const configExists = yield* fs.exists(configPath);

			if (!configExists) {
				yield* Console.log(
					kleur.red("✗") + " mnestia.config.ts not found in current directory",
				);
				yield* Console.log(
					kleur.dim("  Run") +
						kleur.cyan(" mnestia create ") +
						kleur.dim("to create a new project"),
				);
				return;
			}

			yield* Console.log(
				kleur.bold().cyan("● ") +
					kleur.bold().magenta("■ ") +
					kleur.bold().yellow("▲ "),
			);
			yield* Console.log(
				kleur.bold("  mnestia ") + kleur.dim("Dev") + `  v${VERSION}`,
			);
			yield* Console.log("");

			// Resolve package roots
			const roots = yield* Effect.tryPromise({
				try: () => getRoots(cwd),
				catch: (error) =>
					new Error(
						`Failed to resolve packages: ${error instanceof Error ? error.message : String(error)}`,
					),
			});

			// Load deck config before starting Vite
			yield* Console.log(kleur.dim("  Loading configuration..."));

			const deckConfig = yield* Effect.tryPromise({
				try: async () => {
					// Use jiti to load the config
					const { createJiti } = await import("jiti");
					const jiti = createJiti(import.meta.url, {
						interopDefault: true,
					});
					const mod = (await jiti.import(configPath)) as {
						default?: { slides?: unknown[] };
						slides?: unknown[];
					};
					return (mod.default ?? mod) as { slides?: unknown[] };
				},
				catch: (error) =>
					new Error(
						`Failed to load mnestia.config.ts: ${error instanceof Error ? error.message : String(error)}`,
					),
			});

			if (!deckConfig) {
				yield* Console.log(
					kleur.red("✗") + " mnestia.config.ts must export a default config",
				);
				return;
			}

			yield* Console.log(
				kleur.green("  ✓") +
					kleur.dim(` Loaded ${(deckConfig.slides?.length) || 0} slides`),
			);
			yield* Console.log("");

			const vite = yield* Effect.tryPromise({
				try: () => import("vite"),
				catch: () => new Error("Failed to import vite"),
			});

			const plugin = yield* Effect.tryPromise({
				try: () => import("@mnestia/vite-plugin"),
				catch: () => new Error("Failed to import @mnestia/vite-plugin"),
			});

			const plugins = plugin.mnestia({
				root: cwd,
				webRoot: roots.webRoot,
				deckConfig, // Pass pre-loaded config
			});

			const webSrcPath = path.join(roots.webRoot, "src");

			yield* Effect.tryPromise({
				try: async () => {
					const server = await vite.createServer({
						root: cwd,
						plugins,
						server: {
							port,
							host,
							open,
						},
						resolve: {
							alias: {
								"@mnestia/web": roots.webRoot,
								"@": webSrcPath,
							},
						},
						optimizeDeps: {
							entries: [path.join(roots.webRoot, "src", "main.tsx")],
						},
					});

					await server.listen();
					return server;
				},
				catch: (error) =>
					new Error(
						`Failed to start dev server: ${error instanceof Error ? error.message : String(error)}`,
					),
			});

			yield* Console.log(
				kleur.green("  ➜") +
					kleur.dim("  Local:   ") +
					kleur.cyan(`http://${host}:${port}`),
			);
		}),
).pipe(Command.withDescription("Start the development server"));
