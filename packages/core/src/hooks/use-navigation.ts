import { useEffect, useCallback } from "react";
import type { NavigationConfig } from "@mnestia/schema/navigation";

export interface UseNavigationOptions {
	config: NavigationConfig;
	onNext: () => void;
	onPrev: () => void;
	onFirst: () => void;
	onLast: () => void;
	canGoNext: boolean;
	canGoPrev: boolean;
}

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

export function useNavigation({
	config,
	onNext,
	onPrev,
	onFirst,
	onLast,
	canGoNext,
	canGoPrev,
}: UseNavigationOptions) {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const key = event.key;
			let handled = false;

			const shouldHandleStandard =
				config.mode === "standard" || config.mode === "both";
			const shouldHandleVim =
				config.mode === "vim" || config.mode === "both";

			if (shouldHandleStandard) {
				if (STANDARD_SHORTCUTS.next.includes(key) && canGoNext) {
					onNext();
					handled = true;
				} else if (STANDARD_SHORTCUTS.prev.includes(key) && canGoPrev) {
					onPrev();
					handled = true;
				} else if (STANDARD_SHORTCUTS.first.includes(key)) {
					onFirst();
					handled = true;
				} else if (STANDARD_SHORTCUTS.last.includes(key) && canGoNext) {
					onLast();
					handled = true;
				}
			}

			if (shouldHandleVim && !handled) {
				if (VIM_SHORTCUTS.next.includes(key) && canGoNext) {
					onNext();
					handled = true;
				} else if (VIM_SHORTCUTS.prev.includes(key) && canGoPrev) {
					onPrev();
					handled = true;
				} else if (VIM_SHORTCUTS.first.includes(key)) {
					onFirst();
					handled = true;
				} else if (VIM_SHORTCUTS.last.includes(key) && canGoNext) {
					onLast();
					handled = true;
				}
			}

			if (handled) {
				event.preventDefault();
			}
		},
		[config.mode, onNext, onPrev, onFirst, onLast, canGoNext, canGoPrev],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);
}
