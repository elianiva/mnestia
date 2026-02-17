import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SlideViewer } from "@/components/slide-viewer";
import { NavigationControls } from "@/components/navigation-controls";
import { useDeckContext } from "@/components/deck-provider";
import { useKeyboardNavigation } from "@mnestia/core";

export const Route = createFileRoute("/slide/$number")({
  component: SlideRouteComponent,
});

function SlideRouteComponent() {
  const { number } = Route.useParams();
  const navigate = useNavigate();
  const { store, config } = useDeckContext();
  const state = store();
  const {
    currentSlide,
    totalSlides,
    goToSlide,
    nextSlide,
    prevSlide,
    goToFirstSlide,
    goToLastSlide,
    canGoNext,
    canGoPrev,
  } = state;

  // Validate slide number and redirect if invalid
  useEffect(() => {
    const slideIndex = parseInt(number, 10) - 1;
    if (isNaN(slideIndex) || slideIndex < 0 || slideIndex >= totalSlides) {
      navigate({ href: "/slide/1" });
      return;
    }
    if (slideIndex !== currentSlide) {
      goToSlide(slideIndex);
    }
  }, [number, totalSlides]);

  // Sync store changes back to URL and localStorage
  useEffect(() => {
    const currentNumber = currentSlide + 1;
    const urlNumber = parseInt(number, 10);
    if (currentNumber !== urlNumber && !isNaN(urlNumber)) {
      navigate({ href: `/slide/${currentNumber}` });
    }
    localStorage.setItem("mnestia:currentSlide", String(currentSlide));
  }, [currentSlide, number, navigate]);

  // Keyboard navigation
  useKeyboardNavigation({
    config: config.navigation,
    onNext: nextSlide,
    onPrev: prevSlide,
    onFirst: goToFirstSlide,
    onLast: goToLastSlide,
    canGoNext: canGoNext(),
    canGoPrev: canGoPrev(),
  });

  return (
    <>
      <SlideViewer />
      <NavigationControls />
    </>
  );
}
