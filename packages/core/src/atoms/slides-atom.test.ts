import { test, expect, describe } from "bun:test";
import { slidesAtom } from "./slides-atom.js";

describe("slides-atom", () => {
  test("slidesAtom is exported", () => {
    expect(slidesAtom).toBeDefined();
  });
});
