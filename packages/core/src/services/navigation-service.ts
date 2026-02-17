import { Effect } from "effect";
import type { NavigationConfig } from "@mnestia/schema/navigation";

const STANDARD_SHORTCUTS = {
	next: ["ArrowRight", "ArrowDown", " ", "PageDown"],
	prev: ["ArrowLeft", "ArrowUp", "PageUp"],
	first: ["Home"],
	last: ["End"],
};

const VIM_SHORTCUTS = {
	next: ["l", "j"],
	prev: ["h", "k"],
	first: ["g", "0"],
	last: ["G", "$"],
};

export interface NavigationActions {
	onNext: () => void;
	onPrev: () => void;
	onFirst: () => void;
	onLast: () => void;
}

export class NavigationService extends Effect.Service<NavigationService>()(
	"NavigationService",
	{
		accessors: true,
		effect: Effect.gen(function* () {
			yield* Effect.void;
			const handleKeydown = Effect.fn("NavigationService.handleKeydown")(
				function* (
					event: KeyboardEvent,
					config: NavigationConfig,
					actions: NavigationActions,
					canGoNext: boolean,
					canGoPrev: boolean,
				) {
					const key = event.key;
					let handled = false;

					const shouldHandleStandard =
						config.mode === "standard" || config.mode === "both";
					const shouldHandleVim =
						config.mode === "vim" || config.mode === "both";

					if (shouldHandleStandard) {
						if (STANDARD_SHORTCUTS.next.includes(key) && canGoNext) {
							actions.onNext();
							handled = true;
						} else if (STANDARD_SHORTCUTS.prev.includes(key) && canGoPrev) {
							actions.onPrev();
							handled = true;
						} else if (STANDARD_SHORTCUTS.first.includes(key)) {
							actions.onFirst();
							handled = true;
						} else if (STANDARD_SHORTCUTS.last.includes(key) && canGoNext) {
							actions.onLast();
							handled = true;
						}
					}

					if (shouldHandleVim && !handled) {
						if (VIM_SHORTCUTS.next.includes(key) && canGoNext) {
							actions.onNext();
							handled = true;
						} else if (VIM_SHORTCUTS.prev.includes(key) && canGoPrev) {
							actions.onPrev();
							handled = true;
						} else if (VIM_SHORTCUTS.first.includes(key)) {
							actions.onFirst();
							handled = true;
						} else if (VIM_SHORTCUTS.last.includes(key) && canGoNext) {
							actions.onLast();
							handled = true;
						}
					}

					if (handled) {
						event.preventDefault();
						yield* Effect.log("Keyboard navigation handled", { key });
					}
				},
			);

			return {
				handleKeydown,
				STANDARD_SHORTCUTS,
				VIM_SHORTCUTS,
			};
		}),
	},
) {}
