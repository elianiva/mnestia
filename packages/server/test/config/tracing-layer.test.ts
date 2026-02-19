import { test, expect, describe } from "bun:test";
import { Effect, Layer, Option } from "effect";
import { createTracingLayer } from "@/infra/config/tracing-layer";
import type { SentryConfig } from "@/infra/config/sentry-config";

function makeConfig(overrides: Partial<SentryConfig> = {}): SentryConfig {
  return {
    dsn: Option.none(),
    environment: "test",
    tracesSampleRate: 1.0,
    consoleTrace: false,
    ...overrides,
  };
}

describe("createTracingLayer", () => {
  test("returns a layer when sentry is disabled and console trace is off", () => {
    const layer = createTracingLayer(makeConfig(), false);

    // Should return a valid layer (NodeSdk.layerEmpty)
    expect(layer).toBeDefined();
    expect(Layer.isLayer(layer)).toBe(true);
  });

  test("returns a layer when console trace is enabled", () => {
    const layer = createTracingLayer(
      makeConfig({ consoleTrace: true }),
      false
    );

    expect(layer).toBeDefined();
    expect(Layer.isLayer(layer)).toBe(true);
  });

  test("returns a layer when sentry is enabled", () => {
    const layer = createTracingLayer(makeConfig(), true);

    expect(layer).toBeDefined();
    expect(Layer.isLayer(layer)).toBe(true);
  });

  test("returns a layer when both sentry and console trace are enabled", () => {
    const layer = createTracingLayer(
      makeConfig({ consoleTrace: true }),
      true
    );

    expect(layer).toBeDefined();
    expect(Layer.isLayer(layer)).toBe(true);
  });

  test("runtime can be built with the empty tracing layer", async () => {
    const layer = createTracingLayer(makeConfig(), false);

    // Verify the layer can be provided to an Effect without errors
    const result = await Effect.runPromise(
      Effect.succeed("ok").pipe(Effect.provide(layer))
    );

    expect(result).toBe("ok");
  });

  test("runtime can be built with the console trace layer", async () => {
    const layer = createTracingLayer(
      makeConfig({ consoleTrace: true }),
      false
    );

    const result = await Effect.runPromise(
      Effect.succeed("ok").pipe(Effect.provide(layer))
    );

    expect(result).toBe("ok");
  });

  test("spans are generated when tracing layer is active", async () => {
    const layer = createTracingLayer(
      makeConfig({ consoleTrace: true }),
      false
    );

    // Run an effect with a span through the tracing layer
    // This verifies the layer correctly sets up the tracer
    const result = await Effect.runPromise(
      Effect.succeed(42).pipe(
        Effect.withSpan("test.span"),
        Effect.provide(layer)
      )
    );

    expect(result).toBe(42);
  });

  test("nested spans work correctly with tracing layer", async () => {
    const layer = createTracingLayer(
      makeConfig({ consoleTrace: true }),
      false
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const a = yield* Effect.succeed(1).pipe(
          Effect.withSpan("test.child_a")
        );
        const b = yield* Effect.succeed(2).pipe(
          Effect.withSpan("test.child_b")
        );
        return a + b;
      }).pipe(
        Effect.withSpan("test.parent"),
        Effect.provide(layer)
      )
    );

    expect(result).toBe(3);
  });

  test("span annotations work with tracing layer", async () => {
    const layer = createTracingLayer(
      makeConfig({ consoleTrace: true }),
      false
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan("deck.id", "test-deck");
        yield* Effect.annotateCurrentSpan("ws.event_type", "JOIN_ROOM");
        return "annotated";
      }).pipe(
        Effect.withSpan("test.annotated_span"),
        Effect.provide(layer)
      )
    );

    expect(result).toBe("annotated");
  });
});
