import { Elysia } from "elysia";
import type { DeckStateInternal } from "../domain/slide-store";
import { createSlideRuntime } from "../ws/effect-runtime";

const storeMap = new Map<string, DeckStateInternal>();

export const slideStatePlugin = new Elysia({ name: "slide-state" })
  .decorate("slideStore", storeMap)
  .decorate("slideRuntime", createSlideRuntime(storeMap));
