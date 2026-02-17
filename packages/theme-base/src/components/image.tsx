import type { CSSProperties } from "react";

export interface ImageProps {
  src: string;
  alt: string;
  caption?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  className?: string;
  style?: CSSProperties;
}

export function Image({ src, alt, caption, objectFit = "contain", className, style }: ImageProps) {
  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--mnestia-space-3)",
    ...style,
  };

  const figureStyle: CSSProperties = {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  };

  const imageStyle: CSSProperties = {
    maxWidth: "100%",
    maxHeight: "60vh",
    objectFit,
    borderRadius: "var(--mnestia-border-radius)",
  };

  const captionStyle: CSSProperties = {
    fontSize: "var(--mnestia-font-size-sm)",
    color: "var(--mnestia-text-secondary)",
    textAlign: "center",
    fontStyle: "italic",
  };

  return (
    <figure style={containerStyle} className={className}>
      <div style={figureStyle}>
        <img
          src={src}
          alt={alt}
          style={imageStyle}
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption style={captionStyle}>{caption}</figcaption>
      )}
    </figure>
  );
}
