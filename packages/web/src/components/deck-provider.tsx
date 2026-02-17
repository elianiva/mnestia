import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import type { DeckConfig } from "@mnestia/schema/deck";
import type { ThemeModule } from "@mnestia/schema/theme";
import {
	createDeckStore,
	resolveTheme,
	type DeckStore,
} from "@mnestia/core";

interface DeckContextValue {
	store: DeckStore;
	config: DeckConfig;
	theme: ThemeModule;
}

const DeckContext = createContext<DeckContextValue | null>(null);

export interface DeckProviderProps {
	config: DeckConfig;
	children: ReactNode;
}

export function DeckProvider({ config, children }: DeckProviderProps) {
	const [store] = useState(() => createDeckStore(config));
	const [theme, setTheme] = useState<ThemeModule | null>(null);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		resolveTheme(config.theme)
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
					<h1 className="mb-4 text-2xl font-bold text-red-500">
						Failed to load theme
					</h1>
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

	return (
		<DeckContext.Provider value={value}>{children}</DeckContext.Provider>
	);
}

export function useDeckContext(): DeckContextValue {
	const context = useContext(DeckContext);
	if (!context) {
		throw new Error("useDeckContext must be used within a DeckProvider");
	}
	return context;
}
