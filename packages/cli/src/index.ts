import { Effect, Layer } from "effect";
import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { createCommand } from "./commands/create";

const mainCommand = Command.make("mnestia").pipe(
  Command.withSubcommands([createCommand]),
);

const cli = Command.run(mainCommand, {
  name: "mnestia",
  version: "0.0.1",
});

BunRuntime.runMain(
  cli(process.argv).pipe(Effect.provide(BunContext.layer)),
);
