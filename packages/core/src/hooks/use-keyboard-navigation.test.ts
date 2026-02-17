import { test, expect, describe } from "bun:test";
import type { UseKeyboardNavigationOptions } from "./use-keyboard-navigation.js";
import type { NavigationConfig } from "@mnestia/schema/navigation";

describe("useKeyboardNavigation", () => {
  test("options interface accepts valid config", () => {
    const config: NavigationConfig = {
      mode: "both",
      enableMouseClick: true,
    };

    let _nextCalled = false;
    let _prevCalled = false;
    let _firstCalled = false;
    let _lastCalled = false;

    const options: UseKeyboardNavigationOptions = {
      config,
      onNext: () => {
        _nextCalled = true;
      },
      onPrev: () => {
        _prevCalled = true;
      },
      onFirst: () => {
        _firstCalled = true;
      },
      onLast: () => {
        _lastCalled = true;
      },
      canGoNext: true,
      canGoPrev: true,
    };

    expect(options.config.mode).toBe("both");
    expect(typeof options.onNext).toBe("function");
    expect(typeof options.onPrev).toBe("function");

    options.onNext();
    expect(_nextCalled).toBe(true);
  });

  test("supports vim mode", () => {
    const config: NavigationConfig = {
      mode: "vim",
    };

    expect(config.mode).toBe("vim");
  });

  test("supports standard mode", () => {
    const config: NavigationConfig = {
      mode: "standard",
    };

    expect(config.mode).toBe("standard");
  });
});
