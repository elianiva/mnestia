import { test, expect, describe } from "bun:test";
import { defineTheme } from "./define-theme.js";

describe("defineTheme", () => {
  test("creates theme with name", () => {
    const theme = defineTheme({ name: "my-theme" });
    expect(theme.name).toBe("my-theme");
  });

  test("accepts layouts and components", () => {
    const layout = () => null;
    const component = () => null;

    const theme = defineTheme({
      name: "full",
      layouts: { default: layout },
      components: { Button: component },
    });

    expect(theme.layouts.default).toBe(layout);
    expect(theme.components.Button).toBe(component);
  });
});
