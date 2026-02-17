import { Effect, Option } from "effect";
import { Command, Args, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import * as Console from "effect/Console";
import kleur from "kleur";
import * as path from "node:path";
import {
  FileSystemError,
  ValidationError,
  JsonParseError,
  logErrors,
} from "../utils/error";
import { VERSION } from "../version";

const PROJECT_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const PATH_TRAVERSAL_REGEX = /\.\.|^[\/\\]|^~|^\$/;

function isValidProjectName(name: string): boolean {
  return PROJECT_NAME_REGEX.test(name) && name.length > 0;
}

function hasPathTraversal(name: string): boolean {
  return PATH_TRAVERSAL_REGEX.test(name);
}

function copyFileEntry(
  fs: FileSystem.FileSystem,
  srcPath: string,
  destPath: string,
): Effect.Effect<void, FileSystemError, never> {
  return Effect.tryPromise({
    try: () => Bun.write(destPath, Bun.file(srcPath)),
    catch: () =>
      new FileSystemError({
        path: destPath,
        message: `Failed to copy file from ${srcPath}`,
        operation: "copyFile",
      }),
  });
}

function copyDirectoryRecursive(
  fs: FileSystem.FileSystem,
  srcDir: string,
  destDir: string,
): Effect.Effect<void, FileSystemError, never> {
  return Effect.gen(function* () {
    yield* fs.makeDirectory(destDir, { recursive: true }).pipe(
      Effect.mapError(
        (e) =>
          new FileSystemError({
            path: destDir,
            message: e.message,
            operation: "createDirectory",
          }),
      ),
    );

    const entries = yield* fs.readDirectory(srcDir).pipe(
      Effect.mapError(
        (e) =>
          new FileSystemError({
            path: srcDir,
            message: e.message,
            operation: "readDirectory",
          }),
      ),
    );

    const operations = entries.map((entry) => {
      const srcPath = path.join(srcDir, entry);
      const destPath = path.join(destDir, entry);
      return fs.stat(srcPath).pipe(
        Effect.andThen((stat) =>
          stat.type === "Directory"
            ? copyDirectoryRecursive(fs, srcPath, destPath)
            : copyFileEntry(fs, srcPath, destPath),
        ),
        Effect.mapError(() =>
          new FileSystemError({
            path: destPath,
            message: `Failed to process ${srcPath}`,
            operation: "copyFile",
          }),
        ),
      );
    });

    yield* Effect.all(operations, { concurrency: 10 });
  });
}

export class TemplateService extends Effect.Service<TemplateService>()(
  "TemplateService",
  {
    accessors: true,
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
                new FileSystemError({
                  path: targetPath,
                  message: e.message,
                  operation: "writeFile",
                }),
            ),
          );
        } else {
          const stat = yield* fs.stat(srcPath);
          if (stat.type === "Directory") {
            yield* copyDirectoryRecursive(fs, srcPath, targetPath);
          } else {
            yield* copyFileEntry(fs, srcPath, targetPath);
          }
        }
      });

      const validateProjectName = Effect.fn(
        "TemplateService.validateProjectName",
      )(function* (projectName: string) {
        if (projectName === ".") {
          return projectName;
        }

        if (hasPathTraversal(projectName)) {
          return yield* new ValidationError({
            field: "projectName",
            message: `Project name "${projectName}" contains invalid characters. Path traversal is not allowed.`,
            value: projectName,
          });
        }

        if (!isValidProjectName(projectName)) {
          return yield* new ValidationError({
            field: "projectName",
            message: `Project name "${projectName}" contains invalid characters. Use only letters, numbers, hyphens, and underscores.`,
            value: projectName,
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
            return yield* new FileSystemError({
              path: targetDir,
              message: `Directory is not empty. Use --force to override.`,
              operation: "validateDirectory",
            });
          }
        }

        return targetDir;
      });

      const parsePackageJson = Effect.fn("TemplateService.parsePackageJson")(
        function* (content: string, path: string) {
          return yield* Effect.try({
            try: () => JSON.parse(content) as Record<string, unknown>,
            catch: (error) =>
              new JsonParseError({
                path,
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to parse JSON",
              }),
          });
        },
      );

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
                new FileSystemError({
                  path: targetDir,
                  message: e.message,
                  operation: "createDirectory",
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
        const pkg = yield* parsePackageJson(pkgContent, pkgPath);
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

function runWizard(): Effect.Effect<string, never, FileSystem.FileSystem> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const cwd = process.cwd();

    while (true) {
      yield* Console.log(
        kleur.bold().cyan("?") + " Project name " + kleur.dim("(my-deck)"),
      );

      const response = yield* Effect.try({
        try: () => {
          const input = prompt("Project name: ");
          return input?.trim() ?? "";
        },
        catch: () => "",
      }).pipe(Effect.orDie);

      const projectName = response || "my-deck";

      if (!isValidProjectName(projectName)) {
        yield* Console.log(
          kleur.red("✗") +
            " Project name contains invalid characters. Use only letters, numbers, hyphens, and underscores.",
        );
        continue;
      }

      if (hasPathTraversal(projectName)) {
        yield* Console.log(
          kleur.red("✗") + " Path traversal is not allowed.",
        );
        continue;
      }

      const targetDir = path.join(cwd, projectName);
      const dirExists = yield* fs
        .exists(targetDir)
        .pipe(Effect.catchAll(() => Effect.succeed(false)));

      if (dirExists) {
        const entries = yield* fs
          .readDirectory(targetDir)
          .pipe(Effect.catchAll(() => Effect.succeed([] as string[])));
        if (entries.length > 0) {
          yield* Console.log(
            kleur.red(
              `✗ Directory "${projectName}" already exists and is not empty`,
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
        yield* Console.log(
          kleur.bold().cyan("● ") +
            kleur.bold().magenta("■ ") +
            kleur.bold().yellow("▲ "),
        );
        yield* Console.log(
          kleur.bold("  mnestia ") + kleur.dim("Creator") + `  v${VERSION}`,
        );
        yield* Console.log("");
        projectName = yield* runWizard();
      } else {
        projectName = name.value;
      }

      const targetDir = yield* TemplateService.scaffold(projectName, force);

      yield* Console.log(
        kleur.bold().cyan("● ") +
          kleur.bold().magenta("■ ") +
          kleur.bold().yellow("▲ "),
      );
      yield* Console.log(
        kleur.bold("  mnestia ") + kleur.dim("Creator") + `  v${VERSION}`,
      );
      yield* Console.log(
        kleur.dim("  Scaffolding project in ") +
          (projectName === "." ? "current directory" : projectName) +
          kleur.dim(" ..."),
      );
      yield* Console.log(kleur.green("  ✓ Done."));
      yield* Console.log(kleur.dim("  Next steps:"));
      if (projectName !== ".") {
        yield* Console.log(kleur.cyan(`    cd ${path.basename(targetDir)}`));
      }
      yield* Console.log(kleur.cyan("    bun install"));
      yield* Console.log(kleur.cyan("    bun run dev"));
      yield* Console.log(
        kleur.bold().cyan("● ") +
          kleur.bold().magenta("■l") +
          kleur.bold().yellow("▲ "),
      );
    }).pipe(
      Effect.provide(TemplateService.Default),
      logErrors,
    ),
).pipe(Command.withDescription("Create a new slide deck project"));
