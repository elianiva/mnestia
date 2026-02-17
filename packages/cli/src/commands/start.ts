import { Command, Options } from "@effect/cli";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";

export const startCommand = Command.make(
  "start",
  {
    port: Options.integer("port").pipe(
      Options.withDefault(3000),
      Options.withDescription("Port to run the dev server on"),
    ),
    host: Options.text("host").pipe(
      Options.withDefault("localhost"),
      Options.withDescription("Host to bind the dev server to"),
    ),
  },
  ({ port, host }) =>
    Effect.gen(function* () {
      yield* Console.log(`Starting dev server on http://${host}:${port}`);
      yield* Console.log("(Not yet implemented)");
    }),
).pipe(Command.withDescription("Start the development server"));
