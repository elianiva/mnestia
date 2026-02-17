import { Effect, Option } from "effect";
import type { ThemeModule } from "@mnestia/schema/theme";
import { ThemeLoadError, ThemeNotFoundError } from "../errors/theme-errors.js";
import { setCachedTheme, getCachedTheme } from "../atoms/theme-atom.js";

export class ThemeService extends Effect.Service<ThemeService>()("ThemeService", {
	accessors: true,
	effect: Effect.gen(function* () {
		yield* Effect.void;
		const tryLoadTheme = (theme: string) =>
			Effect.gen(function* () {
				try {
					const themeModule = yield* Effect.promise(() =>
						import(/* @vite-ignore */ theme),
					);
					const themeObj: ThemeModule = themeModule.default || themeModule;

					if (!themeObj.layouts || !themeObj.components) {
						return yield* Effect.fail(
							new ThemeLoadError({
								themeName: theme,
								message: `Theme "${theme}" missing required properties: layouts, components`,
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

				if (theme !== "@mnestia/theme-base") {
					yield* Effect.logWarning(
						`Failed to load theme "${theme}", falling back to base`,
					);
					const fallbackResult = yield* tryLoadTheme("@mnestia/theme-base");

					if (Option.isSome(fallbackResult)) {
						yield* setCachedTheme("@mnestia/theme-base", fallbackResult.value);
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
}) {}
