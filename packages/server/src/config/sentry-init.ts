import * as Sentry from "@sentry/bun";
import { Effect, Option, Redacted } from "effect";
import type { SentryConfig } from "./sentry-config";

export function initSentry(
  config: SentryConfig
): Effect.Effect<boolean> {
  return Option.match(config.dsn, {
    onNone: () =>
      Effect.gen(function* () {
        yield* Effect.log("[sentry] No SENTRY_DSN set — tracing disabled");
        return false;
      }),
    onSome: (redactedDsn) =>
      Effect.gen(function* () {
        yield* Effect.sync(() => {
          Sentry.init({
            dsn: Redacted.value(redactedDsn),
            environment: config.environment,
            tracesSampleRate: config.tracesSampleRate,
            sendDefaultPii: true,
            // Let Effect/OpenTelemetry manage tracing, not Sentry auto-instrumentation
            skipOpenTelemetrySetup: true,
          });
        });

        yield* Effect.log("[sentry] Initialized");
        return true;
      }),
  });
}

export { Sentry };
