import type { CSSProperties } from "react";

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language, filename, showLineNumbers = false }: CodeBlockProps) {
  const lines = code.split("\n");
  const maxLineNumber = lines.length;
  const lineNumberWidth = maxLineNumber.toString().length;

  const containerStyle: CSSProperties = {
    backgroundColor: "var(--mnestia-code-bg)",
    border: "1px solid var(--mnestia-code-border)",
    borderRadius: "var(--mnestia-border-radius)",
    overflow: "hidden",
    fontFamily: "var(--mnestia-font-mono)",
    fontSize: "var(--mnestia-font-size-sm)",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "var(--mnestia-space-2) var(--mnestia-space-4)",
    backgroundColor: "var(--mnestia-bg-tertiary)",
    borderBottom: "1px solid var(--mnestia-code-border)",
  };

  const preStyle: CSSProperties = {
    margin: 0,
    padding: "var(--mnestia-space-4)",
    overflow: "auto",
    lineHeight: "1.5",
    color: "var(--mnestia-code-text)",
  };

  const lineStyle: CSSProperties = {
    display: "flex",
    gap: "var(--mnestia-space-4)",
  };

  const lineNumberStyle: CSSProperties = {
    color: "var(--mnestia-text-muted)",
    textAlign: "right",
    userSelect: "none",
    minWidth: `${lineNumberWidth + 1}ch`,
  };

  const codeStyle: CSSProperties = {
    flex: 1,
  };

  return (
    <div style={containerStyle}>
      {(filename || language) && (
        <div style={headerStyle}>
          {filename && <span style={{ color: "var(--mnestia-text-secondary)" }}>{filename}</span>}
          {language && (
            <span
              style={{
                color: "var(--mnestia-text-muted)",
                fontSize: "var(--mnestia-font-size-xs)",
              }}
            >
              {language}
            </span>
          )}
        </div>
      )}
      <pre style={preStyle}>
        <code>
          {lines.map((line, i) => (
            <div key={i} style={lineStyle}>
              {showLineNumbers && <span style={lineNumberStyle}>{i + 1}</span>}
              <span style={codeStyle}>{line || "\u00a0"}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
