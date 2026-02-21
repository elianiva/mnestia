import type { ReactNode } from "react";
import type { LayoutProps } from "@mnestia/schema/theme";

export interface DefaultLayoutProps extends LayoutProps {
  children: ReactNode;
}

export function DefaultLayout({ children, className, style }: DefaultLayoutProps) {
  return (
    <div
      data-layout="default"
      className={[
        "flex h-full w-full flex-col bg-background p-8 text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div className="flex h-full w-full flex-col">{children}</div>
    </div>
  );
}
