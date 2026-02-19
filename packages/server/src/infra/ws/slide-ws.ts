import { Elysia } from "elysia";
import { Effect, Exit, ManagedRuntime } from "effect";
import * as v from "valibot";
import type { WsIncomingMessage, WsOutgoingMessage } from "@mnestia/schema";
import { WsIncomingMessageSchema } from "@mnestia/schema";
import type { SlideService } from "@/domain/ports/slide-service";
import { WsMessageError } from "@/domain/slide-errors";
import { type DeckStateInternal } from "@/domain/ports/slide-store";
import { formatEffectCause } from "@/infra/ws/effect-runtime";
import { captureEffectError } from "@/infra/config/sentry-capture";
import {
  handleJoinRoom,
  handleSlideChange,
  handleSyncRequest,
  type WsSender,
} from "@/application/ws-handlers";

// ── Types ─────────────────────────────────────────────────────────

interface WsData {
  slideStore: Map<string, DeckStateInternal>;
  slideRuntime: ManagedRuntime.ManagedRuntime<SlideService, never>;
}

// ── Message Processing Helpers ────────────────────────────────────

function parseRawMessage(
  rawMessage: unknown
): Effect.Effect<unknown, WsMessageError> {
  return Effect.try({
    try: () =>
      typeof rawMessage === "string"
        ? JSON.parse(rawMessage)
        : rawMessage,
    catch: (cause) =>
      new WsMessageError({ message: "Invalid JSON message", cause }),
  });
}

function validateMessage(
  parsed: unknown
): Effect.Effect<WsIncomingMessage, WsMessageError> {
  return Effect.suspend(() => {
    const result = v.safeParse(WsIncomingMessageSchema, parsed);
    if (!result.success) {
      return Effect.fail(
        new WsMessageError({
          message: `Invalid message format: ${result.issues.map((i) => i.message).join(", ")}`,
        })
      );
    }
    return Effect.succeed(result.output);
  });
}

function annotateMessage(
  message: WsIncomingMessage
): Effect.Effect<void> {
  return Effect.gen(function* () {
    yield* Effect.annotateCurrentSpan("ws.event_type", message.type);
    if ("deckId" in message) {
      yield* Effect.annotateCurrentSpan("deck.id", message.deckId);
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────

function sendError(ws: WsSender, message: string, code?: string): void {
  const msg: WsOutgoingMessage = { type: "ERROR", message, code };
  ws.send(JSON.stringify(msg));
}

// ── WebSocket Handler ─────────────────────────────────────────────

export const slideWs = new Elysia({ name: "slide-ws" })
  .ws("/ws/slides", {
    open(_ws) {
      // No-op: client must send JOIN_ROOM to join a deck
    },

    async message(ws, rawMessage) {
      const { slideStore: storeMap, slideRuntime: runtime } =
        ws.data as unknown as WsData;
      const wsSender = ws as unknown as WsSender;

      const pipeline = Effect.gen(function* () {
        const parsed = yield* parseRawMessage(rawMessage);
        const message = yield* validateMessage(parsed);
        yield* annotateMessage(message);

        switch (message.type) {
          case "JOIN_ROOM":
            return yield* handleJoinRoom(wsSender, message.deckId, storeMap);
          case "SLIDE_CHANGE":
            return yield* handleSlideChange(
              message.deckId,
              message.slideIndex,
              storeMap
            );
          case "SYNC_REQUEST":
            return yield* handleSyncRequest(wsSender, message.deckId);
        }
      }).pipe(Effect.withSpan("ws.message"));

      const exit = await runtime.runPromiseExit(pipeline);

      if (Exit.isFailure(exit)) {
        captureEffectError(exit.cause);
        sendError(wsSender, formatEffectCause(exit.cause));
      }
    },

    close(ws) {
      const { slideStore: storeMap } = ws.data as unknown as WsData;

      const wsId = (ws as unknown as WsSender).id;
      for (const [, deck] of storeMap) {
        deck.clients.delete(wsId);
      }
    },
  });
