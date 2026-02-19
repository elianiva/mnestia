import { Config, Effect, type Option, type Redacted } from "effect";
import { loadSentryConfig, type SentryConfig } from "./sentry-config";

export const DEFAULT_AI_MODEL = "gpt-4o";

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly openaiApiKey: Option.Option<Redacted.Redacted<string>>;
  readonly aiModel: string;
  readonly sentry: SentryConfig;
}

export const loadAppConfig = Effect.gen(function* () {
  const port = yield* Config.number("PORT").pipe(Config.withDefault(3000));
  const host = yield* Config.string("HOST").pipe(
    Config.withDefault("localhost")
  );
  const openaiApiKey = yield* Config.option(
    Config.redacted(Config.string("OPENAI_API_KEY"))
  );
  const aiModel = yield* Config.string("AI_MODEL").pipe(
    Config.withDefault(DEFAULT_AI_MODEL)
  );
  const sentry = yield* loadSentryConfig;

  return { port, host, openaiApiKey, aiModel, sentry } satisfies AppConfig;
});
