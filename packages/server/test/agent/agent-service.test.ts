import { test, expect, describe } from "bun:test";
import { Layer } from "effect";
import type { ServerDeckState } from "@mnestia/schema";
import {
  parseSlideCommands,
  executeSlideCommands,
  type BroadcastFn,
} from "../../src/agent/agent-service";
import { createSlideRuntime } from "../../src/ws/effect-runtime";
import type { DeckStateInternal } from "../../src/domain/slide-store";
import { seedDeck } from "../helpers";

// ── Test Helpers ──────────────────────────────────────────────────

interface BroadcastRecord {
  deckId: string;
  state: ServerDeckState;
}

function createTestContext() {
  const storeMap = new Map<string, DeckStateInternal>();
  const runtime = createSlideRuntime(storeMap, Layer.empty);
  const broadcasts: BroadcastRecord[] = [];
  const broadcast: BroadcastFn = (deckId, state) => {
    broadcasts.push({ deckId, state });
  };

  return { storeMap, runtime, broadcasts, broadcast };
}

// ── parseSlideCommands ────────────────────────────────────────────

describe("parseSlideCommands", () => {
  test("extracts ADD_SLIDE command from json fenced block", () => {
    const text = `Here's a new slide:

\`\`\`json
{"type":"ADD_SLIDE","deckId":"deck-1","slide":{"content":"Hello"}}
\`\`\`

Done!`;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(1);
    expect(commands[0]!.type).toBe("ADD_SLIDE");
  });

  test("extracts multiple commands from multiple json blocks", () => {
    const text = `I'll add two slides:

\`\`\`json
{"type":"ADD_SLIDE","deckId":"deck-1","slide":{"content":"Slide A"}}
\`\`\`

\`\`\`json
{"type":"ADD_SLIDE","deckId":"deck-1","slide":{"content":"Slide B"}}
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(2);
  });

  test("extracts UPDATE_SLIDE command", () => {
    const text = `\`\`\`json
{"type":"UPDATE_SLIDE","deckId":"d","slideIndex":0,"content":"New"}
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(1);
    expect(commands[0]!.type).toBe("UPDATE_SLIDE");
  });

  test("extracts REMOVE_SLIDE command", () => {
    const text = `\`\`\`json
{"type":"REMOVE_SLIDE","deckId":"d","slideIndex":1}
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(1);
    expect(commands[0]!.type).toBe("REMOVE_SLIDE");
  });

  test("extracts REORDER_SLIDES command", () => {
    const text = `\`\`\`json
{"type":"REORDER_SLIDES","deckId":"d","fromIndex":0,"toIndex":2}
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(1);
    expect(commands[0]!.type).toBe("REORDER_SLIDES");
  });

  test("extracts CHANGE_CURRENT_SLIDE command", () => {
    const text = `\`\`\`json
{"type":"CHANGE_CURRENT_SLIDE","deckId":"d","slideIndex":3}
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(1);
    expect(commands[0]!.type).toBe("CHANGE_CURRENT_SLIDE");
  });

  test("returns empty array for text without json blocks", () => {
    const commands = parseSlideCommands("Just a regular message.");
    expect(commands).toHaveLength(0);
  });

  test("skips malformed JSON blocks", () => {
    const text = `\`\`\`json
{not valid json}
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(0);
  });

  test("skips JSON blocks that don't match SlideCommandSchema", () => {
    const text = `\`\`\`json
{"type":"UNKNOWN_COMMAND","deckId":"d"}
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(0);
  });

  test("skips invalid blocks but keeps valid ones", () => {
    const text = `\`\`\`json
{"type":"INVALID"}
\`\`\`

\`\`\`json
{"type":"ADD_SLIDE","deckId":"d","slide":{"content":"Valid"}}
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(1);
    expect(commands[0]!.type).toBe("ADD_SLIDE");
  });

  test("handles empty json block", () => {
    const text = `\`\`\`json
\`\`\``;

    const commands = parseSlideCommands(text);
    expect(commands).toHaveLength(0);
  });
});

// ── executeSlideCommands ──────────────────────────────────────────

