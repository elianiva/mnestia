import { test, expect, describe } from "bun:test";
import { createClicksAtom, createClicksAtomFamily, clicksAtomFamily } from "./clicks-atom.js";

describe("clicks-atom", () => {
  test("createClicksAtom returns an atom", () => {
    const atom = createClicksAtom(5);
    expect(atom).toBeDefined();
  });

  test("atom family returns same atom for same key", () => {
    const family = createClicksAtomFamily();
    expect(family(0)).toBe(family(0));
    expect(family(0)).not.toBe(family(1));
  });

  test("clicksAtomFamily is exported", () => {
    expect(clicksAtomFamily).toBeDefined();
    expect(typeof clicksAtomFamily).toBe("function");
  });
});
