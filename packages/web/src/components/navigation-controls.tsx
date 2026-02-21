import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useDeck } from "@/hooks/use-deck";

interface NavigationControlsProps {
	onNext: () => void;
	onPrev: () => void;
	onGoToSlide: (index: number) => void;
}

export function NavigationControls({ onNext, onPrev, onGoToSlide }: NavigationControlsProps) {
	const { currentSlide, totalSlides, canGoNext, canGoPrev } = useDeck();

	const handleSliderChange = (value: number[]) => {
		const slideIndex = value[0];
		if (typeof slideIndex === "number") {
			onGoToSlide(slideIndex);
		}
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t bg-white/90 px-6 py-4 backdrop-blur-sm dark:bg-slate-900/90">
			<Button
				variant="outline"
				size="icon"
				onClick={onPrev}
				disabled={!canGoPrev}
				aria-label="Previous slide"
			>
				<ChevronLeft className="size-4" />
			</Button>

			<div className="flex flex-1 items-center gap-4 px-6">
				<span className="min-w-[3ch] text-center text-sm font-medium">{currentSlide + 1}</span>
				<Slider
					value={[currentSlide]}
					min={0}
					max={totalSlides - 1}
					step={1}
					onValueChange={handleSliderChange}
					className="flex-1"
				/>
				<span className="min-w-[3ch] text-center text-sm font-medium">{totalSlides}</span>
			</div>

			<Button
				variant="outline"
				size="icon"
				onClick={onNext}
				disabled={!canGoNext}
				aria-label="Next slide"
			>
				<ChevronRight className="size-4" />
			</Button>
		</div>
	);
}
