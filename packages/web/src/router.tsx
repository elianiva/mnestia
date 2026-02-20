import { Suspense, useEffect } from "react";
import {
	createRouter,
	createRootRoute,
	createRoute,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { deckConfig } from "virtual:mnestia/deck";
import { slides } from "virtual:mnestia/slides";
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
	} = useDeck();
	const navigate = useNavigate();

	useEffect(() => {
		const slideIndex = parseInt(number, 10) - 1;
		if (isNaN(slideIndex) || slideIndex < 0 || slideIndex >= totalSlides) {
			navigate({ to: "/slide/$number", params: { number: "1" } });
			return;
		}
		if (slideIndex !== currentSlide) {
			goToSlide(slideIndex);
		}
	}, [number, totalSlides, navigate, currentSlide, goToSlide]);

	useEffect(() => {
		const currentNumber = currentSlide + 1;
		const urlNumber = parseInt(number, 10);
		if (currentNumber !== urlNumber && !isNaN(urlNumber)) {
			navigate({ to: "/slide/$number", params: { number: String(currentNumber) } });
		}
		localStorage.setItem("mnestia:currentSlide", String(currentSlide));
	}, [currentSlide, number, navigate]);

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
			<NavigationControls />
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