describe("executeSlideCommands", () => {
  test("executes ADD_SLIDE and broadcasts", async () => {
    const { storeMap, runtime, broadcasts, broadcast } = createTestContext();
    seedDeck(storeMap, "deck-1", 1);

    const commands = parseSlideCommands(`\`\`\`json
{"type":"ADD_SLIDE","deckId":"deck-1","slide":{"content":"New slide"}}
\`\`\``);

    const result = await executeSlideCommands(commands, runtime, broadcast);

    expect(result.executed).toBe(1);
    expect(result.failed).toBe(0);
    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0]!.state.slides).toHaveLength(2);
  });

  test("executes REMOVE_SLIDE and broadcasts", async () => {
    const { storeMap, runtime, broadcasts, broadcast } = createTestContext();
    seedDeck(storeMap, "deck-1", 3);

    const commands = parseSlideCommands(`\`\`\`json
{"type":"REMOVE_SLIDE","deckId":"deck-1","slideIndex":1}
\`\`\``);

    const result = await executeSlideCommands(commands, runtime, broadcast);

    expect(result.executed).toBe(1);
    expect(result.failed).toBe(0);
    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0]!.state.slides).toHaveLength(2);
  });

  test("executes UPDATE_SLIDE and broadcasts", async () => {
    const { storeMap, runtime, broadcasts, broadcast } = createTestContext();
    seedDeck(storeMap, "deck-1", 2);

    const commands = parseSlideCommands(`\`\`\`json
{"type":"UPDATE_SLIDE","deckId":"deck-1","slideIndex":0,"content":"Updated"}
\`\`\``);

    const result = await executeSlideCommands(commands, runtime, broadcast);

    expect(result.executed).toBe(1);
    expect(result.failed).toBe(0);
    expect(broadcasts[0]!.state.slides[0]!.content).toBe("Updated");
  });

  test("executes CHANGE_CURRENT_SLIDE and broadcasts", async () => {
    const { storeMap, runtime, broadcasts, broadcast } = createTestContext();
    seedDeck(storeMap, "deck-1", 5);

    const commands = parseSlideCommands(`\`\`\`json
{"type":"CHANGE_CURRENT_SLIDE","deckId":"deck-1","slideIndex":3}
\`\`\``);

    const result = await executeSlideCommands(commands, runtime, broadcast);

    expect(result.executed).toBe(1);
    expect(result.failed).toBe(0);
    expect(broadcasts[0]!.state.currentSlide).toBe(3);
  });

  test("executes multiple commands sequentially", async () => {
    const { storeMap, runtime, broadcasts, broadcast } = createTestContext();
    seedDeck(storeMap, "deck-1", 0);

    const commands = parseSlideCommands(`\`\`\`json
{"type":"ADD_SLIDE","deckId":"deck-1","slide":{"content":"A"}}
\`\`\`

\`\`\`json
{"type":"ADD_SLIDE","deckId":"deck-1","slide":{"content":"B"}}
\`\`\``);

    const result = await executeSlideCommands(commands, runtime, broadcast);

    expect(result.executed).toBe(2);
    expect(result.failed).toBe(0);
    expect(broadcasts).toHaveLength(2);
  });

  test("counts failures for nonexistent deck", async () => {
    const { runtime, broadcasts, broadcast } = createTestContext();

    const commands = parseSlideCommands(`\`\`\`json
{"type":"REMOVE_SLIDE","deckId":"nonexistent","slideIndex":0}
\`\`\``);

    const result = await executeSlideCommands(commands, runtime, broadcast);

    expect(result.executed).toBe(0);
    expect(result.failed).toBe(1);
    expect(broadcasts).toHaveLength(0);
  });

  test("counts failures for invalid slide index", async () => {
    const { storeMap, runtime, broadcasts, broadcast } = createTestContext();
    seedDeck(storeMap, "deck-1", 2);

    const commands = parseSlideCommands(`\`\`\`json
{"type":"REMOVE_SLIDE","deckId":"deck-1","slideIndex":99}
\`\`\``);

    const result = await executeSlideCommands(commands, runtime, broadcast);

    expect(result.executed).toBe(0);
    expect(result.failed).toBe(1);
    expect(broadcasts).toHaveLength(0);
  });

  test("handles empty commands array", async () => {
    const { runtime, broadcasts, broadcast } = createTestContext();

    const result = await executeSlideCommands([], runtime, broadcast);

    expect(result.executed).toBe(0);
    expect(result.failed).toBe(0);
    expect(broadcasts).toHaveLength(0);
  });

  test("partial failure: valid + invalid commands", async () => {
    const { storeMap, runtime, broadcasts, broadcast } = createTestContext();
    seedDeck(storeMap, "deck-1", 2);

    const commands = parseSlideCommands(`\`\`\`json
{"type":"ADD_SLIDE","deckId":"deck-1","slide":{"content":"Valid"}}
\`\`\`

\`\`\`json
{"type":"REMOVE_SLIDE","deckId":"deck-1","slideIndex":99}
\`\`\``);

    const result = await executeSlideCommands(commands, runtime, broadcast);

    expect(result.executed).toBe(1);
    expect(result.failed).toBe(1);
    expect(broadcasts).toHaveLength(1);
  });
});
