import { Effect } from "effect";
import { Command, Args } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import type { PlatformError } from "@effect/platform/Error";
import * as path from "node:path";
import * as process from "node:process";

const renameFiles: Record<string, string> = {
  _gitignore: ".gitignore",
};

const createEffect = (projectName: string, targetDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const cwd = process.cwd();
    const root = path.join(cwd, targetDir);

    yield* Effect.log(`Creating project: ${projectName}`);

    // Create directory
    yield* fs.makeDirectory(root, { recursive: true });

    // Get template directory
    const templateDir = path.join(
      import.meta.dirname,
      "..",
      "..",
      "template",
    );

    // Copy directory recursively
    const copyDir = (srcDir: string, destDir: string) =>
      Effect.gen(function* () {
        yield* fs.makeDirectory(destDir, { recursive: true });
        const entries = yield* fs.readDirectory(srcDir);
        for (const entry of entries) {
          const srcPath = path.join(srcDir, entry);
          const destPath = path.join(destDir, entry);
          const stat = yield* fs.stat(srcPath);
          if (stat.type === "Directory") {
            yield* copyDir(srcPath, destPath);
          } else {
            yield* Effect.tryPromise(async () => {
              await Bun.write(destPath, Bun.file(srcPath));
            });
          }
        }
      });

    // Copy file helper
    const copyFile = (file: string, content?: string) =>
      Effect.gen(function* () {
        const targetPath = renameFiles[file]
          ? path.join(root, renameFiles[file])
          : path.join(root, file);

        if (content) {
          yield* fs.writeFileString(targetPath, content);
        } else {
          const srcPath = path.join(templateDir, file);
          const stat = yield* fs.stat(srcPath);
          if (stat.type === "Directory") {
            yield* copyDir(srcPath, targetPath);
          } else {
            yield* Effect.tryPromise(async () => {
              await Bun.write(targetPath, Bun.file(srcPath));
            });
          }
        }
      });

    // Copy template files (skip package.json initially)
    const entries = yield* fs.readDirectory(templateDir);
    for (const file of entries.filter((f: string) => f !== "package.json")) {
      yield* copyFile(file);
    }

    // Read and customize package.json
    const pkgPath = path.join(templateDir, "package.json");
    const pkgContent = yield* fs.readFileString(pkgPath);
    const pkg = JSON.parse(pkgContent);
    pkg.name = projectName;

    yield* copyFile("package.json", JSON.stringify(pkg, null, 2));

    yield* Effect.log(`✓ Created project in ${targetDir}`);
    yield* Effect.log("");
    yield* Effect.log("Next steps:");
    yield* Effect.log(`  cd ${targetDir}`);
    yield* Effect.log("  bun install");
    yield* Effect.log("  bun run dev");
  });

export const createCommand = Command.make(
  "create",
  {
    name: Args.text({ name: "name" }).pipe(Args.optional),
  },
  ({ name }) =>
    Effect.gen(function* () {
      const projectName = name.pipe(
        Effect.map((n) => n ?? "my-slides"),
        Effect.runSync,
      );
      yield* createEffect(projectName, projectName);
    }),
);
