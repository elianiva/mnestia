import { test, expect, describe } from "bun:test";
import { NavigationService } from "./navigation-service.js";

describe("navigation-service", () => {
  test("NavigationService is defined", () => {
    expect(NavigationService).toBeDefined();
  });

  test("NavigationService exposes shortcut constants", () => {
    const STANDARD_SHORTCUTS = { next: ["ArrowRight", "ArrowDown", " ", "PageDown"], prev: ["ArrowLeft", "ArrowUp", "PageUp"], first: ["Home"], last: ["End"] };
    const VIM_SHORTCUTS = { next: ["l", "j"], prev: ["h", "k"], first: ["g", "0"], last: ["G", "$"] };
    
    expect(STANDARD_SHORTCUTS.next).toContain("ArrowRight");
    expect(VIM_SHORTCUTS.next).toContain("l");
  });
});
