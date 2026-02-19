import { test, expect, describe } from "bun:test";
import { ConfigProvider, Effect, Layer, Option, Redacted } from "effect";
import { loadSentryConfig } from "@/infra/config/sentry-config";

function runWithEnv(env: Record<string, string>) {
  const provider = ConfigProvider.fromMap(new Map(Object.entries(env)));
  return Effect.runPromise(
    loadSentryConfig.pipe(
      Effect.provide(Layer.setConfigProvider(provider))
    )
  );
}

describe("loadSentryConfig", () => {
  test("returns defaults when no env vars are set", async () => {
    const config = await runWithEnv({});

    expect(Option.isNone(config.dsn)).toBe(true);
    expect(config.environment).toBe("dev");
    expect(config.tracesSampleRate).toBe(1.0);
    expect(config.consoleTrace).toBe(false);
  });

  test("parses SENTRY_DSN as redacted Option.some", async () => {
    const dsn = "https://abc123@o0.ingest.sentry.io/123";
    const config = await runWithEnv({ SENTRY_DSN: dsn });

    expect(Option.isSome(config.dsn)).toBe(true);
    if (Option.isSome(config.dsn)) {
      expect(Redacted.value(config.dsn.value)).toBe(dsn);
    }
  });

  test("parses SENTRY_ENVIRONMENT", async () => {
    const config = await runWithEnv({ SENTRY_ENVIRONMENT: "production" });

    expect(config.environment).toBe("production");
  });

  test("parses SENTRY_TRACES_SAMPLE_RATE as number", async () => {
    const config = await runWithEnv({ SENTRY_TRACES_SAMPLE_RATE: "0.5" });

    expect(config.tracesSampleRate).toBe(0.5);
  });

  test("parses OTEL_CONSOLE_TRACE as boolean", async () => {
    const config = await runWithEnv({ OTEL_CONSOLE_TRACE: "true" });

    expect(config.consoleTrace).toBe(true);
  });

  test("parses all values together", async () => {
    const dsn = "https://key@sentry.io/42";
    const config = await runWithEnv({
      SENTRY_DSN: dsn,
      SENTRY_ENVIRONMENT: "staging",
      SENTRY_TRACES_SAMPLE_RATE: "0.25",
      OTEL_CONSOLE_TRACE: "true",
    });

    expect(Option.isSome(config.dsn)).toBe(true);
    if (Option.isSome(config.dsn)) {
      expect(Redacted.value(config.dsn.value)).toBe(dsn);
    }
    expect(config.environment).toBe("staging");
    expect(config.tracesSampleRate).toBe(0.25);
    expect(config.consoleTrace).toBe(true);
  });

  test("SENTRY_TRACES_SAMPLE_RATE defaults to 1.0 when not set", async () => {
    const config = await runWithEnv({ SENTRY_DSN: "https://x@sentry.io/1" });

    expect(config.tracesSampleRate).toBe(1.0);
  });

  test("SENTRY_ENVIRONMENT defaults to dev when not set", async () => {
    const config = await runWithEnv({ SENTRY_DSN: "https://x@sentry.io/1" });

    expect(config.environment).toBe("dev");
  });

  test("dsn is None when SENTRY_DSN is not set even with other values", async () => {
    const config = await runWithEnv({
      SENTRY_ENVIRONMENT: "production",
      SENTRY_TRACES_SAMPLE_RATE: "0.1",
    });

    expect(Option.isNone(config.dsn)).toBe(true);
  });
});
