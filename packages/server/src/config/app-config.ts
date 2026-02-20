import { Config, Effect, type Option } from "effect";
import { loadSentryConfig, type SentryConfig } from "./sentry-config";

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly piProvider: Option.Option<string>;
  readonly piModel: Option.Option<string>;
  readonly sentry: SentryConfig;
}

export const loadAppConfig = Effect.gen(function* () {
  const port = yield* Config.number("PORT").pipe(Config.withDefault(3000));
  const host = yield* Config.string("HOST").pipe(
    Config.withDefault("localhost")
  );
  const piProvider = yield* Config.option(
    Config.string("PI_PROVIDER")
  );
  const piModel = yield* Config.option(
    Config.string("PI_MODEL")
  );
  const sentry = yield* loadSentryConfig;

  return { port, host, piProvider, piModel, sentry } satisfies AppConfig;
});
