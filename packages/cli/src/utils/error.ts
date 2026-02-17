import { Effect, Schema, Match, Console } from "effect";
import type { PlatformError } from "@effect/platform/Error";
import kleur from "kleur";

export class CliError extends Schema.TaggedError<CliError>()("CliError", {
  message: Schema.String,
  title: Schema.optionalWith(Schema.String, { default: () => "Error" }),
  code: Schema.optional(Schema.String),
}) {}

export class FileSystemError extends Schema.TaggedError<FileSystemError>()(
  "FileSystemError",
  {
    path: Schema.String,
    message: Schema.String,
    operation: Schema.String,
    title: Schema.optionalWith(Schema.String, {
      default: () => "File System Error",
    }),
  },
) {}

export class ValidationError extends Schema.TaggedError<ValidationError>()(
  "ValidationError",
  {
    field: Schema.String,
    message: Schema.String,
    value: Schema.optional(Schema.String),
    title: Schema.optionalWith(Schema.String, {
      default: () => "Validation Error",
    }),
  },
) {}

export class ConfigError extends Schema.TaggedError<ConfigError>()(
  "ConfigError",
  {
    path: Schema.optional(Schema.String),
    message: Schema.String,
    title: Schema.optionalWith(Schema.String, {
      default: () => "Configuration Error",
    }),
  },
) {}

export class JsonParseError extends Schema.TaggedError<JsonParseError>()(
  "JsonParseError",
  {
    path: Schema.String,
    message: Schema.String,
    title: Schema.optionalWith(Schema.String, {
      default: () => "JSON Parse Error",
    }),
  },
) {}

export type CliErrors =
  | CliError
  | FileSystemError
  | ValidationError
  | ConfigError
  | JsonParseError
  | PlatformError;

const formatError = (error: CliErrors) =>
  Match.value(error).pipe(
    Match.tags({
      CliError: (err) => err.message,
      FileSystemError: (err) =>
        `${kleur.cyan(err.path)}\n  ${kleur.dim(err.message)}`,
      ValidationError: (err) =>
        `Field: ${kleur.cyan(err.field)}\n  ${kleur.dim(err.message)}`,
      ConfigError: (err) =>
        err.path
          ? `${kleur.cyan(err.path)}\n  ${kleur.dim(err.message)}`
          : err.message,
      JsonParseError: (err) =>
        `${kleur.cyan(err.path)}\n  ${kleur.dim(err.message)}`,
    }),
    Match.orElse((err) =>
      "message" in err ? String(err.message) : String(err),
    ),
  );

export const logErrors = <A, E extends CliErrors, R>(
  self: Effect.Effect<A, E, R>,
): Effect.Effect<A | void, never, R> =>
  Effect.catchAll(self, (error) =>
    Effect.gen(function* () {
      const details = formatError(error);
      const title = "title" in error ? error.title : "Error";

      yield* Console.log("");
      yield* Console.log(`  ${kleur.bold().red("✗")} ${kleur.bold(title)}`);
      yield* Console.log(`  ${details}`);
      yield* Console.log("");
    }),
  );
