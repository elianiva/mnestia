export { DeckService } from "./services/deck-service.js";
export {
	ThemeService,
	createThemeServiceLayer,
	type ThemeServiceConfig,
	type ThemeResolver,
} from "./services/theme-service.js";
export { NavigationService } from "./services/navigation-service.js";

export { createDeckAtom } from "./atoms/deck-atom.js";
export { createClicksAtom, clicksAtomFamily } from "./atoms/clicks-atom.js";
export {
	themeCacheAtom,
	setCachedTheme,
	getCachedTheme,
	clearThemeCache,
} from "./atoms/theme-atom.js";
export { slidesAtom } from "./atoms/slides-atom.js";

export { defineDeck } from "./utils/define-deck.js";
export { defineTheme } from "./utils/define-theme.js";
export { slide } from "./utils/slide.js";

export { useDeck } from "./hooks/use-deck.js";
export { useClicks } from "./hooks/use-clicks.js";
export { useNavigation, useNavigation as useKeyboardNavigation } from "./hooks/use-navigation.js";

export {
	SlideNotFoundError,
	SlideLoadError,
	InvalidSlideIndexError,
	ThemeLoadError,
	ThemeNotFoundError,
	ExportError,
} from "./errors/index.js";
