import { Data } from "effect";

export class DeckNotFoundError extends Data.TaggedError(
  "DeckNotFoundError"
)<{
  readonly deckId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class SlideNotFoundError extends Data.TaggedError(
  "SlideNotFoundError"
)<{
  readonly deckId: string;
  readonly slideIndex: number;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class InvalidSlideIndexError extends Data.TaggedError(
  "InvalidSlideIndexError"
)<{
  readonly deckId: string;
  readonly slideIndex: number;
  readonly totalSlides: number;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class SlideOperationError extends Data.TaggedError(
  "SlideOperationError"
)<{
  readonly operation: string;
  readonly deckId: string;
  readonly reason: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WsMessageError extends Data.TaggedError(
  "WsMessageError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
