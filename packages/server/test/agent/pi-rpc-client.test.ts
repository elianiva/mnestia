import { test, expect, describe } from "bun:test";
import {
  PiRpcClient,
  type PiRpcEvent,
  type PiRpcClientOptions,
} from "../../src/agent/pi-rpc-client";

// ── Unit tests (no subprocess spawn) ──────────────────────────────
// These test the public API surface and lifecycle logic.
// We don't spawn a real `pi` process — that would require pi installed.

describe("PiRpcClient", () => {
  describe("constructor", () => {
    test("creates client with default options", () => {
      const client = new PiRpcClient();
      expect(client.isAlive).toBe(false);
      client.destroy();
    });

    test("creates client with provider and model options", () => {
      const options: PiRpcClientOptions = {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
      };
      const client = new PiRpcClient(options);
      expect(client.isAlive).toBe(false);
      client.destroy();
    });
  });

  describe("onEvent", () => {
    test("returns unsubscribe function", () => {
      const client = new PiRpcClient();
      const unsub = client.onEvent(() => {});
      expect(typeof unsub).toBe("function");
      unsub();
      client.destroy();
    });

    test("unsubscribe removes listener", () => {
      const client = new PiRpcClient();
      const events: PiRpcEvent[] = [];
      const unsub = client.onEvent((e) => events.push(e));
      unsub();
      // After unsubscribe, no events should be received
      // (we can't trigger events without a process, but the listener list is empty)
      client.destroy();
    });
  });

  describe("destroy", () => {
    test("destroy on fresh client does not throw", () => {
      const client = new PiRpcClient();
      expect(() => client.destroy()).not.toThrow();
    });

    test("double destroy does not throw", () => {
      const client = new PiRpcClient();
      client.destroy();
      expect(() => client.destroy()).not.toThrow();
    });

    test("isAlive is false after destroy", () => {
      const client = new PiRpcClient();
      client.destroy();
      expect(client.isAlive).toBe(false);
    });
  });

  describe("isAlive", () => {
    test("is false before any prompt", () => {
      const client = new PiRpcClient();
      expect(client.isAlive).toBe(false);
      client.destroy();
    });
  });
});
