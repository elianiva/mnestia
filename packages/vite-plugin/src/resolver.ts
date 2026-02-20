import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "pathe";
import { fileURLToPath } from "node:url";

export interface ResolvedTheme {
	name: string;
	root: string;
}

// Cache for resolved themes
const resolutionCache = new Map<string, ResolvedTheme>();

/**
 * Resolve a theme name to its absolute filesystem path.
 * Supports:
 * - npm package names: "@mnestia/theme-base"
 * - relative paths: "./my-theme" or "../my-theme"
 * - absolute paths: "/path/to/theme"
 */
export async function resolveTheme(
	name: string,
	importer: string,
): Promise<ResolvedTheme> {
	// Check cache first
	const cached = resolutionCache.get(name);
	if (cached) return cached;

	// Handle absolute paths
	if (name.startsWith("/")) {
		if (!existsSync(resolve(name, "package.json"))) {
			throw new Error(`Theme not found at absolute path: ${name}`);
		}
		const result = { name, root: name };
		resolutionCache.set(name, result);
		return result;
	}

	// Handle relative paths
	if (name.startsWith("./") || name.startsWith("../")) {
		const resolved = resolve(dirname(importer), name);
		if (!existsSync(resolve(resolved, "package.json"))) {
			throw new Error(`Theme not found at relative path: ${resolved}`);
		}
		const result = { name, root: resolved };
		resolutionCache.set(name, result);
		return result;
	}

	// Try multiple resolution strategies for npm packages
	const result = await resolveWithStrategies(name, importer);
	if (result) {
		resolutionCache.set(name, result);
		return result;
	}

	throw new Error(`Failed to resolve theme: ${name}`);
}

/**
 * Try multiple resolution strategies to find a package
 */
async function resolveWithStrategies(
	name: string,
	importer: string,
): Promise<ResolvedTheme | null> {
	// Strategy 1: Try import.meta.resolve
	const fromResolve = await tryImportMetaResolve(name, importer);
	if (fromResolve) return fromResolve;

	// Strategy 2: Try resolving from vite-plugin's own location (for monorepo)
	const pluginDir = fileURLToPath(new URL("..", import.meta.url));
	const fromPlugin = await tryImportMetaResolve(name, resolve(pluginDir, "package.json"));
	if (fromPlugin) return fromPlugin;

	// Strategy 3: Look in monorepo packages directory
	const fromMonorepo = tryMonorepoResolve(name);
	if (fromMonorepo) return fromMonorepo;

	return null;
}

/**
 * Try to resolve using import.meta.resolve
 */
async function tryImportMetaResolve(
	name: string,
	importer: string,
): Promise<ResolvedTheme | null> {
	try {
		const resolved = await import.meta.resolve(name, importer);
		const pkgJsonPath = await findPackageJsonUpwards(dirname(resolved), name);
		if (pkgJsonPath) {
			return { name, root: dirname(pkgJsonPath) };
		}
	} catch {
		// Not found via this strategy
	}
	return null;
}

/**
 * Walk up directory tree to find package.json matching the package name
 */
async function findPackageJsonUpwards(
	startDir: string,
	packageName: string,
): Promise<string | null> {
	let current = startDir;
	while (current !== "/" && current !== ".") {
		const pkgPath = resolve(current, "package.json");
		if (existsSync(pkgPath)) {
			try {
				const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as {
					name?: string;
				};
				if (pkg.name === packageName) {
					return pkgPath;
				}
			} catch {
				// Invalid package.json, continue
			}
		}
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
}

/**
 * Try to find package in monorepo packages directory
 */
function tryMonorepoResolve(name: string): ResolvedTheme | null {
	// Get the monorepo root from vite-plugin location
	// vite-plugin is at packages/vite-plugin, so go up 2 levels
	const pluginDir = fileURLToPath(new URL("..", import.meta.url));
	const monorepoRoot = resolve(pluginDir, "..", "..");

	// Handle scoped packages (@mnestia/theme-base -> packages/theme-base)
	if (name.startsWith("@")) {
		const parts = name.split("/");
		if (parts.length === 2) {
			const scope = parts[0];
			const pkgName = parts[1];
			// Try without scope first (e.g., @mnestia/theme-base -> packages/theme-base)
			const possiblePaths = [
				resolve(monorepoRoot, "packages", pkgName),
				resolve(monorepoRoot, "packages", scope, pkgName),
			];
			for (const pkgPath of possiblePaths) {
				if (existsSync(resolve(pkgPath, "package.json"))) {
					return { name, root: pkgPath };
				}
			}
		}
	}

	// Try direct package name
	const directPath = resolve(monorepoRoot, "packages", name);
	if (existsSync(resolve(directPath, "package.json"))) {
		return { name, root: directPath };
	}

	return null;
}

/**
 * Convert a filesystem path to Vite's /@fs/ URL format
 */
export function toAtFsPath(filepath: string): string {
	return `/@fs${filepath.startsWith("/") ? "" : "/"}${filepath}`;
}
