import { useState, useCallback } from "react";

export interface UseClicksResult {
	currentClick: number;
	totalClicks: number;
	nextClick: () => void;
	prevClick: () => void;
	goToClick: (index: number) => void;
	canGoNext: boolean;
	canGoPrev: boolean;
	reset: () => void;
}

export function useClicks(totalClicks: number = 0): UseClicksResult {
	const [currentClick, setCurrentClick] = useState(0);

	const nextClick = useCallback(() => {
		setCurrentClick((prev) => Math.min(prev + 1, totalClicks));
	}, [totalClicks]);

	const prevClick = useCallback(() => {
		setCurrentClick((prev) => Math.max(prev - 1, 0));
	}, []);

	const goToClick = useCallback(
		(index: number) => {
			setCurrentClick(Math.max(0, Math.min(index, totalClicks)));
		},
		[totalClicks],
	);

	const reset = useCallback(() => {
		setCurrentClick(0);
	}, []);

	return {
		currentClick,
		totalClicks,
		nextClick,
		prevClick,
		goToClick,
		canGoNext: currentClick < totalClicks,
		canGoPrev: currentClick > 0,
		reset,
	};
}
