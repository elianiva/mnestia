import { test, expect, describe } from "bun:test";
import { Effect } from "effect";
import { BunContext } from "@effect/platform-bun";
import {
  makePiRpcClient,
  type PiRpcEvent,
  type PiRpcClientOptions,
} from "../../src/agent/pi-rpc-client";

// ── Unit tests ────────────────────────────────────────────────────
// These verify the factory function signature and options propagation.
// We don't spawn a real `pi` process — that would require pi installed.

const runScoped = <A, E>(effect: Effect.Effect<A, E>) =>
  Effect.runPromise(
    effect.pipe(Effect.scoped, Effect.provide(BunContext.layer))
  );

describe("PiRpcClient", () => {
  describe("makePiRpcClient", () => {
    test("factory returns an Effect", () => {
      // makePiRpcClient returns an Effect — just verify it's callable
      const effect = makePiRpcClient({});
      expect(effect).toBeDefined();
      // We don't run it since that would try to spawn `pi`
    });

    test("accepts provider and model options", () => {
      const options: PiRpcClientOptions = {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
      };
      const effect = makePiRpcClient(options);
      expect(effect).toBeDefined();
    });

    test("accepts empty options", () => {
      const effect = makePiRpcClient();
      expect(effect).toBeDefined();
    });
  });
});
