import { Suspense, useCallback, useEffect } from "react";
import {
	createRouter,
	createRootRoute,
	createRoute,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { deckConfig } from "virtual:mnestia/deck";
import { DeckProvider } from "./components/deck-provider";
import { SlideViewer } from "./components/slide-viewer";
import { NavigationControls } from "./components/navigation-controls";
import { SlideLoading } from "./components/slide-loading";
import { useNavigation } from "@mnestia/core";
import { useDeck } from "./hooks/use-deck";
import { useDeckContext } from "./components/deck-provider";

const rootRoute = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<DeckProvider config={deckConfig}>
			<div className="h-screen w-screen overflow-hidden bg-background">
				<Suspense fallback={<SlideLoading />}>
					<Outlet />
				</Suspense>
			</div>
		</DeckProvider>
	);
}

const slideRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/slide/$number",
	component: SlideComponent,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: IndexComponent,
});

function IndexComponent() {
	const navigate = useNavigate();
	const savedSlide = typeof window !== "undefined"
		? localStorage.getItem("mnestia:currentSlide")
		: null;
	const slideNumber = savedSlide ? parseInt(savedSlide, 10) + 1 : 1;

	useEffect(() => {
		navigate({ to: "/slide/$number", params: { number: String(slideNumber) } });
	}, [navigate, slideNumber]);

	return <SlideLoading />;
}

function SlideComponent() {
	const { number } = slideRoute.useParams();
	const { config } = useDeckContext();
	const { currentSlide, totalSlides, goToSlide, canGoNext, canGoPrev } = useDeck();
	const navigate = useNavigate();

	// Sync URL -> state (browser navigation, initial load)
	// Intentionally NOT depending on currentSlide/goToSlide to prevent infinite loop
	// URL is the source of truth - this effect only runs when URL changes
	useEffect(() => {
		const urlNumber = parseInt(number, 10);
		if (isNaN(urlNumber) || urlNumber < 1 || urlNumber > totalSlides) {
			navigate({ to: "/slide/$number", params: { number: "1" } });
			return;
		}
		const slideIndex = urlNumber - 1;
		if (slideIndex !== currentSlide) {
			goToSlide(slideIndex);
		}
		localStorage.setItem("mnestia:currentSlide", String(slideIndex));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [number, totalSlides, navigate]);

	// Navigation callbacks update URL, which then updates state via useEffect above
	const goToSlideUrl = useCallback(
		(index: number) => {
			const newNumber = Math.max(1, Math.min(totalSlides, index + 1));
			navigate({ to: "/slide/$number", params: { number: String(newNumber) } });
		},
		[navigate, totalSlides],
	);

	const nextSlide = useCallback(() => {
		if (canGoNext) goToSlideUrl(currentSlide + 1);
	}, [canGoNext, currentSlide, goToSlideUrl]);

	const prevSlide = useCallback(() => {
		if (canGoPrev) goToSlideUrl(currentSlide - 1);
	}, [canGoPrev, currentSlide, goToSlideUrl]);

	const goToFirstSlide = useCallback(() => goToSlideUrl(0), [goToSlideUrl]);
	const goToLastSlide = useCallback(() => goToSlideUrl(totalSlides - 1), [goToSlideUrl, totalSlides]);

	useNavigation({
		config: config.navigation,
		onNext: nextSlide,
		onPrev: prevSlide,
		onFirst: goToFirstSlide,
		onLast: goToLastSlide,
		canGoNext,
		canGoPrev,
	});

	return (
		<>
			<SlideViewer />
			<NavigationControls
				onNext={nextSlide}
				onPrev={prevSlide}
				onGoToSlide={goToSlideUrl}
			/>
		</>
	);
}

const routeTree = rootRoute.addChildren([indexRoute, slideRoute]);

export function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
	});
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
