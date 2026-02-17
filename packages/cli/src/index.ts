import { CliConfig, Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Logger } from "effect";
import { buildCommand } from "./commands/build";
import { createCommand } from "./commands/create";
import { startCommand } from "./commands/start";
import { VERSION } from "./version";

const command = Command.make("mnestia").pipe(
  Command.withDescription("CLI tool for Mnestia slide deck framework."),
  Command.withSubcommands([createCommand, startCommand, buildCommand]),
);

const ConfigLive = CliConfig.layer({
  showBuiltIns: false,
});

const cli = Command.run(command, {
  name: "mnestia",
  version: VERSION,
});

const AppLayer = Layer.merge(ConfigLive, BunContext.layer).pipe(
  Layer.provide(Logger.remove(Logger.defaultLogger)),
);

const program = Effect.suspend(() => cli(process.argv)).pipe(
  Effect.provide(AppLayer),
);

BunRuntime.runMain(program);
