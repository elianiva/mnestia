import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DeckConfig } from "@mnestia/schema/deck";
import type { SlideFrontmatter } from "@mnestia/schema/slide";
import type { ThemeModule } from "@mnestia/schema/theme";
import { createDeckAtom, type DeckAtom } from "@mnestia/core/atoms/deck";
import { defaultTheme, getTheme } from "virtual:mnestia/themes";

export interface SerializableSlide {
	id: string;
	index: number;
	filepath: string;
	frontmatter: SlideFrontmatter;
}

export interface SerializableDeckConfig {
	slides: SerializableSlide[];
	theme: DeckConfig["theme"];
	navigation: DeckConfig["navigation"];
	aspectRatio: DeckConfig["aspectRatio"];
	export?: DeckConfig["export"];
}

interface DeckContextValue {
	store: DeckAtom;
	config: SerializableDeckConfig;
	theme: ThemeModule;
}

const DeckContext = createContext<DeckContextValue | null>(null);

export interface DeckProviderProps {
	config: SerializableDeckConfig;
	children: ReactNode;
}

function loadTheme(themeName: string | ThemeModule): ThemeModule {
	if (typeof themeName !== "string") {
		return themeName;
	}

	const themeObj = getTheme(themeName);

	if (!themeObj.layouts || !themeObj.components) {
		console.warn(`Theme "${themeName}" missing required properties, using default`);
		return getTheme(defaultTheme);
	}

	return themeObj;
}

export function DeckProvider({ config, children }: DeckProviderProps) {
	const store = useMemo(() => createDeckAtom(config as DeckConfig), [config]);
	const theme = useMemo(() => loadTheme(config.theme), [config.theme]);

	const value: DeckContextValue = {
		store,
		config,
		theme,
	};

	return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDeckContext(): DeckContextValue {
	const context = useContext(DeckContext);
	if (!context) {
		throw new Error("useDeckContext must be used within a DeckProvider");
	}
	return context;
}
