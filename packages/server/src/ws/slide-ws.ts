import { Elysia } from "elysia";
import { Effect, Exit, ManagedRuntime } from "effect";
import * as v from "valibot";
import type {
  WsIncomingMessage,
  WsOutgoingMessage,
} from "@mnestia/schema";
import { WsIncomingMessageSchema } from "@mnestia/schema";
import { SlideService } from "../domain/slide-service";
import { WsMessageError } from "../domain/slide-errors";
import { type DeckStateInternal } from "../domain/slide-store";
import { formatEffectCause, broadcastToClients } from "./effect-runtime";
import { captureEffectError } from "../config/sentry-capture";

interface WsData {
  slideStore: Map<string, DeckStateInternal>;
  slideRuntime: ManagedRuntime.ManagedRuntime<SlideService, never>;
}

interface WsSender {
  id: string;
  send: (data: string) => void;
}

function sendMessage(ws: WsSender, msg: WsOutgoingMessage): void {
  ws.send(JSON.stringify(msg));
}

function sendError(ws: WsSender, message: string, code?: string): void {
  sendMessage(ws, { type: "ERROR", message, code });
}

function parseRawMessage(rawMessage: unknown): Effect.Effect<unknown, WsMessageError> {
  return Effect.try({
    try: () =>
      typeof rawMessage === "string"
        ? JSON.parse(rawMessage)
        : rawMessage,
    catch: (cause) => new WsMessageError({ message: "Invalid JSON message", cause }),
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

function handleMessage(
  ws: WsSender,
  message: WsIncomingMessage,
  storeMap: Map<string, DeckStateInternal>
) {
  return Effect.gen(function* () {
    const service = yield* SlideService;

    switch (message.type) {
      case "JOIN_ROOM": {
        const state = yield* service.getOrCreateDeck(message.deckId);

        yield* service.addClient(
          message.deckId,
          ws.id,
          ws as unknown as WebSocket
        );

        sendMessage(ws, {
          type: "SYNC_STATE",
          deckId: message.deckId,
          state,
        });
        break;
      }

      case "SLIDE_CHANGE": {
        yield* service.changeCurrentSlide(message.deckId, message.slideIndex);

        const internal = storeMap.get(message.deckId);
        if (internal) {
          yield* broadcastToClients(internal.clients, {
            type: "SLIDE_CHANGE",
            deckId: message.deckId,
            slideIndex: message.slideIndex,
          });
        }
        break;
      }

      case "SYNC_REQUEST": {
        const state = yield* service.getDeck(message.deckId);

        sendMessage(ws, {
          type: "SYNC_STATE",
          deckId: message.deckId,
          state,
        });
        break;
      }
    }
  });
}

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

        // Annotate the current span with event metadata
        yield* Effect.annotateCurrentSpan("ws.event_type", message.type);
        if ("deckId" in message) {
          yield* Effect.annotateCurrentSpan("deck.id", message.deckId);
        }

        yield* handleMessage(wsSender, message, storeMap);
      }).pipe(Effect.withSpan("ws.message"));

      const exit = await runtime.runPromiseExit(pipeline);

      if (Exit.isFailure(exit)) {
        captureEffectError(exit.cause);
        sendError(wsSender, formatEffectCause(exit.cause));
      }
    },

    async close(ws) {
      const { slideRuntime: runtime } = ws.data as unknown as WsData;

      const wsId = (ws as unknown as WsSender).id;
      const pipeline = Effect.gen(function* () {
        const service = yield* SlideService;
        yield* service.removeClient(wsId);
      });

      await runtime.runPromise(pipeline).catch(() => {
        // Best-effort cleanup — don't crash on close
      });
    },
  });
