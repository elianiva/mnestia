import { ChevronLeft, ChevronRight, Maximize2, Minimize2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useDeck } from "@/hooks/use-deck";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect, useRef } from "react";

interface NavigationControlsProps {
  onNext: () => void;
  onPrev: () => void;
  onGoToSlide: (index: number) => void;
}

export function NavigationControls({ onNext, onPrev, onGoToSlide }: NavigationControlsProps) {
  const { currentSlide, totalSlides, canGoNext, canGoPrev } = useDeck();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = (value: number[]) => {
    const slideIndex = value[0];
    if (typeof slideIndex === "number") {
      onGoToSlide(slideIndex);
    }
  };

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore fullscreen errors
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const showControls = useCallback(() => {
    setIsVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    showControls();
    window.addEventListener("mousemove", showControls);
    window.addEventListener("click", showControls);
    return () => {
      window.removeEventListener("mousemove", showControls);
      window.removeEventListener("click", showControls);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [showControls]);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none"
      )}
    >
      <div
        className="flex items-center gap-1 rounded-xl border border-slate-200/50 bg-white/95 px-2 py-1.5 shadow-2xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/95"
        onMouseEnter={() => setIsVisible(true)}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="h-8 w-8 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </Button>

        <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="h-8 w-8 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={!canGoNext}
          className="h-8 w-8 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Next slide"
        >
          <ChevronRight className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Slide overview"
        >
          <LayoutGrid className="size-4" />
        </Button>

        <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2 px-1">
          <span className="min-w-[1.5ch] text-center text-sm font-medium tabular-nums text-slate-700 dark:text-slate-200">
            {currentSlide + 1}
          </span>
          <Slider
            value={[currentSlide]}
            min={0}
            max={totalSlides - 1}
            step={1}
            onValueChange={handleSliderChange}
            className="w-20"
          />
          <span className="min-w-[1.5ch] text-center text-sm text-slate-500 dark:text-slate-400">
            {totalSlides}
          </span>
        </div>
      </div>
    </div>
  );
}
