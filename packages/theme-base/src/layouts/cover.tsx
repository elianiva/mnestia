import type { ReactNode } from "react";

export interface CoverLayoutProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CoverLayout({ title, subtitle, children, className, style }: CoverLayoutProps) {
  return (
    <div
      data-layout="cover"
      className={[
        "flex h-full w-full flex-col items-center justify-center",
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        "p-8 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {title && (
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-6xl">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="mb-8 text-xl text-slate-300 md:text-2xl">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
