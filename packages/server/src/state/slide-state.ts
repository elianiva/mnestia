import { Elysia } from "elysia";
import type { Layer } from "effect";
import type { DeckStateInternal } from "../domain/slide-store";
import { createSlideRuntime } from "../ws/effect-runtime";

export function createSlideStatePlugin(tracingLayer: Layer.Layer<never>) {
  const storeMap = new Map<string, DeckStateInternal>();
  return new Elysia({ name: "slide-state" })
    .decorate("slideStore", storeMap)
    .decorate("slideRuntime", createSlideRuntime(storeMap, tracingLayer));
}
