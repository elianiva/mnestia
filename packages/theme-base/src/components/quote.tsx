import type { CSSProperties } from "react";

export interface QuoteProps {
  quote: string;
  author?: string;
  source?: string;
}

export function Quote({ quote, author, source }: QuoteProps) {
  const containerStyle: CSSProperties = {
    position: "relative",
    padding: "var(--mnestia-space-8)",
    paddingLeft: "calc(var(--mnestia-space-8) + var(--mnestia-space-6))",
    borderLeft: `4px solid var(--mnestia-accent)`,
    backgroundColor: "var(--mnestia-bg-secondary)",
    borderRadius: "0 var(--mnestia-border-radius) var(--mnestia-border-radius) 0",
    margin: "var(--mnestia-space-6) 0",
  };

  const quoteMarkStyle: CSSProperties = {
    position: "absolute",
    top: "var(--mnestia-space-4)",
    left: "var(--mnestia-space-4)",
    fontSize: "4rem",
    lineHeight: 1,
    color: "var(--mnestia-accent)",
    opacity: 0.3,
    fontFamily: "Georgia, serif",
    userSelect: "none",
  };

  const quoteStyle: CSSProperties = {
    fontSize: "var(--mnestia-font-size-xl)",
    fontStyle: "italic",
    lineHeight: "var(--mnestia-line-height-relaxed)",
    color: "var(--mnestia-text)",
    marginBottom: author || source ? "var(--mnestia-space-4)" : 0,
  };

  const attributionStyle: CSSProperties = {
    fontSize: "var(--mnestia-font-size-sm)",
    color: "var(--mnestia-text-secondary)",
  };

  const dashStyle: CSSProperties = {
    color: "var(--mnestia-accent)",
    marginRight: "var(--mnestia-space-2)",
  };

  return (
    <blockquote style={containerStyle}>
      <span style={quoteMarkStyle} aria-hidden="true">
        """
      </span>
      <p style={quoteStyle}>{quote}</p>
      {(author || source) && (
        <cite style={attributionStyle}>
          <span style={dashStyle}>—</span>
          {author}
          {source && (
            <>
              {author && ", "}
              <span style={{ fontStyle: "italic" }}>{source}</span>
            </>
          )}
        </cite>
      )}
    </blockquote>
  );
}
