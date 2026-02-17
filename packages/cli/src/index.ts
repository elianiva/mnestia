import { CliConfig, Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { buildCommand } from "./commands/build.js";
import { createCommand } from "./commands/create.js";
import { startCommand } from "./commands/start.js";

const command = Command.make("mnestia").pipe(
  Command.withDescription("CLI tool for Mnestia slide deck framework."),
  Command.withSubcommands([createCommand, startCommand, buildCommand]),
);

const ConfigLive = CliConfig.layer({
  showBuiltIns: false,
});

const cli = Command.run(command, {
  name: "mnestia",
  version: "0.0.1",
});

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.provide(Layer.merge(ConfigLive, BunContext.layer)),
  Effect.tapErrorCause(Effect.logError),
  BunRuntime.runMain,
);
