import { Command, Options } from "@effect/cli";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";

export const buildCommand = Command.make(
  "build",
  {
    outDir: Options.text("out-dir").pipe(
      Options.withDefault("dist"),
      Options.withDescription("Output directory for static assets"),
    ),
    base: Options.text("base").pipe(
      Options.withDefault("/"),
      Options.withDescription("Base URL for the deployed site"),
    ),
  },
  ({ outDir, base }) =>
    Effect.gen(function* () {
      yield* Console.log(`Building static assets to ${outDir}`);
      yield* Console.log(`Base URL: ${base}`);
      yield* Console.log("(Not yet implemented)");
    }),
).pipe(Command.withDescription("Build slide deck into static assets"));
