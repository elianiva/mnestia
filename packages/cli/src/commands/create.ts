import { Effect, Schema, Option } from "effect";
import { Command, Args, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import kleur from "kleur";
import * as path from "node:path";
import prompts from "prompts";

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

export class DirectoryNotEmptyError extends Schema.TaggedError<DirectoryNotEmptyError>()(
  "DirectoryNotEmptyError",
  {
    path: Schema.String,
    message: Schema.String,
  },
) {}

export class InvalidProjectNameError extends Schema.TaggedError<InvalidProjectNameError>()(
  "InvalidProjectNameError",
  {
    name: Schema.String,
    message: Schema.String,
  },
) {}

// Validation helpers
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

function isValidProjectName(name: string): boolean {
  return PROJECT_NAME_REGEX.test(name) && name.length > 0;
}

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
            Effect.mapError(
              (e) =>
                new FileCopyError({
                  source: "memory",
                  destination: targetPath,
                  message: e.message,
                }),
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

      const validateProjectName = Effect.fn(
        "TemplateService.validateProjectName",
      )(function* (projectName: string) {
        if (!isValidProjectName(projectName)) {
          return yield* new InvalidProjectNameError({
            name: projectName,
            message: `Project name "${projectName}" contains invalid characters. Use only letters, numbers, hyphens, and underscores.`,
          });
        }
        return projectName;
      });

      const validateTargetDirectory = Effect.fn(
        "TemplateService.validateTargetDirectory",
      )(function* (projectName: string, force: boolean) {
        const targetDir =
          projectName === "." ? cwd : path.join(cwd, projectName);

        const dirExists = yield* fs.exists(targetDir);
        if (dirExists) {
          const entries = yield* fs.readDirectory(targetDir);
          if (entries.length > 0 && !force) {
            return yield* new DirectoryNotEmptyError({
              path: targetDir,
              message: `Directory "${targetDir}" is not empty. Use --force to override.`,
            });
          }
        }

        return targetDir;
      });

      const scaffold = Effect.fn("TemplateService.scaffold")(function* (
        projectName: string,
        force = false,
      ) {
        yield* validateProjectName(projectName);
        const targetDir = yield* validateTargetDirectory(projectName, force);

        if (projectName !== ".") {
          yield* fs.makeDirectory(targetDir, { recursive: true }).pipe(
            Effect.mapError(
              (e) =>
                new DirectoryCreateError({
                  path: targetDir,
                  message: e.message,
                }),
            ),
          );
        }

        const entries = yield* fs.readDirectory(templateDir);
        const filesToCopy = entries.filter((f) => f !== "package.json");

        for (const file of filesToCopy) {
          yield* copyFile(file, targetDir);
        }

        const pkgPath = path.join(templateDir, "package.json");
        const pkgContent = yield* fs.readFileString(pkgPath);
        const pkg = JSON.parse(pkgContent);
        pkg.name = projectName === "." ? path.basename(cwd) : projectName;

        yield* copyFile(
          "package.json",
          targetDir,
          JSON.stringify(pkg, null, 2),
        );

        return targetDir;
      });

      return { scaffold, validateProjectName };
    }),
  },
) {}

interface PromptResponse {
  projectName?: string;
}

// Wizard mode - interactive prompt for project name
function runWizard(): Effect.Effect<string, never, FileSystem.FileSystem> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const cwd = process.cwd();

    while (true) {
      const response: PromptResponse = yield* Effect.tryPromise({
        try: () =>
          prompts({
            type: "text",
            name: "projectName",
            message: "Project name",
            validate: (value: string) => {
              if (!value || value.trim().length === 0) {
                return "Project name is required";
              }
              if (!isValidProjectName(value.trim())) {
                return "Use only letters, numbers, hyphens, and underscores";
              }
              return true;
            },
          }),
        catch: () => ({ projectName: "" }),
      }).pipe(Effect.orDie);

      const projectName = response.projectName?.trim() || "";

      if (!projectName) {
        yield* Effect.logError(kleur.red("  ✗ Project name is required"));
        continue;
      }

      // Check if directory already exists
      const targetDir = path.join(cwd, projectName);
      const dirExists = yield* fs
        .exists(targetDir)
        .pipe(Effect.catchAll(() => Effect.succeed(false)));

      if (dirExists) {
        const entries = yield* fs
          .readDirectory(targetDir)
          .pipe(Effect.catchAll(() => Effect.succeed([] as string[])));
        if (entries.length > 0) {
          yield* Effect.logError(
            kleur.red(
              `  ✗ Directory "${projectName}" already exists and is not empty`,
            ),
          );
          continue;
        }
      }

      return projectName;
    }
  });
}

export const createCommand = Command.make(
  "create",
  {
    name: Args.optional(Args.text({ name: "name" })).pipe(
      Args.withDescription(
        "Name of the new slide deck project (use '.' for current directory)",
      ),
    ),
    force: Options.boolean("force").pipe(
      Options.withDefault(false),
      Options.withDescription("Force creation even if directory is not empty"),
    ),
  },
  ({ name, force }) =>
    Effect.gen(function* () {
      let projectName: string;

      if (Option.isNone(name)) {
        // Wizard mode
        yield* Effect.log(
          kleur.bold().cyan("● ") +
            kleur.bold().magenta("■ ") +
            kleur.bold().yellow("▲ "),
        );
        yield* Effect.log(
          kleur.bold("  mnestia ") + kleur.dim("Creator") + "  v0.0.1",
        );
        yield* Effect.log("");
        projectName = yield* runWizard();
      } else {
        projectName = name.value;
      }

      const targetDir = yield* TemplateService.scaffold(projectName, force);

      yield* Effect.log(
        kleur.bold().cyan("● ") +
          kleur.bold().magenta("■ ") +
          kleur.bold().yellow("▲ "),
      );
      yield* Effect.log(
        kleur.bold("  mnestia ") + kleur.dim("Creator") + "  v0.0.1",
      );
      yield* Effect.log(
        kleur.dim("  Scaffolding project in ") +
          (projectName === "." ? "current directory" : projectName) +
          kleur.dim(" ..."),
      );
      yield* Effect.log(kleur.green("  ✓ Done."));
      yield* Effect.log(kleur.dim("  Next steps:"));
      if (projectName !== ".") {
        yield* Effect.log(kleur.cyan(`    cd ${path.basename(targetDir)}`));
      }
      yield* Effect.log(kleur.cyan("    bun install"));
      yield* Effect.log(kleur.cyan("    bun run dev"));
      yield* Effect.log(
        kleur.bold().cyan("● ") +
          kleur.bold().magenta("■l") +
          kleur.bold().yellow("▲ "),
      );
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
        DirectoryNotEmptyError: (err) =>
          Effect.gen(function* () {
            yield* Effect.logError("");
            yield* Effect.logError(
              kleur.red(`  ✗ Directory is not empty: ${err.path}`),
            );
            yield* Effect.logError(kleur.dim(`    ${err.message}`));
            yield* Effect.logError("");
            return yield* err;
          }),
        InvalidProjectNameError: (err) =>
          Effect.gen(function* () {
            yield* Effect.logError("");
            yield* Effect.logError(
              kleur.red(`  ✗ Invalid project name: ${err.name}`),
            );
            yield* Effect.logError(kleur.dim(`    ${err.message}`));
            yield* Effect.logError("");
            return yield* err;
          }),
      }),
    ),
).pipe(Command.withDescription("Create a new slide deck project"));
