import type { ThemeModule } from "@mnestia/schema/theme";

export interface DefineThemeOptions {
	name: string;
	extends?: string;
	layouts?: ThemeModule["layouts"];
	components?: ThemeModule["components"];
	styles?: ThemeModule["styles"];
	setup?: () => void;
}

export function defineTheme(options: DefineThemeOptions): ThemeModule {
	return {
		name: options.name,
		layouts: options.layouts || {},
		components: options.components || {},
		styles: options.styles || { variables: "" },
		setup: options.setup,
	};
}
