import type { ReactNode } from "react";
import type { LayoutProps } from "@mnestia/schema/theme";

export interface CenterLayoutProps extends LayoutProps {
  children: ReactNode;
}

export function CenterLayout({ children, className, style }: CenterLayoutProps) {
  return (
    <div
      data-layout="center"
      className={[
        "flex h-full w-full items-center justify-center",
        "bg-background p-8 text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div className="flex flex-col items-center text-center">{children}</div>
    </div>
  );
}
