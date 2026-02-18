import { test, expect, describe } from "bun:test";
import { Effect, Layer } from "effect";
import {
  SimpleSpanProcessor,
  type SpanExporter,
  type ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import * as NodeSdk from "@effect/opentelemetry/NodeSdk";
import { SlideServiceLive, createSlideStoreLive } from "../../src/domain/slide-layer";
import { SlideService } from "../../src/domain/slide-service";
import type { DeckStateInternal } from "../../src/domain/slide-store";

// Custom exporter that preserves spans even after shutdown
// (InMemorySpanExporter clears spans on shutdown, which the
// NodeSdk layer finalizer triggers)
class CollectingSpanExporter implements SpanExporter {
  readonly spans: ReadableSpan[] = [];

  export(
    spans: ReadableSpan[],
    resultCallback: (result: { code: number }) => void
  ): void {
    this.spans.push(...spans);
    resultCallback({ code: 0 });
  }

  shutdown(): Promise<void> {
    // Intentionally do NOT clear spans so tests can inspect them
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}

function createTracedTestRuntime(exporter: CollectingSpanExporter) {
  const storeMap = new Map<string, DeckStateInternal>();
  const storeLayer = createSlideStoreLive(storeMap);
  const serviceLayer = SlideServiceLive.pipe(Layer.provide(storeLayer));

  const tracingLayer = NodeSdk.layer(() => ({
    resource: {
      serviceName: "@mnestia/server-test",
      serviceVersion: "0.0.1",
    },
    spanProcessor: new SimpleSpanProcessor(exporter),
  }));

  const fullLayer = Layer.merge(serviceLayer, tracingLayer);

  return { storeMap, fullLayer };
}

describe("tracing integration", () => {
  test("SlideService.getOrCreateDeck generates spans", async () => {
    const exporter = new CollectingSpanExporter();
    const { fullLayer } = createTracedTestRuntime(exporter);

    await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* SlideService;
        yield* service.getOrCreateDeck("traced-deck");
      }).pipe(
        Effect.withSpan("test.getOrCreateDeck"),
        Effect.provide(fullLayer)
      )
    );

    expect(exporter.spans.length).toBeGreaterThanOrEqual(1);

    const spanNames = exporter.spans.map((s) => s.name);
    expect(spanNames).toContain("test.getOrCreateDeck");
  });

  test("SlideService.addSlide generates child spans under parent", async () => {
    const exporter = new CollectingSpanExporter();
    const { storeMap, fullLayer } = createTracedTestRuntime(exporter);

    // Seed a deck first
    storeMap.set("span-deck", {
      currentSlide: 0,
      slides: [],
      clients: new Map(),
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* SlideService;
        yield* service.addSlide("span-deck", {
          content: "Traced slide",
          layout: "default",
        });
      }).pipe(
        Effect.withSpan("test.addSlide"),
        Effect.provide(fullLayer)
      )
    );

    expect(exporter.spans.length).toBeGreaterThanOrEqual(1);

    const spanNames = exporter.spans.map((s) => s.name);
    expect(spanNames).toContain("test.addSlide");
  });

  test("multiple operations produce multiple spans with correct parent-child", async () => {
    const exporter = new CollectingSpanExporter();
    const { fullLayer } = createTracedTestRuntime(exporter);

    await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* SlideService;
        yield* service.getOrCreateDeck("multi-deck");
        yield* service.addSlide("multi-deck", {
          content: "Slide 1",
          layout: "default",
        });
        yield* service.addSlide("multi-deck", {
          content: "Slide 2",
          layout: "default",
        });
      }).pipe(
        Effect.withSpan("test.multiOps"),
        Effect.provide(fullLayer)
      )
    );

    // Should have at least the parent span + domain operation spans
    expect(exporter.spans.length).toBeGreaterThanOrEqual(2);

    const rootSpan = exporter.spans.find((s) => s.name === "test.multiOps");
    expect(rootSpan).toBeDefined();

    // All other spans should share the same traceId as the root
    const traceId = rootSpan!.spanContext().traceId;
    for (const span of exporter.spans) {
      expect(span.spanContext().traceId).toBe(traceId);
    }
  });

  test("Effect.withSpan annotations appear on spans", async () => {
    const exporter = new CollectingSpanExporter();
    const { fullLayer } = createTracedTestRuntime(exporter);

    await Effect.runPromise(
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan("deck.id", "annotated-deck");
        yield* Effect.annotateCurrentSpan("ws.event_type", "JOIN_ROOM");
        const service = yield* SlideService;
        yield* service.getOrCreateDeck("annotated-deck");
      }).pipe(
        Effect.withSpan("test.annotated"),
        Effect.provide(fullLayer)
      )
    );

    const annotatedSpan = exporter.spans.find((s) => s.name === "test.annotated");

    expect(annotatedSpan).toBeDefined();
    expect(annotatedSpan!.attributes["deck.id"]).toBe("annotated-deck");
    expect(annotatedSpan!.attributes["ws.event_type"]).toBe("JOIN_ROOM");
  });

  test("failed operations still produce spans", async () => {
    const exporter = new CollectingSpanExporter();
    const { fullLayer } = createTracedTestRuntime(exporter);

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const service = yield* SlideService;
        // getDeck on a non-existent deck should fail
        yield* service.getDeck("nonexistent");
      }).pipe(
        Effect.withSpan("test.failedOp"),
        Effect.provide(fullLayer)
      )
    );

    // The effect should have failed
    expect(exit._tag).toBe("Failure");

    expect(exporter.spans.length).toBeGreaterThanOrEqual(1);

    const spanNames = exporter.spans.map((s) => s.name);
    expect(spanNames).toContain("test.failedOp");
  });
});
