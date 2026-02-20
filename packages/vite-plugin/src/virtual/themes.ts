import type { VirtualModuleContext, VirtualModuleTemplate } from "./types.js";
import { resolveTheme } from "../resolver.js";

export const VIRTUAL_THEMES_ID = "virtual:mnestia/themes";
export const RESOLVED_THEMES_ID = "\0" + VIRTUAL_THEMES_ID;

export interface ThemesModuleContext extends VirtualModuleContext {
	importer: string;
}

// Layout names for base theme
const BASE_LAYOUTS = ["default", "cover", "center", "split", "grid"];
const BASE_COMPONENTS = ["code-block", "image", "quote", "table"];

/**
 * Generate the virtual themes module content.
 * Resolves themes to absolute paths and generates static imports.
 */
export async function generateThemesModule(
	ctx: ThemesModuleContext,
): Promise<string> {
	const { deckConfig, importer } = ctx;

	// Get the theme name from config
	const themeName =
		typeof deckConfig.theme === "string"
			? deckConfig.theme
			: "@mnestia/theme-base";

	const baseThemeName = "@mnestia/theme-base";

	// Verify base theme exists first (required)
	try {
		await resolveTheme(baseThemeName, importer);
	} catch {
		throw new Error(
			`Failed to resolve base theme "${baseThemeName}". Is it installed?`,
		);
	}

	const imports: string[] = [];
	const layouts: string[] = [];
	const components: string[] = [];

	// Import setup for side effects (CSS)
	imports.push(`import "${baseThemeName}/setup";`);

	// Import base theme layouts
	for (const layout of BASE_LAYOUTS) {
		const varName = `layout_${layout.replace(/-/g, "_")}`;
		imports.push(`import { ${toPascalCase(layout)}Layout as ${varName} } from "${baseThemeName}/layouts/${layout}";`);
		layouts.push(`    "${layout}": ${varName}`);
	}

	// Import base theme components
	for (const component of BASE_COMPONENTS) {
		const varName = `component_${component.replace(/-/g, "_")}`;
		imports.push(`import { ${toPascalCase(component)} as ${varName} } from "${baseThemeName}/components/${component}";`);
		components.push(`    "${component}": ${varName}`);
	}

	// Add primary theme if different from base
	if (themeName !== baseThemeName) {
		try {
			await resolveTheme(themeName, importer);
			imports.push(`import "${themeName}/setup";`);
			// TODO: Handle custom theme layouts/components override
			console.warn(`[mnestia] Custom themes not fully supported yet, using base theme components`);
		} catch {
			console.warn(`[mnestia] Theme "${themeName}" not found, using base theme`);
		}
	}

	return [
		imports.join("\n"),
		"",
		"const baseTheme = {",
		`  name: "${baseThemeName}",`,
		"  layouts: {",
		layouts.join(",\n"),
		"  },",
		"  components: {",
		components.join(",\n"),
		"  },",
		'  styles: { variables: "", global: "" }',
		"};",
		"",
		"export const themes = {",
		`  "${baseThemeName}": baseTheme,`,
		"};",
		"",
		`export const defaultTheme = "${baseThemeName}";`,
		"",
		"/** Get a theme by name, falling back to default if not found */",
		"export function getTheme(name) {",
		`  return themes[name] ?? themes["${baseThemeName}"];`,
		"}",
	].join("\n");
}

function toPascalCase(str: string): string {
	return str
		.split(/[-_]/)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}

// Note: templateThemes is not exported due to type incompatibility.
// Use generateThemesModule directly with ThemesModuleContext.
