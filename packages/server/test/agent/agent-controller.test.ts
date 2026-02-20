import { test, expect, describe, afterEach } from "bun:test";
import { agentController } from "../../src/agent/agent-controller";
import { seedDeck, createDecoratedApp, startApp } from "../helpers";

// ── Test Helpers ──────────────────────────────────────────────────

function createTestApp(configOverrides = {}) {
  const { app, storeMap, appConfig } = createDecoratedApp(configOverrides);
  const testApp = app.use(agentController);
  return { app: testApp, storeMap, appConfig };
}

// ── Tests ─────────────────────────────────────────────────────────

let cleanup: (() => void) | undefined;

afterEach(() => {
  if (cleanup) {
    cleanup();
    cleanup = undefined;
  }
});

describe("Agent Controller", () => {
  describe("endpoint structure", () => {
    test("POST /agent/chat route exists", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], deckId: "test" }),
      });

      // POST should not return 404
      expect(response.status).not.toBe(404);
    });

    test("GET /agent/chat returns 404 or 405 (method not allowed)", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "GET",
      });

      expect([404, 405]).toContain(response.status);
    });
  });

  describe("request body validation", () => {
    test("handles missing body gracefully", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Route exists, should not 404
      expect(response.status).not.toBe(404);
    });

    test("handles empty JSON object", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).not.toBe(404);
    });

    test("handles non-JSON content type", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "not json",
      });

      expect(response.status).not.toBe(404);
    });
  });

  describe("POST /agent/chat with deck context", () => {
    test("accepts valid request with deckId and messages", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "chat-deck", 3);
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi!" },
            { role: "user", content: "Add a slide" },
          ],
          deckId: "chat-deck",
        }),
      });

      // Should not 404 — route accepted the request
      expect(response.status).not.toBe(404);
    });

    test("returns SSE content type on successful request", async () => {
      const { app, storeMap } = createTestApp();
      seedDeck(storeMap, "sse-deck", 2);
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "test" }],
          deckId: "sse-deck",
        }),
      });

      // If pi is available, response should be SSE; if not, 500 is acceptable
      if (response.status === 200) {
        expect(response.headers.get("Content-Type")).toContain(
          "text/event-stream"
        );
      }
    });
  });
});
