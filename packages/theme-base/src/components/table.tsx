import type { CSSProperties, ReactNode } from "react";

export interface TableProps {
  headers: string[];
  rows: ReactNode[][];
  striped?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Table({ headers, rows, striped = false, className, style }: TableProps) {
  const containerStyle: CSSProperties = {
    width: "100%",
    overflowX: "auto",
    ...style,
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "var(--mnestia-font-size-sm)",
    textAlign: "left",
    border: "1px solid var(--mnestia-border)",
    borderRadius: "var(--mnestia-border-radius)",
  };

  const thStyle: CSSProperties = {
    padding: "var(--mnestia-space-3) var(--mnestia-space-4)",
    backgroundColor: "var(--mnestia-bg-tertiary)",
    borderBottom: "2px solid var(--mnestia-border)",
    fontWeight: 600,
    color: "var(--mnestia-text)",
    textTransform: "uppercase",
    fontSize: "var(--mnestia-font-size-xs)",
    letterSpacing: "0.05em",
  };

  const tdStyle: CSSProperties = {
    padding: "var(--mnestia-space-3) var(--mnestia-space-4)",
    borderBottom: "1px solid var(--mnestia-border)",
    color: "var(--mnestia-text-secondary)",
  };

  return (
    <div style={containerStyle} className={className}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} style={thStyle}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={
                striped && rowIndex % 2 === 1
                  ? { backgroundColor: "var(--mnestia-bg-secondary)" }
                  : undefined
              }
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={tdStyle}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
