import { Effect, Option } from "effect";
import type { ThemeModule } from "@mnestia/schema/theme";
import { ThemeLoadError, ThemeNotFoundError } from "../errors/theme-errors.js";
import { setCachedTheme, getCachedTheme } from "../atoms/theme-atom.js";

/** Function type for resolving a theme name to a ThemeModule */
export type ThemeResolver = (name: string) => ThemeModule | undefined;

export interface ThemeServiceConfig {
	/** Map of theme names to resolved theme modules */
	themes: Record<string, ThemeModule>;
	/** Default theme name for fallback */
	defaultTheme: string;
	/** Function to get a theme by name */
	getTheme: ThemeResolver;
}

export class ThemeService extends Effect.Service<ThemeService>()("ThemeService", {
	accessors: true,
	effect: Effect.gen(function* () {
		yield* Effect.fail(
			new Error("ThemeService must be provided with a config via Layer"),
		);
	}),
}) {}

/**
 * Create a ThemeService layer with the provided config.
 * This should be called in the application entry point with resolved themes.
 */
export function createThemeServiceLayer(config: ThemeServiceConfig) {
	return ThemeServiceLive(config);
}

function ThemeServiceLive(config: ThemeServiceConfig) {
	return ThemeService.layer(
		Effect.gen(function* () {
			const tryLoadTheme = (themeName: string) =>
				Effect.gen(function* () {
					try {
						const themeObj = config.getTheme(themeName);

						if (!themeObj?.layouts || !themeObj?.components) {
							return yield* Effect.fail(
								new ThemeLoadError({
									themeName: themeName,
									message: `Theme "${themeName}" missing required properties: layouts, components`,
								}),
							);
						}

						return Option.some(themeObj);
					} catch {
						return Option.none();
					}
				});

			const resolveTheme = (theme: string | ThemeModule) =>
				Effect.gen(function* () {
					if (typeof theme !== "string") {
						return theme;
					}

					const cached = yield* getCachedTheme(theme);
					if (cached) {
						yield* Effect.log("Theme loaded from cache", { theme });
						return cached;
					}

					const result = yield* tryLoadTheme(theme);

					if (Option.isSome(result)) {
						yield* setCachedTheme(theme, result.value);
						yield* Effect.log("Theme loaded and cached", { theme });
						return result.value;
					}

					if (theme !== config.defaultTheme) {
						yield* Effect.logWarning(
							`Failed to load theme "${theme}", falling back to ${config.defaultTheme}`,
						);
						const fallbackResult = yield* tryLoadTheme(config.defaultTheme);

						if (Option.isSome(fallbackResult)) {
							yield* setCachedTheme(config.defaultTheme, fallbackResult.value);
							return fallbackResult.value;
						}
					}

					return yield* Effect.fail(
						new ThemeNotFoundError({
							themeName: theme,
							message: `Failed to load theme "${theme}" and fallback also failed`,
						}),
					);
				});

			const clearCache = Effect.fn("ThemeService.clearCache")(function* () {
				yield* Effect.log("Clearing theme cache");
			});

			return {
				resolveTheme,
				clearCache,
			};
		}),
	);
}
