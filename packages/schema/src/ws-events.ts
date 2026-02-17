import * as v from "valibot";
import { ServerDeckStateSchema } from "./server-slide";

// ── Incoming Event Types ──────────────────────────────────────────

export const WsIncomingEventTypeSchema = v.union([
  v.literal("JOIN_ROOM"),
  v.literal("SLIDE_CHANGE"),
  v.literal("SYNC_REQUEST"),
]);

export type WsIncomingEventType = v.InferOutput<
  typeof WsIncomingEventTypeSchema
>;

// ── Incoming Payloads ─────────────────────────────────────────────

export const JoinRoomMessageSchema = v.object({
  type: v.literal("JOIN_ROOM"),
  deckId: v.string(),
});

export type JoinRoomMessage = v.InferOutput<typeof JoinRoomMessageSchema>;

export const SlideChangeMessageSchema = v.object({
  type: v.literal("SLIDE_CHANGE"),
  deckId: v.string(),
  slideIndex: v.number(),
});

export type SlideChangeMessage = v.InferOutput<
  typeof SlideChangeMessageSchema
>;

export const SyncRequestMessageSchema = v.object({
  type: v.literal("SYNC_REQUEST"),
  deckId: v.string(),
});

export type SyncRequestMessage = v.InferOutput<
  typeof SyncRequestMessageSchema
>;

export const WsIncomingMessageSchema = v.variant("type", [
  JoinRoomMessageSchema,
  SlideChangeMessageSchema,
  SyncRequestMessageSchema,
]);

export type WsIncomingMessage = v.InferOutput<
  typeof WsIncomingMessageSchema
>;

// ── Outgoing Event Types ──────────────────────────────────────────

export const WsOutgoingEventTypeSchema = v.union([
  v.literal("SLIDE_CHANGE"),
  v.literal("SYNC_STATE"),
  v.literal("SLIDE_UPDATED"),
  v.literal("ERROR"),
]);

export type WsOutgoingEventType = v.InferOutput<
  typeof WsOutgoingEventTypeSchema
>;

// ── Outgoing Payloads ─────────────────────────────────────────────

export const SlideChangeOutSchema = v.object({
  type: v.literal("SLIDE_CHANGE"),
  deckId: v.string(),
  slideIndex: v.number(),
});

export type SlideChangeOut = v.InferOutput<typeof SlideChangeOutSchema>;

export const SyncStateOutSchema = v.object({
  type: v.literal("SYNC_STATE"),
  deckId: v.string(),
  state: ServerDeckStateSchema,
});

export type SyncStateOut = v.InferOutput<typeof SyncStateOutSchema>;

export const SlideUpdatedOutSchema = v.object({
  type: v.literal("SLIDE_UPDATED"),
  deckId: v.string(),
  state: ServerDeckStateSchema,
});

export type SlideUpdatedOut = v.InferOutput<typeof SlideUpdatedOutSchema>;

export const ErrorOutSchema = v.object({
  type: v.literal("ERROR"),
  message: v.string(),
  code: v.optional(v.string()),
});

export type ErrorOut = v.InferOutput<typeof ErrorOutSchema>;

export const WsOutgoingMessageSchema = v.variant("type", [
  SlideChangeOutSchema,
  SyncStateOutSchema,
  SlideUpdatedOutSchema,
  ErrorOutSchema,
]);

export type WsOutgoingMessage = v.InferOutput<
  typeof WsOutgoingMessageSchema
>;
