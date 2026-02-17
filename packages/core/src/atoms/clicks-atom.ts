import { Atom } from "@effect-atom/atom-react";

export interface ClicksState {
	currentClick: number;
	totalClicks: number;
}

export function createClicksAtom(totalClicks: number = 0) {
	return Atom.make({
		currentClick: 0,
		totalClicks,
	}).pipe(Atom.keepAlive);
}

export function createClicksAtomFamily() {
	return Atom.family((_slideIndex: number) =>
		Atom.make({
			currentClick: 0,
			totalClicks: 0,
		}),
	);
}

export const clicksAtomFamily = createClicksAtomFamily();
export type ClicksAtom = ReturnType<typeof createClicksAtom>;
