import { Cause, Effect, Either, ManagedRuntime, Layer } from "effect";
import type { WsOutgoingMessage } from "@mnestia/schema";
import { SlideServiceLive } from "@/domain/adapters/slide-service-live";
import { createSlideStoreLive } from "@/domain/adapters/slide-store-live";
import type { SlideService } from "@/domain/ports/slide-service";
import type { DeckStateInternal } from "@/domain/ports/slide-store";
import { mapDomainErrorToMessage } from "@/shared/errors";

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
    onLeft: (error) => mapDomainErrorToMessage(error),
    onRight: (defectCause) => Cause.pretty(defectCause),
  });
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
