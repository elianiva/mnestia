import { test, expect, describe } from "bun:test";
import { ThemeService } from "./theme-service.js";

describe("theme-service", () => {
  test("ThemeService is defined", () => {
    expect(ThemeService).toBeDefined();
  });

  test("ThemeService has required methods", () => {
    expect(typeof ThemeService.resolveTheme).toBe("function");
    expect(typeof ThemeService.clearCache).toBe("function");
  });
});
