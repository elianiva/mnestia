import { Atom } from "@effect-atom/atom-react";
import { Effect } from "effect";
import type { ThemeModule } from "@mnestia/schema/theme";

export const themeCacheAtom = Atom.make(new Map<string, ThemeModule>()).pipe(
	Atom.keepAlive,
);

export function setCachedTheme(
	themeName: string,
	theme: ThemeModule,
) {
	return Effect.gen(function* () {
		const cache = yield* Atom.get(themeCacheAtom);
		const newCache = new Map<string, ThemeModule>(cache);
		newCache.set(themeName, theme);
		yield* Atom.set(themeCacheAtom, newCache);
	});
}

export function getCachedTheme(
	themeName: string,
) {
	return Effect.gen(function* () {
		const cache = yield* Atom.get(themeCacheAtom);
		return cache.get(themeName);
	});
}

export function clearThemeCache() {
	return Atom.set(themeCacheAtom, new Map<string, ThemeModule>());
}
