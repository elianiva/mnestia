import type { ReactNode } from "react";
import type { LayoutProps } from "@mnestia/schema";

export interface SplitLayoutProps extends LayoutProps {
  left: ReactNode;
  right: ReactNode;
  ratio?: "50-50" | "60-40" | "40-60" | "70-30" | "30-70";
}

const ratioMap = {
  "50-50": "1fr 1fr",
  "60-40": "3fr 2fr",
  "40-60": "2fr 3fr",
  "70-30": "7fr 3fr",
  "30-70": "3fr 7fr",
};

export function SplitLayout({ left, right, ratio = "50-50", className, style }: SplitLayoutProps) {
  return (
    <div
      data-layout="split"
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
          gridTemplateColumns: ratioMap[ratio],
          gap: "var(--mnestia-space-8)",
          height: "100%",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {left}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {right}
        </div>
      </div>
    </div>
  );
}
