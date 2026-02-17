import type { ReactNode } from "react";
import type { LayoutProps } from "@mnestia/schema/theme";

export interface GridLayoutProps extends LayoutProps {
  children: ReactNode;
  columns?: number | string[];
  gap?: "sm" | "md" | "lg";
}

const gapMap = {
  sm: "var(--mnestia-space-4)",
  md: "var(--mnestia-space-6)",
  lg: "var(--mnestia-space-8)",
};

export function GridLayout({ children, columns = 2, gap = "md", className, style }: GridLayoutProps) {
  const gridTemplateColumns = typeof columns === "number"
    ? `repeat(${columns}, 1fr)`
    : columns.join(" ");

  return (
    <div
      data-layout="grid"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        padding: "var(--mnestia-slide-padding)",
        ...style,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns,
          gap: gapMap[gap],
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
