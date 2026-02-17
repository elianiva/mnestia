import { createContext } from "react";
import type { createDeckStore } from "@mnestia/core/store/deck-store";
import type { ThemeModule } from "@mnestia/schema/theme";

type DeckStore = ReturnType<typeof createDeckStore>;

export interface DeckContextValue {
	store: DeckStore;
	theme: ThemeModule | null;
}

export const DeckContext = createContext<DeckContextValue | null>(null);
