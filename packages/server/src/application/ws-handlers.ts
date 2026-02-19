import { Effect } from "effect";
import type { WsOutgoingMessage } from "@mnestia/schema";
import { SlideService } from "@/domain/ports/slide-service";
import type {
  DeckNotFoundError,
  InvalidSlideIndexError,
} from "@/domain/slide-errors";
import type { DeckStateInternal } from "@/domain/ports/slide-store";
import { broadcastToClients } from "@/infra/ws/effect-runtime";

// ── Shared Types ──────────────────────────────────────────────────

export interface WsSender {
  id: string;
  send: (data: string) => void;
}

function sendMessage(ws: WsSender, msg: WsOutgoingMessage): void {
  ws.send(JSON.stringify(msg));
}

// ── Handlers ──────────────────────────────────────────────────────

/**
 * Handle a JOIN_ROOM message. Ensures the deck exists (creating it
 * if necessary), registers the client in the deck's client map,
 * and sends the current deck state back to the joining client.
 */
export function handleJoinRoom(
  ws: WsSender,
  deckId: string,
  storeMap: Map<string, DeckStateInternal>
): Effect.Effect<void, never, SlideService> {
  return Effect.gen(function* () {
    const service = yield* SlideService;
    const state = yield* service.getOrCreateDeck(deckId);

    const internal = storeMap.get(deckId);
    if (internal) {
      internal.clients.set(ws.id, ws as unknown as WebSocket);
    }

    sendMessage(ws, {
      type: "SYNC_STATE",
      deckId,
      state,
    });
  });
}

/**
 * Handle a SLIDE_CHANGE message. Updates the current slide index
 * in the deck state and broadcasts the change to all connected
 * clients in the same room.
 */
export function handleSlideChange(
  deckId: string,
  slideIndex: number,
  storeMap: Map<string, DeckStateInternal>
): Effect.Effect<void, DeckNotFoundError | InvalidSlideIndexError, SlideService> {
  return Effect.gen(function* () {
    const service = yield* SlideService;
    yield* service.changeCurrentSlide(deckId, slideIndex);

    const internal = storeMap.get(deckId);
    if (internal) {
      yield* broadcastToClients(internal.clients, {
        type: "SLIDE_CHANGE",
        deckId,
        slideIndex,
      });
    }
  });
}

/**
 * Handle a SYNC_REQUEST message. Fetches the current deck state
 * and sends it back to the requesting client as a SYNC_STATE
 * message. Fails with `DeckNotFoundError` if the deck does not
 * exist.
 */
export function handleSyncRequest(
  ws: WsSender,
  deckId: string
): Effect.Effect<void, DeckNotFoundError, SlideService> {
  return Effect.gen(function* () {
    const service = yield* SlideService;
    const state = yield* service.getDeck(deckId);

    sendMessage(ws, {
      type: "SYNC_STATE",
      deckId,
      state,
    });
  });
}
