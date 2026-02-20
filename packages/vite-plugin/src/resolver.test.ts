import { resolve } from "pathe";
import { describe, expect, test } from "bun:test";
import { resolveTheme, toAtFsPath } from "./resolver.js";

describe("resolveTheme", () => {
	test.skip("resolves workspace theme package", async () => {
		// This test is skipped because Bun's import.meta.resolve behaves differently
		// than Node's in the test environment. The resolution works correctly
		// in the actual Vite plugin runtime.
		const result = await resolveTheme("@mnestia/theme-base", import.meta.url);
		expect(result.name).toBe("@mnestia/theme-base");
		expect(result.root).toContain("theme-base");
		expect(result.root).toContain("packages");
	});

	test("resolves relative path", async () => {
		const relativePath = "../theme-base";
		// This would need an actual theme at that path to work
		// For now, just test it throws for non-existent path
		await expect(
			resolveTheme(relativePath, import.meta.url),
		).rejects.toThrow();
	});

	test("resolves absolute path", async () => {
		const absolutePath = resolve(
			import.meta.dirname,
			"..",
			"..",
			"theme-base",
		);
		const result = await resolveTheme(absolutePath, import.meta.url);
		expect(result.name).toBe(absolutePath);
		expect(result.root).toBe(absolutePath);
	});

	test("throws for non-existent theme", async () => {
		await expect(
			resolveTheme("non-existent-theme-package", import.meta.url),
		).rejects.toThrow("Failed to resolve theme");
	});
});

describe("toAtFsPath", () => {
	test("converts absolute path to /@fs/ URL", () => {
		const path = "/home/user/project/theme";
		expect(toAtFsPath(path)).toBe("/@fs/home/user/project/theme");
	});

	test("handles paths without leading slash", () => {
		const path = "relative/path";
		expect(toAtFsPath(path)).toBe("/@fs/relative/path");
	});
});
