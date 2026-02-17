import type { ReactNode } from "react";
import type { LayoutProps } from "@mnestia/schema/theme";

export interface CenterLayoutProps extends LayoutProps {
  children: ReactNode;
}

export function CenterLayout({ children, className, style }: CenterLayoutProps) {
  return (
    <div
      data-layout="center"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "var(--mnestia-slide-padding)",
        ...style,
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "var(--mnestia-slide-max-width)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
