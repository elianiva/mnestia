import { test, expect, describe } from "bun:test";
import type { UseKeyboardNavigationOptions } from "./use-keyboard-navigation.js";
import type { NavigationConfig } from "@mnestia/schema";

describe("useKeyboardNavigation", () => {
	test("options interface accepts valid config", () => {
		const config: NavigationConfig = {
			mode: "both",
			enableMouseClick: true,
		};

		let nextCalled = false;
		let prevCalled = false;
		let firstCalled = false;
		let lastCalled = false;

		const options: UseKeyboardNavigationOptions = {
			config,
			onNext: () => {
				nextCalled = true;
			},
			onPrev: () => {
				prevCalled = true;
			},
			onFirst: () => {
				firstCalled = true;
			},
			onLast: () => {
				lastCalled = true;
			},
			canGoNext: true,
			canGoPrev: true,
		};

		expect(options.config.mode).toBe("both");
		expect(typeof options.onNext).toBe("function");
		expect(typeof options.onPrev).toBe("function");

		options.onNext();
		expect(nextCalled).toBe(true);
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
