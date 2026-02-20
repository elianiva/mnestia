import { Suspense, type ComponentType } from "react";
import type { LayoutProps } from "@mnestia/schema/theme";
import { slides } from "virtual:mnestia/slides";
import { useDeckContext } from "./deck-provider";
import { useDeck } from "../hooks/use-deck";
import { SlideLoading } from "./slide-loading";

export function SlideViewer() {
	const { theme } = useDeckContext();
	const { currentSlide } = useDeck();

	const slide = slides[currentSlide];
	if (!slide) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-xl text-red-500">
					Slide {currentSlide + 1} not found
				</div>
			</div>
		);
	}

	const layoutName = slide.frontmatter?.layout || "default";
	const LayoutComponent = theme.layouts[layoutName] as ComponentType<LayoutProps>;

	if (!LayoutComponent) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-xl text-red-500">
					Layout "{layoutName}" not found in theme
				</div>
			</div>
		);
	}

	const SlideComponent = slide.component;

	return (
		<div className="h-screen w-full">
			<LayoutComponent>
				<Suspense fallback={<SlideLoading />}>
					<SlideComponent />
				</Suspense>
			</LayoutComponent>
		</div>
	);
}
