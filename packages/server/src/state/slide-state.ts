import { Elysia } from "elysia";
import type { Layer } from "effect";
import type { Resource } from "@effect/opentelemetry/Resource";
import type { DeckStateInternal } from "../domain/slide-store";
import { createSlideRuntime } from "../ws/effect-runtime";

export function createSlideStatePlugin(tracingLayer: Layer.Layer<Resource>) {
  const storeMap = new Map<string, DeckStateInternal>();
  return new Elysia({ name: "slide-state" })
    .decorate("slideStore", storeMap)
    .decorate("slideRuntime", createSlideRuntime(storeMap, tracingLayer));
}
