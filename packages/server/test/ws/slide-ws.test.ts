import { test, expect, describe, afterEach } from "bun:test";
import type { WsOutgoingMessage } from "@mnestia/schema";
import { slideWs } from "@/infra/ws/slide-ws";
import {
  seedDeck,
  createDecoratedApp,
  startApp,
  connectWs,
  closeWs,
  waitForMessage,
  sendWsMessage,
} from "../helpers";

// ── Test Helpers ──────────────────────────────────────────────────

function createTestApp() {
  const { app, storeMap } = createDecoratedApp();
  const testApp = app.use(slideWs).get("/health", () => ({ ok: true }));
  return { app: testApp, storeMap };
}

// ── Tests ─────────────────────────────────────────────────────────

let cleanup: (() => Promise<void>) | undefined;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = undefined;
  }
});

describe("WebSocket slide-ws", () => {
  describe("JOIN_ROOM", () => {
    test("returns SYNC_STATE when joining a new room", async () => {
      const { app } = createTestApp();
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      const responsePromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "JOIN_ROOM", deckId: "test-deck" });
      const response = await responsePromise;

      expect(response.type).toBe("SYNC_STATE");
      if (response.type === "SYNC_STATE") {
        expect(response.deckId).toBe("test-deck");
        expect(response.state.currentSlide).toBe(0);
        expect(response.state.slides).toEqual([]);
      }
    });

    test("returns SYNC_STATE with existing deck state", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "existing-deck", 3, 1);
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      const responsePromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "JOIN_ROOM", deckId: "existing-deck" });
      const response = await responsePromise;

      expect(response.type).toBe("SYNC_STATE");
      if (response.type === "SYNC_STATE") {
        expect(response.deckId).toBe("existing-deck");
        expect(response.state.currentSlide).toBe(1);
        expect(response.state.slides).toHaveLength(3);
      }
    });

    test("creates deck on the fly when it does not exist", async () => {
      const { app, storeMap } = createTestApp();
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      const responsePromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "JOIN_ROOM", deckId: "new-deck" });
      await responsePromise;

      // The deck should now exist in the store
      expect(storeMap.has("new-deck")).toBe(true);
    });
  });

  describe("SLIDE_CHANGE", () => {
    test("broadcasts SLIDE_CHANGE to all clients in the room", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "broadcast-deck", 5);
      const { server, wsUrl } = await startApp(app);

      const ws1 = await connectWs(wsUrl);
      const ws2 = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws1);
        await closeWs(ws2);
        server.stop();
      };

      // Both clients join the room
      const join1 = waitForMessage<WsOutgoingMessage>(ws1);
      sendWsMessage(ws1, { type: "JOIN_ROOM", deckId: "broadcast-deck" });
      await join1;

      const join2 = waitForMessage<WsOutgoingMessage>(ws2);
      sendWsMessage(ws2, { type: "JOIN_ROOM", deckId: "broadcast-deck" });
      await join2;

      // Client 1 sends a slide change
      const msg1Promise = waitForMessage<WsOutgoingMessage>(ws1);
      const msg2Promise = waitForMessage<WsOutgoingMessage>(ws2);
      sendWsMessage(ws1, {
        type: "SLIDE_CHANGE",
        deckId: "broadcast-deck",
        slideIndex: 3,
      });

      // Both clients should receive the broadcast
      const [msg1, msg2] = await Promise.all([msg1Promise, msg2Promise]);

      // Both clients must receive SLIDE_CHANGE
      expect(msg1.type).toBe("SLIDE_CHANGE");
      expect(msg2.type).toBe("SLIDE_CHANGE");

      if (msg1.type === "SLIDE_CHANGE") {
        expect(msg1.deckId).toBe("broadcast-deck");
        expect(msg1.slideIndex).toBe(3);
      }
      if (msg2.type === "SLIDE_CHANGE") {
        expect(msg2.deckId).toBe("broadcast-deck");
        expect(msg2.slideIndex).toBe(3);
      }
    });

    test("updates the current slide in the store", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "update-deck", 5, 0);
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      // Join first
      const joinPromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "JOIN_ROOM", deckId: "update-deck" });
      await joinPromise;

      // Change slide
      const changePromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, {
        type: "SLIDE_CHANGE",
        deckId: "update-deck",
        slideIndex: 2,
      });
      await changePromise;

      // Verify the store was updated
      const deck = storeMap.get("update-deck");
      expect(deck).toBeDefined();
      expect(deck!.currentSlide).toBe(2);
    });
  });

  describe("SYNC_REQUEST", () => {
    test("returns current deck state on sync request", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "sync-deck", 4, 2);
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      // Join first
      const joinPromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "JOIN_ROOM", deckId: "sync-deck" });
      await joinPromise;

      // Request sync
      const syncPromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "SYNC_REQUEST", deckId: "sync-deck" });
      const response = await syncPromise;

      expect(response.type).toBe("SYNC_STATE");
      if (response.type === "SYNC_STATE") {
        expect(response.deckId).toBe("sync-deck");
        expect(response.state.currentSlide).toBe(2);
        expect(response.state.slides).toHaveLength(4);
      }
    });

    test("returns error for non-existent deck on sync request", async () => {
      const { app } = createTestApp();
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      const responsePromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "SYNC_REQUEST", deckId: "ghost-deck" });
      const response = await responsePromise;

      expect(response.type).toBe("ERROR");
    });
  });

  describe("error handling", () => {
    test("returns ERROR for invalid JSON", async () => {
      const { app } = createTestApp();
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      const responsePromise = waitForMessage<WsOutgoingMessage>(ws);
      ws.send("{not valid json}}}");
      const response = await responsePromise;

      expect(response.type).toBe("ERROR");
    });

    test("returns ERROR for unknown message type", async () => {
      const { app } = createTestApp();
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      const responsePromise = waitForMessage<WsOutgoingMessage>(ws);
      ws.send(JSON.stringify({ type: "UNKNOWN_TYPE", deckId: "foo" }));
      const response = await responsePromise;

      expect(response.type).toBe("ERROR");
    });

    test("returns ERROR for message missing required fields", async () => {
      const { app } = createTestApp();
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      const responsePromise = waitForMessage<WsOutgoingMessage>(ws);
      ws.send(JSON.stringify({ type: "JOIN_ROOM" }));
      const response = await responsePromise;

      expect(response.type).toBe("ERROR");
    });

    test("returns ERROR for SLIDE_CHANGE with invalid slide index", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "error-deck", 3);
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws);
        server.stop();
      };

      // Join first
      const joinPromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "JOIN_ROOM", deckId: "error-deck" });
      await joinPromise;

      // Try an invalid slide index
      const errorPromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, {
        type: "SLIDE_CHANGE",
        deckId: "error-deck",
        slideIndex: 99,
      });
      const response = await errorPromise;

      expect(response.type).toBe("ERROR");
    });
  });

  describe("connection lifecycle", () => {
    test("client is removed from deck on disconnect", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "lifecycle-deck", 2);
      const { server, wsUrl } = await startApp(app);
      const ws = await connectWs(wsUrl);

      // Join room
      const joinPromise = waitForMessage<WsOutgoingMessage>(ws);
      sendWsMessage(ws, { type: "JOIN_ROOM", deckId: "lifecycle-deck" });
      await joinPromise;

      const deck = storeMap.get("lifecycle-deck");
      const clientCountBefore = deck?.clients.size ?? 0;
      expect(clientCountBefore).toBeGreaterThanOrEqual(1);

      // Disconnect
      await closeWs(ws);

      // Poll for client removal — Elysia close handler may fire asynchronously
      const maxRetries = 20;
      let clientCountAfter = clientCountBefore;
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((r) => setTimeout(r, 50));
        clientCountAfter = deck?.clients.size ?? 0;
        if (clientCountAfter < clientCountBefore) break;
      }

      expect(clientCountAfter).toBe(clientCountBefore - 1);

      cleanup = async () => {
        server.stop();
      };
    });

    test("multiple clients can join the same room", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "multi-deck", 3);
      const { server, wsUrl } = await startApp(app);

      const ws1 = await connectWs(wsUrl);
      const ws2 = await connectWs(wsUrl);
      const ws3 = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(ws1);
        await closeWs(ws2);
        await closeWs(ws3);
        server.stop();
      };

      // All three join
      const join1 = waitForMessage<WsOutgoingMessage>(ws1);
      sendWsMessage(ws1, { type: "JOIN_ROOM", deckId: "multi-deck" });
      await join1;

      const join2 = waitForMessage<WsOutgoingMessage>(ws2);
      sendWsMessage(ws2, { type: "JOIN_ROOM", deckId: "multi-deck" });
      await join2;

      const join3 = waitForMessage<WsOutgoingMessage>(ws3);
      sendWsMessage(ws3, { type: "JOIN_ROOM", deckId: "multi-deck" });
      await join3;

      const deck = storeMap.get("multi-deck");
      expect(deck).toBeDefined();
      expect(deck!.clients.size).toBeGreaterThanOrEqual(3);
    });

    test("clients in different rooms are isolated", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "room-a", 3);
      seedDeck(storeMap, "room-b", 3);
      const { server, wsUrl } = await startApp(app);

      const wsA = await connectWs(wsUrl);
      const wsB = await connectWs(wsUrl);

      cleanup = async () => {
        await closeWs(wsA);
        await closeWs(wsB);
        server.stop();
      };

      // Client A joins room-a
      const joinA = waitForMessage<WsOutgoingMessage>(wsA);
      sendWsMessage(wsA, { type: "JOIN_ROOM", deckId: "room-a" });
      await joinA;

      // Client B joins room-b
      const joinB = waitForMessage<WsOutgoingMessage>(wsB);
      sendWsMessage(wsB, { type: "JOIN_ROOM", deckId: "room-b" });
      await joinB;

      // Client A changes slide — Client B should not receive anything
      const changePromise = waitForMessage<WsOutgoingMessage>(wsA);
      sendWsMessage(wsA, {
        type: "SLIDE_CHANGE",
        deckId: "room-a",
        slideIndex: 1,
      });
      await changePromise;

      // Verify room-b's state is unchanged
      const deckB = storeMap.get("room-b");
      expect(deckB!.currentSlide).toBe(0);
    });
  });
});
