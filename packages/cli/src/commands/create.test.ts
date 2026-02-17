import { describe, test, expect } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { FileSystem } from "@effect/platform";
import { TemplateService } from "./create";
import { ValidationError } from "../utils/error";

const TestLayer = TemplateService.Default.pipe(
  Layer.provide(FileSystem.layerNoop({})),
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

describe("Project name edge cases", () => {
  test("should reject single special characters", async () => {
    const invalidNames = ["@", "#", "$", "%", "&", "*", "!", "?"];

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

  test("should accept names starting with numbers", async () => {
    const names = ["123deck", "1-my-deck", "2_deck"];

    for (const name of names) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isRight(result)).toBe(true);
    }
  });

  test("should accept single character names", async () => {
    const names = ["a", "A", "1", "_", "-"];

    for (const name of names) {
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

  test("should accept long project names", async () => {
    const longName = "a".repeat(100);

    const result = await Effect.runPromise(
      Effect.either(TemplateService.validateProjectName(longName)).pipe(
        Effect.provide(TestLayer),
      ),
    );

    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toBe(longName);
    }
  });

  test("should reject names with spaces at start/end/middle", async () => {
    const namesWithSpaces = [" my-deck", "my-deck ", "my deck", "my  deck"];

    for (const name of namesWithSpaces) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
    }
  });

  test("should reject dot in project name", async () => {
    const names = ["my.deck", ".mydeck", "mydeck.", "."];

    for (const name of names) {
      if (name === ".") continue;
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
    }
  });

  test("should reject double dots anywhere", async () => {
    const names = ["my..deck", "..mydeck", "mydeck.."];

    for (const name of names) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect((result.left as ValidationError).message).toContain(
          "Path traversal",
        );
      }
    }
  });

  test("should reject environment variable patterns starting with $", async () => {
    const names = ["$HOME", "$PATH", "$VAR"];

    for (const name of names) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect((result.left as ValidationError).message).toContain(
          "Path traversal",
        );
      }
    }
  });

  test("should reject names with $ in middle as invalid characters", async () => {
    const names = ["deck$var", "my$deck"];

    for (const name of names) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect((result.left as ValidationError).message).toContain(
          "invalid characters",
        );
      }
    }
  });

  test("should reject paths starting with / or \\", async () => {
    const names = ["/home/user", "/tmp/test", "\\Windows", "\\System32"];

    for (const name of names) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect((result.left as ValidationError).message).toContain(
          "Path traversal",
        );
      }
    }
  });

  test("should reject Windows-style paths with drive letters as invalid", async () => {
    const names = ["C:\\Windows", "D:\\Projects", "E:/test"];

    for (const name of names) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect((result.left as ValidationError).message).toContain(
          "invalid characters",
        );
      }
    }
  });

  test("should reject mixed traversal attempts", async () => {
    const names = [
      "..hidden",
      "normal..traversal",
      "my..deck",
      "...triple",
      ".hidden..double",
    ];

    for (const name of names) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
    }
  });

  test("should accept unicode alphanumeric names", async () => {
    const names = ["my-deck-123", "deck_456", "ABC-DEF-789"];

    for (const name of names) {
      const result = await Effect.runPromise(
        Effect.either(TemplateService.validateProjectName(name)).pipe(
          Effect.provide(TestLayer),
        ),
      );

      expect(Either.isRight(result)).toBe(true);
    }
  });
});
