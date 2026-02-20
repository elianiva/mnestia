import { Command, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as path from "node:path";
import kleur from "kleur";
import { VERSION } from "../version.js";
import { getRoots } from "../utils/resolver.js";

export const buildCommand = Command.make(
	"build",
	{
		outDir: Options.text("out-dir").pipe(
			Options.withDefault("dist"),
			Options.withDescription("Output directory for static assets"),
		),
		base: Options.text("base").pipe(
			Options.withDefault("/"),
			Options.withDescription("Base URL for the deployed site"),
		),
	},
	({ outDir, base }) =>
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
				kleur.bold("  mnestia ") + kleur.dim("Build") + `  v${VERSION}`,
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

			const outPath = path.resolve(cwd, outDir);

			yield* Console.log(kleur.dim("  Loading configuration..."));

			// Load deck config before building
			const deckConfig = yield* Effect.tryPromise({
				try: async () => {
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

			yield* Console.log(
				kleur.dim("  Building to: ") + kleur.cyan(outPath),
			);
			yield* Console.log(kleur.dim("  Base URL: ") + kleur.cyan(base));
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
					await vite.build({
						root: cwd,
						plugins,
						base,
						build: {
							outDir: outPath,
							emptyOutDir: true,
							sourcemap: true,
							rollupOptions: {
								input: {
									main: path.join(cwd, "index.html"),
								},
							},
						},
						resolve: {
							alias: {
								"@mnestia/web": roots.webRoot,
								"@": webSrcPath,
							},
						},
					});
				},
				catch: (error) =>
					new Error(
						`Failed to build: ${error instanceof Error ? error.message : String(error)}`,
					),
			});

			yield* Console.log("");
			yield* Console.log(kleur.green("  ✓ Build completed successfully!"));
			yield* Console.log("");
			yield* Console.log(kleur.dim("  To preview the build:"));
			yield* Console.log(kleur.cyan(`    cd ${outDir}`));
			yield* Console.log(kleur.cyan(`    npx serve`));
		}),
).pipe(Command.withDescription("Build slide deck into static assets"));
