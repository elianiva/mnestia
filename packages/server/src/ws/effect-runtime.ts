import { Cause, Effect, Either, ManagedRuntime, Layer } from "effect";
import type { WsOutgoingMessage } from "@mnestia/schema";
import { SlideServiceLive, createSlideStoreLive } from "../domain/slide-layer";
import type { SlideService } from "../domain/slide-service";
import type { DeckStateInternal } from "../domain/slide-store";

export function createSlideRuntime(
  storeMap: Map<string, DeckStateInternal>,
  tracingLayer: Layer.Layer<never>
): ManagedRuntime.ManagedRuntime<SlideService, never> {
  const storeLayer = createSlideStoreLive(storeMap);
  const serviceLayer = SlideServiceLive.pipe(Layer.provide(storeLayer));

  // Merge tracing into the service layer so all Effect spans are exported
  const fullLayer = Layer.merge(serviceLayer, tracingLayer);

  return ManagedRuntime.make(fullLayer);
}

export function formatEffectCause<E>(cause: Cause.Cause<E>): string {
  const either = Cause.failureOrCause(cause);

  return Either.match(either, {
    onLeft: (error) => formatDomainError(error),
    onRight: (defectCause) => Cause.pretty(defectCause),
  });
}

function formatDomainError(error: unknown): string {
  if (typeof error !== "object" || error === null || !("_tag" in error)) {
    return String(error);
  }

  const tagged = error as { _tag: string; [key: string]: unknown };

  switch (tagged._tag) {
    case "DeckNotFoundError":
      return `Deck not found: ${String(tagged.deckId)}`;
    case "SlideNotFoundError":
      return `Slide not found at index ${String(tagged.slideIndex)} in deck ${String(tagged.deckId)}`;
    case "InvalidSlideIndexError":
      return `Invalid slide index ${String(tagged.slideIndex)} (total: ${String(tagged.totalSlides)}) in deck ${String(tagged.deckId)}`;
    case "SlideOperationError":
      return `Slide operation failed: ${String(tagged.reason)}`;
    case "WsMessageError":
      return String(tagged.message);
    default:
      return `Error [${tagged._tag}]`;
  }
}

// ── WebSocket Effect Helpers ──────────────────────────────────────

function sendToClient(
  client: WebSocket,
  payload: string
): Effect.Effect<void> {
  return Effect.try(() => {
    (client as unknown as { send: (data: string) => void }).send(payload);
  }).pipe(Effect.ignore);
}

export function broadcastToClients(
  clients: Map<string, WebSocket>,
  msg: WsOutgoingMessage,
  excludeId?: string
): Effect.Effect<void> {
  const payload = JSON.stringify(msg);
  const targetClients = [...clients.entries()].filter(
    ([id]) => id !== excludeId
  );

  return Effect.forEach(
    targetClients,
    ([, client]) => sendToClient(client, payload),
    { discard: true }
  ).pipe(
    Effect.tap(() =>
      Effect.annotateCurrentSpan("client.count", targetClients.length)
    ),
    Effect.withSpan("ws.broadcast")
  );
}
