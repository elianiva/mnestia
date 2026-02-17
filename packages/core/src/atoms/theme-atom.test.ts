import { test, expect, describe } from "bun:test";
import { themeCacheAtom, setCachedTheme, getCachedTheme, clearThemeCache } from "./theme-atom.js";

describe("theme-atom", () => {
  test("themeCacheAtom is exported", () => {
    expect(themeCacheAtom).toBeDefined();
  });

  test("helper functions are exported", () => {
    expect(setCachedTheme).toBeDefined();
    expect(getCachedTheme).toBeDefined();
    expect(clearThemeCache).toBeDefined();
  });
});
