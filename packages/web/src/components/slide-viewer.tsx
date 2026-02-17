import type { ComponentType } from "react";
import type { LayoutProps } from "@mnestia/schema/theme";
import { useDeckContext } from "@/components/deck-provider";

export function SlideViewer() {
  const { store, theme } = useDeckContext();
  const { currentSlide, slides } = store();

  const slide = slides[currentSlide];
  if (!slide) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-red-500">Slide {currentSlide + 1} not found</div>
      </div>
    );
  }

  const layoutName = slide.frontmatter?.layout || "default";
  const LayoutComponent = theme.layouts[layoutName] as ComponentType<LayoutProps>;

  if (!LayoutComponent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-red-500">Layout "{layoutName}" not found in theme</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <LayoutComponent>
        <div>Slide {currentSlide + 1} content here</div>
      </LayoutComponent>
    </div>
  );
}
