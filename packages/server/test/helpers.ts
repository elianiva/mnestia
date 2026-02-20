import { expect } from "bun:test";
import { Effect, Exit, Cause, Option, Layer, Context } from "effect";
import { Elysia, type AnyElysia } from "elysia";
import type { DeckStateInternal } from "../src/domain/slide-store";
import type { AppConfig } from "../src/config/app-config";
import type { SentryConfig } from "../src/config/sentry-config";
import { SlideService } from "../src/domain/slide-service";
import { createSlideRuntime } from "../src/ws/effect-runtime";

const DEFAULT_SENTRY_CONFIG: SentryConfig = {
  dsn: Option.none(),
  environment: "test",
  tracesSampleRate: 1.0,
  consoleTrace: false,
};

// ── Seed Helpers ──────────────────────────────────────────────────

export function seedDeck(
  storeMap: Map<string, DeckStateInternal>,
  deckId: string,
  slideCount: number,
  currentSlide = 0
): void {
  const slides = Array.from({ length: slideCount }, (_, i) => ({
    id: `slide-${i}`,
    index: i,
    content: `Content for slide ${i}`,
    layout: "default",
    notes: undefined,
  }));
  storeMap.set(deckId, {
    currentSlide,
    slides,
    clients: new Map(),
  });
}

// ── App Factories ─────────────────────────────────────────────────

export function createTestConfig(
  overrides: Partial<AppConfig> = {}
): AppConfig {
  return {
    port: 0,
    host: "localhost",
    piProvider: Option.none(),
    piModel: Option.none(),
    sentry: DEFAULT_SENTRY_CONFIG,
    ...overrides,
  };
}

export function createDecoratedApp(configOverrides: Partial<AppConfig> = {}) {
  const storeMap = new Map<string, DeckStateInternal>();
  const runtime = createSlideRuntime(storeMap, Layer.empty);
  const appConfig = createTestConfig(configOverrides);
  const app = new Elysia()
    .decorate("appConfig", appConfig)
    .decorate("slideStore", storeMap)
    .decorate("slideRuntime", runtime);

  return { app, storeMap, appConfig };
}

// ── Server Helpers ────────────────────────────────────────────────

export async function startApp(app: AnyElysia) {
  const server = app.listen(0);
  const port = server.server!.port;
  const baseUrl = `http://localhost:${port}`;
  const wsUrl = `ws://localhost:${port}`;
  return { server, port, baseUrl, wsUrl };
}

// ── WebSocket Helpers ─────────────────────────────────────────────

export function connectWs(wsUrl: string, path = "/ws/slides"): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}${path}`);
    ws.onopen = () => resolve(ws);
    ws.onerror = (e) => reject(e);
  });
}

export function closeWs(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    ws.onclose = () => resolve();
    ws.close();
  });
}

export function waitForMessage<T = unknown>(
  ws: WebSocket,
  timeout = 2000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Timed out waiting for WS message")),
      timeout
    );

    const handler = (event: MessageEvent) => {
      clearTimeout(timer);
      ws.removeEventListener("message", handler);
      resolve(JSON.parse(String(event.data)) as T);
    };

    ws.addEventListener("message", handler);
  });
}

export function sendWsMessage(ws: WebSocket, msg: unknown): void {
  ws.send(JSON.stringify(msg));
}

// ── Effect Assertion Helpers ──────────────────────────────────────

/**
 * Assert that an Exit is a success and return the value.
 * Throws a test assertion error if the exit is a failure.
 */
export function expectSuccess<A, E>(exit: Exit.Exit<A, E>): A {
  expect(Exit.isSuccess(exit)).toBe(true);
  if (!Exit.isSuccess(exit)) {
    throw new Error("Expected Exit.Success but got Exit.Failure");
  }
  return exit.value;
}

/**
 * Assert that an Exit is a failure with a specific error `_tag`.
 * Uses `Cause.failureOption` to extract the typed error and checks
 * its `_tag` field matches the expected tag string.
 */
export function expectFailureWithTag<E>(
  exit: Exit.Exit<unknown, E>,
  expectedTag: string
): void {
  expect(Exit.isFailure(exit)).toBe(true);
  if (!Exit.isFailure(exit)) {
    throw new Error(`Expected Exit.Failure with tag "${expectedTag}" but got Exit.Success`);
  }

  const failureOpt = Cause.failureOption(exit.cause);
  expect(Option.isSome(failureOpt)).toBe(true);

  if (Option.isSome(failureOpt)) {
    const error = failureOpt.value as { _tag: string };
    expect(error._tag).toBe(expectedTag);
  }
}

/**
 * Assert that an Exit is a failure (without checking the specific error tag).
 * Prefer `expectFailureWithTag` when you know the expected error type.
 */
export function expectFailure<E>(exit: Exit.Exit<unknown, E>): void {
  expect(Exit.isFailure(exit)).toBe(true);
}

// ── Effect Runner Helpers ─────────────────────────────────────────

/**
 * Run an Effect that requires SlideService, providing the given layer.
 * Reduces boilerplate of `Effect.gen(function* () { const service = yield* SlideService; ... })`.
 *
 * @example
 * ```ts
 * const exit = await runWithService(
 *   (svc) => svc.getDeck("deck-1"),
 *   layer
 * );
 * ```
 */
export function runWithService<A, E>(
  fn: (service: Context.Tag.Service<typeof SlideService>) => Effect.Effect<A, E, never>,
  layer: Layer.Layer<SlideService>
): Promise<Exit.Exit<A, E>> {
  return Effect.runPromiseExit(
    Effect.gen(function* () {
      const service = yield* SlideService;
      return yield* fn(service);
    }).pipe(Effect.provide(layer))
  );
}

/**
 * Run a raw Effect that requires SlideService, providing the given layer.
 * Use this when you need full control over the Effect pipeline.
 */
export function runEffect<A, E>(
  effect: Effect.Effect<A, E, SlideService>,
  layer: Layer.Layer<SlideService>
): Promise<Exit.Exit<A, E>> {
  return Effect.runPromiseExit(effect.pipe(Effect.provide(layer)));
}
