import type { ReactNode } from "react";

export interface CoverLayoutProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  style?: Record<string, unknown>;
}

export function CoverLayout({ title, subtitle, children, className, style }: CoverLayoutProps) {
  return (
    <div
      data-layout="cover"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "var(--mnestia-slide-padding)",
        ...style,
      }}
    >
      {title && (
        <h1
          style={{
            fontSize: "var(--mnestia-font-size-6xl)",
            fontWeight: 700,
            marginBottom: "var(--mnestia-space-4)",
            color: "var(--mnestia-text)",
          }}
        >
          {title}
        </h1>
      )}
      {subtitle && (
        <p
          style={{
            fontSize: "var(--mnestia-font-size-2xl)",
            color: "var(--mnestia-text-secondary)",
            marginBottom: "var(--mnestia-space-8)",
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
