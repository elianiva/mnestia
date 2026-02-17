import { readFileSync } from "node:fs";
import { join } from "node:path";

function getVersion(): string {
  try {
    const packageJsonPath = join(import.meta.dirname, "..", "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const VERSION = getVersion();
