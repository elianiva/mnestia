import type { ReactNode } from "react";
import type { LayoutProps } from "@mnestia/schema/theme";

export interface GridLayoutProps extends LayoutProps {
  children: ReactNode;
  columns?: number | string[];
  gap?: "sm" | "md" | "lg";
}

const gapClasses = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

export function GridLayout({
  children,
  columns = 2,
  gap = "md",
  className,
  style,
}: GridLayoutProps) {
  const gridCols =
    typeof columns === "number"
      ? `grid-cols-${columns}`
      : undefined;

  const gridStyle =
    typeof columns !== "number"
      ? { gridTemplateColumns: columns.join(" ") }
      : undefined;

  return (
    <div
      data-layout="grid"
      className={[
        "h-full w-full bg-background p-8 text-foreground",
        className
      ].filter(Boolean).join(" ")}
      style={style}
    >
      <div
        className={["grid h-full", gridCols, gapClasses[gap]].filter(Boolean).join(" ")}
        style={gridStyle}
      >
        {children}
      </div>
    </div>
  );
}
