import { test, expect, describe } from "bun:test";
import { Effect } from "effect";
import { slide } from "./slide.js";

describe("slide", () => {
  test("slide function returns an Effect", () => {
    const result = slide("./test.mdx");
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  test("returns SlideLoadError for invalid path", async () => {
    const program = slide("./non-existent-file-xyz123.tsx");
    
    try {
      await Effect.runPromise(program);
      expect(false).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
