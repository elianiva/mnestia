import {
  Suspense,
  useRef,
  useState,
  useLayoutEffect,
  type ComponentType,
} from "react";
import type { LayoutProps } from "@mnestia/schema/theme";
import { slides } from "virtual:mnestia/slides";
import { useDeckContext } from "./deck-provider";
import { useDeck } from "../hooks/use-deck";
import { SlideLoading } from "./slide-loading";

// Default slide dimensions (16:9 aspect ratio)
const SLIDE_WIDTH = 980;
const SLIDE_HEIGHT = 552;

export function SlideViewer() {
  const { theme } = useDeckContext();
  const { currentSlide } = useDeck();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;

      const scaleX = width / SLIDE_WIDTH;
      const scaleY = height / SLIDE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);

      setScale(newScale);
      document.documentElement.style.setProperty(
        "--mnestia-slide-scale",
        String(newScale),
      );
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const slide = slides[currentSlide];
  if (!slide) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <div className="text-xl text-red-500">
          Slide {currentSlide + 1} not found
        </div>
      </div>
    );
  }

  const layoutName = slide.frontmatter?.layout || "default";
  const LayoutComponent = theme.layouts[
    layoutName
  ] as ComponentType<LayoutProps>;

  if (!LayoutComponent) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <div className="text-xl text-red-500">
          Layout "{layoutName}" not found in theme
        </div>
      </div>
    );
  }

  const SlideComponent = slide.component;

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-black">
      {/* Scaled slide container - uses inline styles for precise control */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          overflow: "hidden",
          backgroundColor: "white",
          borderRadius: "2px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <LayoutComponent>
            <Suspense fallback={<SlideLoading />}>
              <SlideComponent />
            </Suspense>
          </LayoutComponent>
        </div>
      </div>
    </div>
  );
}
