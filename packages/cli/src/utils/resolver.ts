import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Effect } from "effect";
import { FileSystem } from "@effect/platform";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CLI package root (packages/cli)
// Handle both source (src/) and bundled (dist/) locations
const isDist = __dirname.endsWith("dist") || __dirname.includes("dist/");
export const cliRoot = isDist
	? resolve(__dirname, "..") // dist/ -> packages/cli
	: resolve(__dirname, "..", ".."); // src/utils/ -> packages/cli

/**
 * Resolve package root using multiple strategies:
 * 1. Try import.meta.resolve (works for installed packages)
 * 2. Try monorepo relative path (works for local development)
 * 3. Try node_modules resolution
 */
export async function findPkgRoot(
	dep: string,
	ensure = false,
): Promise<string | undefined> {
	// Strategy 1: Try import.meta.resolve (works for installed packages)
	try {
		const url = await import.meta.resolve(dep);
		const filepath = fileURLToPath(url);
		// Go up to package root (from dist/index.js or src/index.ts)
		return resolve(filepath, "..", "..");
	} catch {
		// Continue to next strategy
	}

	// Strategy 2: Check if we're in a monorepo and resolve relatively
	// This handles the case when running CLI from source in development
	const monorepoRoot = resolve(cliRoot, "..", "..");
	const possiblePaths = [
		// Direct package path in monorepo
		resolve(monorepoRoot, "packages", dep.replace("@mnestia/", "")),
		// Node_modules in monorepo root
		resolve(monorepoRoot, "node_modules", dep),
		// Node_modules in CLI package
		resolve(cliRoot, "node_modules", dep),
	];

	for (const path of possiblePaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	if (ensure) {
		throw new Error(`Failed to resolve package "${dep}"`);
	}
	return undefined;
}

/**
 * Get all important roots for the CLI
 */
export interface RootsInfo {
	/** User's project root */
	userRoot: string;
	/** @mnestia/web package root */
	webRoot: string;
	/** @mnestia/vite-plugin package root */
	vitePluginRoot: string;
}

export async function getRoots(userRoot: string): Promise<RootsInfo> {
	const [webRoot, vitePluginRoot] = await Promise.all([
		findPkgRoot("@mnestia/web", true),
		findPkgRoot("@mnestia/vite-plugin", true),
	]);

	return {
		userRoot: resolve(userRoot),
		webRoot: webRoot!,
		vitePluginRoot: vitePluginRoot!,
	};
}

/**
 * Convert path to /@fs/ URL for Vite
 */
export function toAtFsPath(filepath: string): string {
	return `/@fs${filepath.startsWith("/") ? "" : "/"}${filepath}`;
}

/**
 * Effect wrapper for getRoots
 */
export function getRootsEffect(userRoot: string) {
	return Effect.tryPromise({
		try: () => getRoots(userRoot),
		catch: (error) =>
			new Error(
				`Failed to resolve package roots: ${error instanceof Error ? error.message : String(error)}`,
			),
	});
}
