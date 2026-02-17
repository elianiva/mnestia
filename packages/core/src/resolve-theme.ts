import type { ThemeModule } from "@mnestia/schema/theme";

const themeCache = new Map<string, ThemeModule>();

export async function resolveTheme(theme: string | ThemeModule): Promise<ThemeModule> {
  // If theme is already a ThemeModule object, return it directly
  if (typeof theme !== "string") {
    return theme;
  }

  if (themeCache.has(theme)) {
    return themeCache.get(theme)!;
  }

  try {
    const themeModule = await import(/* @vite-ignore */ theme);
    const themeObj: ThemeModule = themeModule.default || themeModule;

    if (!themeObj.layouts || !themeObj.components) {
      throw new Error(`Theme "${theme}" missing required properties: layouts, components`);
    }

    themeCache.set(theme, themeObj);
    return themeObj;
  } catch (error) {
    console.error(`Failed to load theme "${theme}":`, error);

    if (theme !== "@mnestia/theme-base") {
      console.warn(`Falling back to @mnestia/theme-base`);
      return resolveTheme("@mnestia/theme-base");
    }

    throw new Error(`Failed to load theme "${theme}" and fallback also failed`);
  }
}

export function clearThemeCache(): void {
  themeCache.clear();
}
