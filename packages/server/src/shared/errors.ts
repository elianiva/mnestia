import type { WsOutgoingMessage } from "@mnestia/schema";

type DomainError = { _tag: string; [key: string]: unknown };

// ── Error Code Mapping ────────────────────────────────────────────

const ERROR_CODE_MAP: Record<string, string> = {
  DeckNotFoundError: "DECK_NOT_FOUND",
  SlideNotFoundError: "SLIDE_NOT_FOUND",
  InvalidSlideIndexError: "INVALID_SLIDE_INDEX",
  SlideOperationError: "SLIDE_OPERATION_FAILED",
  WsMessageError: "WS_MESSAGE_ERROR",
};

/**
 * Map a tagged domain error to a stable error code string.
 * Returns `"UNKNOWN_ERROR"` for unrecognized error tags.
 */
export function mapDomainErrorToCode(error: unknown): string {
  if (!isDomainError(error)) return "UNKNOWN_ERROR";
  return ERROR_CODE_MAP[error._tag] ?? "UNKNOWN_ERROR";
}

// ── Error Message Mapping ─────────────────────────────────────────

/**
 * Map a tagged domain error to a human-readable error message.
 * Falls back to a generic message for unrecognized errors.
 */
export function mapDomainErrorToMessage(error: unknown): string {
  if (!isDomainError(error)) return String(error);

  switch (error._tag) {
    case "DeckNotFoundError":
      return `Deck not found: ${String(error.deckId)}`;
    case "SlideNotFoundError":
      return `Slide not found at index ${String(error.slideIndex)} in deck ${String(error.deckId)}`;
    case "InvalidSlideIndexError":
      return `Invalid slide index ${String(error.slideIndex)} (total: ${String(error.totalSlides)}) in deck ${String(error.deckId)}`;
    case "SlideOperationError":
      return `Slide operation failed: ${String(error.reason)}`;
    case "WsMessageError":
      return String(error.message);
    default:
      return `Error [${error._tag}]`;
  }
}

// ── WS Outgoing Error ─────────────────────────────────────────────

/**
 * Convert a domain error into a `WsOutgoingMessage` of type `ERROR`,
 * with a human-readable message and a stable error code. This is the
 * single point of conversion for all domain errors sent over WebSocket.
 */
export function mapDomainErrorToWsMessage(
  error: unknown
): WsOutgoingMessage {
  return {
    type: "ERROR",
    message: mapDomainErrorToMessage(error),
    code: mapDomainErrorToCode(error),
  };
}

// ── Type Guard ────────────────────────────────────────────────────

function isDomainError(error: unknown): error is DomainError {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    typeof (error as DomainError)._tag === "string"
  );
}
