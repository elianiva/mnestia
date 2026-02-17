import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { agentController } from "../../src/agent/agent-controller";
import { seedDeck, createDecoratedApp, startApp } from "../helpers";

// ── Test Helpers ──────────────────────────────────────────────────

function createTestApp() {
  const { app, storeMap } = createDecoratedApp();
  const testApp = app.use(agentController);
  return { app: testApp, storeMap };
}

// ── Tests ─────────────────────────────────────────────────────────

let cleanup: (() => void) | undefined;
let originalApiKey: string | undefined;

beforeEach(() => {
  originalApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  if (cleanup) {
    cleanup();
    cleanup = undefined;
  }
  if (originalApiKey !== undefined) {
    process.env.OPENAI_API_KEY = originalApiKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});

describe("Agent Controller", () => {
  describe("POST /agent/chat", () => {
    test("returns 503 when OPENAI_API_KEY is not set", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Add a title slide" }],
          deckId: "test-deck",
        }),
      });

      expect(response.status).toBe(503);

      const body = (await response.json()) as { error: string; message: string };
      expect(body.error).toBe("OPENAI_API_KEY not configured");
      expect(body.message).toContain("OPENAI_API_KEY");
    });

    test("accepts valid request body with multiple messages", async () => {
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
            { role: "assistant", content: "Hi there!" },
            { role: "user", content: "Add a slide" },
          ],
          deckId: "chat-deck",
        }),
      });

      // Should reach the API key check (503), not fail on body parsing (400/422)
      expect(response.status).toBe(503);
    });

    test("accepts request with empty messages array", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          deckId: "empty-deck",
        }),
      });

      // Should still reach API key check, not crash
      expect(response.status).toBe(503);
    });

    test("handles system messages without crashing", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are helpful" },
            { role: "user", content: "Add a slide" },
          ],
          deckId: "system-deck",
        }),
      });

      // Should reach API key check without crashing on system role
      expect(response.status).toBe(503);
    });

    test("handles request with only system messages", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "System prompt 1" },
            { role: "system", content: "System prompt 2" },
          ],
          deckId: "system-only-deck",
        }),
      });

      // Should not crash — system messages are filtered out
      expect(response.status).toBe(503);
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

      // Should not return 404 — the route exists
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

      // Route exists, should not 404
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

      // Should not crash the server
      expect(response.status).not.toBe(404);
    });
  });

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

      // GET should not be a valid route
      expect([404, 405]).toContain(response.status);
    });

    test("returns JSON content type on 503 response", async () => {
      const { app } = createTestApp();
      const { server, baseUrl } = await startApp(app);
      cleanup = () => server.stop();

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "hi" }],
          deckId: "test",
        }),
      });

      expect(response.status).toBe(503);
      expect(response.headers.get("Content-Type")).toContain("application/json");
    });
  });
});
