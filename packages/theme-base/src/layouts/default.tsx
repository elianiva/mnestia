import type { ReactNode } from "react";
import type { LayoutProps } from "@mnestia/schema";

export interface DefaultLayoutProps extends LayoutProps {
  children: ReactNode;
}

export function DefaultLayout({ children, className, style }: DefaultLayoutProps) {
  return (
    <div
      data-layout="default"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        padding: "var(--mnestia-slide-padding)",
        maxWidth: "var(--mnestia-slide-max-width)",
        margin: "0 auto",
        overflow: "auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
