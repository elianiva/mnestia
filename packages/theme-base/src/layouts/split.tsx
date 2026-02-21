import type { ReactNode } from "react";
import type { LayoutProps } from "@mnestia/schema/theme";

export interface SplitLayoutProps extends LayoutProps {
  left: ReactNode;
  right: ReactNode;
  ratio?: "50-50" | "60-40" | "40-60" | "70-30" | "30-70";
}

const ratioClasses = {
  "50-50": "grid-cols-2",
  "60-40": "grid-cols-[3fr_2fr]",
  "40-60": "grid-cols-[2fr_3fr]",
  "70-30": "grid-cols-[7fr_3fr]",
  "30-70": "grid-cols-[3fr_7fr]",
};

export function SplitLayout({ left, right, ratio = "50-50", className, style }: SplitLayoutProps) {
  return (
    <div
      data-layout="split"
      className={[
        "h-full w-full bg-background p-8 text-foreground",
        className
      ].filter(Boolean).join(" ")}
      style={style}
    >
      <div className={["grid h-full items-center gap-8", ratioClasses[ratio]].join(" ")}>
        <div className="flex flex-col justify-center">
          {left}
        </div>
        <div className="flex flex-col justify-center">
          {right}
        </div>
      </div>
    </div>
  );
}
