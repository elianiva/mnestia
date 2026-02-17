import { Effect, Schema } from "effect";
import { Command, Args } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import kleur from "kleur";
import * as path from "node:path";

// Error definitions
export class DirectoryCreateError extends Schema.TaggedError<DirectoryCreateError>()(
  "DirectoryCreateError",
  {
    path: Schema.String,
    message: Schema.String,
  },
) {}

export class FileCopyError extends Schema.TaggedError<FileCopyError>()(
  "FileCopyError",
  {
    source: Schema.String,
    destination: Schema.String,
    message: Schema.String,
  },
) {}

// Template service
export class TemplateService extends Effect.Service<TemplateService>()(
  "TemplateService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const cwd = process.cwd();

      const templateDir = path.join(
        import.meta.dirname,
        "..",
        "..",
        "template",
      );

      const renameFiles: Record<string, string> = {
        _gitignore: ".gitignore",
      };

      function copyDir(
        srcDir: string,
        destDir: string,
      ): Effect.Effect<void, DirectoryCreateError | FileCopyError> {
        return Effect.gen(function* () {
          yield* fs.makeDirectory(destDir, { recursive: true }).pipe(
            Effect.mapError(
              (err) =>
                new DirectoryCreateError({
                  path: destDir,
                  message: String(err),
                }),
            ),
          );

          const entries = yield* fs.readDirectory(srcDir).pipe(
            Effect.mapError(
              (err) =>
                new FileCopyError({
                  source: srcDir,
                  destination: destDir,
                  message: String(err),
                }),
            ),
          );

          for (const entry of entries) {
            const srcPath = path.join(srcDir, entry);
            const destPath = path.join(destDir, entry);
            const stat = yield* fs.stat(srcPath).pipe(
              Effect.mapError(
                (err) =>
                  new FileCopyError({
                    source: srcPath,
                    destination: destPath,
                    message: String(err),
                  }),
              ),
            );

            if (stat.type === "Directory") {
              yield* copyDir(srcPath, destPath);
            } else {
              yield* Effect.tryPromise({
                try: async () => {
                  await Bun.write(destPath, Bun.file(srcPath));
                },
                catch: (err) =>
                  new FileCopyError({
                    source: srcPath,
                    destination: destPath,
                    message: String(err),
                  }),
              });
            }
          }
        });
      }

      const copyFile = Effect.fn("TemplateService.copyFile")(function* (
        file: string,
        root: string,
        content?: string,
      ) {
        const targetPath = renameFiles[file]
          ? path.join(root, renameFiles[file])
          : path.join(root, file);
        const srcPath = path.join(templateDir, file);

        if (content) {
          yield* fs.writeFileString(targetPath, content).pipe(
            Effect.catchAll((err: unknown) =>
              Effect.fail(
                new FileCopyError({
                  source: "memory",
                  destination: targetPath,
                  message: String(err),
                }),
              ),
            ),
          );
        } else {
          const stat = yield* fs.stat(srcPath);
          if (stat.type === "Directory") {
            yield* copyDir(srcPath, targetPath);
          } else {
            yield* Effect.tryPromise({
              try: async () => {
                await Bun.write(targetPath, Bun.file(srcPath));
              },
              catch: (err) =>
                new FileCopyError({
                  source: srcPath,
                  destination: targetPath,
                  message: String(err),
                }),
            });
          }
        }
      });

      const scaffold = Effect.fn("TemplateService.scaffold")(function* (
        projectName: string,
      ) {
        const targetDir = path.join(cwd, projectName);

        yield* fs.makeDirectory(targetDir, { recursive: true }).pipe(
          Effect.catchAll((err: unknown) =>
            Effect.fail(
              new DirectoryCreateError({
                path: targetDir,
                message: String(err),
              }),
            ),
          ),
        );

        const entries = yield* fs.readDirectory(templateDir);
        const filesToCopy = entries.filter((f) => f !== "package.json");

        for (const file of filesToCopy) {
          yield* copyFile(file, targetDir);
        }

        const pkgPath = path.join(templateDir, "package.json");
        const pkgContent = yield* fs.readFileString(pkgPath);
        const pkg = JSON.parse(pkgContent);
        pkg.name = projectName;

        yield* copyFile(
          "package.json",
          targetDir,
          JSON.stringify(pkg, null, 2),
        );

        return targetDir;
      });

      return { scaffold };
    }),
  },
) {}

export const createCommand = Command.make(
  "create",
  {
    name: Args.text({ name: "name" }).pipe(
      Args.withDefault("my-slides"),
      Args.withDescription("Name of the new slide deck project"),
    ),
  },
  ({ name }) =>
    Effect.gen(function* () {
      const targetDir = yield* TemplateService.scaffold(name);

      yield* Effect.log("");
      yield* Effect.log(
        kleur.bold().cyan("●") +
          kleur.bold().magenta("■") +
          kleur.bold().yellow("▲"),
      );
      yield* Effect.log(
        kleur.bold("  mnestia ") + kleur.dim("Creator") + "  v0.0.1",
      );
      yield* Effect.log("");
      yield* Effect.log(
        kleur.dim("  Scaffolding project in ") + name + kleur.dim(" ..."),
      );
      yield* Effect.log("");
      yield* Effect.log(kleur.green("  ✓ Done."));
      yield* Effect.log("");
      yield* Effect.log(kleur.dim("  Next steps:"));
      yield* Effect.log("");
      yield* Effect.log(kleur.cyan(`    cd ${path.basename(targetDir)}`));
      yield* Effect.log(kleur.cyan("    bun install"));
      yield* Effect.log(kleur.cyan("    bun run dev"));
      yield* Effect.log("");
      yield* Effect.log(
        kleur.bold().cyan("●") +
          kleur.bold().magenta("■") +
          kleur.bold().yellow("▲"),
      );
      yield* Effect.log("");
    }).pipe(
      Effect.provide(TemplateService.Default),
      Effect.catchTags({
        DirectoryCreateError: (err) =>
          Effect.gen(function* () {
            yield* Effect.logError("");
            yield* Effect.logError(
              kleur.red(`  ✗ Failed to create directory: ${err.path}`),
            );
            yield* Effect.logError(kleur.dim(`    ${err.message}`));
            yield* Effect.logError("");
            return yield* err;
          }),
        FileCopyError: (err) =>
          Effect.gen(function* () {
            yield* Effect.logError("");
            yield* Effect.logError(
              kleur.red(`  ✗ Failed to copy file: ${err.source}`),
            );
            yield* Effect.logError(kleur.dim(`    ${err.message}`));
            yield* Effect.logError("");
            return yield* err;
          }),
      }),
    ),
).pipe(Command.withDescription("Create a new slide deck project"));
