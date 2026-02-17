import { Config, Effect, Option, Redacted } from "effect";

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly openaiApiKey: Option.Option<Redacted.Redacted<string>>;
}

export const loadAppConfig = Effect.gen(function* () {
  const port = yield* Config.number("PORT").pipe(Config.withDefault(3000));
  const host = yield* Config.string("HOST").pipe(
    Config.withDefault("localhost")
  );
  const openaiApiKey = yield* Config.option(
    Config.redacted(Config.string("OPENAI_API_KEY"))
  );

  return { port, host, openaiApiKey } satisfies AppConfig;
});
