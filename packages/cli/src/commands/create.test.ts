import { describe, test, expect } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { NodeContext } from "@effect/platform-node";
import { TemplateService } from "./create";
import { ValidationError } from "../utils/error";

const TestLayer = TemplateService.Default.pipe(
  Layer.provide(NodeContext.layer),
);

describe("TemplateService", () => {
  test("should accept valid project names", async () => {
    const validNames = ["my-deck", "my_deck", "myDeck", "mydeck123"];

    for (const name of validNames) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right).toBe(name);
      }
    }
  });

  test("should reject invalid project names", async () => {
    const invalidNames = ["", "my deck", "my@deck"];

    for (const name of invalidNames) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
      }
    }
  });

  test("should reject path traversal attempts", async () => {
    const maliciousNames = [
      "../etc/passwd",
      "..\\\\windows\\\\system32",
      "../../evil",
      "~/.bashrc",
      "/etc/passwd",
    ];

    for (const name of maliciousNames) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect((result.left as ValidationError).message).toContain(
          "Path traversal",
        );
      }
    }
  });

  test("should allow '.' as project name", async () => {
    const result = await Effect.runPromise(
      Effect.either(TemplateService.validateProjectName(".")).pipe(
        Effect.provide(TestLayer),
      ),
    );

    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toBe(".");
    }
  });
});

describe("Path validation patterns", () => {
  test("should detect path traversal characters", () => {
    // This matches the pattern from create.ts
    const traversalPattern = /\.\.|^[\/\\]|^~|^\$/;

    expect("../etc".match(traversalPattern)).toBeTruthy();
    expect("..\\windows".match(traversalPattern)).toBeTruthy();
    expect("../../evil".match(traversalPattern)).toBeTruthy();
    expect("/etc/passwd".match(traversalPattern)).toBeTruthy();
    expect("~/home".match(traversalPattern)).toBeTruthy();
    expect("$HOME".match(traversalPattern)).toBeTruthy();
  });

  test("should accept safe project names", () => {
    const traversalPattern = /\.\.|^[\/\\]|^~|^\$/;

    expect("my-deck".match(traversalPattern)).toBeFalsy();
    expect("my_deck".match(traversalPattern)).toBeFalsy();
    expect("MyDeck".match(traversalPattern)).toBeFalsy();
    expect("deck123".match(traversalPattern)).toBeFalsy();
  });
});
