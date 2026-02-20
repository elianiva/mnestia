import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DeckConfig } from "@mnestia/schema/deck";
import type { SlideFrontmatter } from "@mnestia/schema/slide";
import type { ThemeModule } from "@mnestia/schema/theme";
import { createDeckAtom, type DeckAtom } from "@mnestia/core/atoms/deck";

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

async function loadTheme(theme: string | ThemeModule): Promise<ThemeModule> {
	if (typeof theme !== "string") {
		return theme;
	}

	try {
		const themeModule = await import(/* @vite-ignore */ theme);
		const themeObj: ThemeModule = themeModule.default || themeModule;

		if (!themeObj.layouts || !themeObj.components) {
			throw new Error(`Theme "${theme}" missing required properties: layouts, components`);
		}

		return themeObj;
	} catch (error) {
		if (theme !== "@mnestia/theme-base") {
			console.warn(`Failed to load theme "${theme}", falling back to base`);
			return loadTheme("@mnestia/theme-base");
		}
		throw error;
	}
}

export function DeckProvider({ config, children }: DeckProviderProps) {
	const [store] = useState(() => createDeckAtom(config as DeckConfig));
	const [theme, setTheme] = useState<ThemeModule | null>(null);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		loadTheme(config.theme)
			.then(setTheme)
			.catch((err: unknown) => {
				console.error("Failed to load theme:", err);
				setError(err instanceof Error ? err : new Error(String(err)));
			});
	}, [config.theme]);

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center p-8">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold text-red-500">Failed to load theme</h1>
					<p className="text-gray-600">{error.message}</p>
				</div>
			</div>
		);
	}

	if (!theme) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-lg text-gray-600">Loading theme...</div>
			</div>
		);
	}

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
