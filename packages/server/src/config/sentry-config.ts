import { Config, Effect, type Option, type Redacted } from "effect";

export interface SentryConfig {
  readonly dsn: Option.Option<Redacted.Redacted<string>>;
  readonly environment: string;
  readonly tracesSampleRate: number;
  readonly consoleTrace: boolean;
}

export const loadSentryConfig = Effect.gen(function* () {
  const dsn = yield* Config.option(
    Config.redacted(Config.string("SENTRY_DSN"))
  );
  const environment = yield* Config.string("SENTRY_ENVIRONMENT").pipe(
    Config.withDefault("dev")
  );
  const tracesSampleRate = yield* Config.number(
    "SENTRY_TRACES_SAMPLE_RATE"
  ).pipe(Config.withDefault(1.0));
  const consoleTrace = yield* Config.boolean("OTEL_CONSOLE_TRACE").pipe(
    Config.withDefault(false)
  );

  return { dsn, environment, tracesSampleRate, consoleTrace } as SentryConfig;
});
