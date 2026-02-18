import { Elysia } from "elysia";
import { chat, toServerSentEventsResponse, maxIterations } from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";
import { Effect, ManagedRuntime, Option, Redacted } from "effect";
import * as Sentry from "@sentry/bun";
import type { ServerDeckState } from "@mnestia/schema";
import type { SlideService } from "../domain/slide-service";
import type { DeckStateInternal } from "../domain/slide-store";
import type { AppConfig } from "../config/app-config";
import { broadcastToClients } from "../ws/effect-runtime";
import { createServerTools, type BroadcastFn } from "./agent-service";

const SYSTEM_PROMPT = `You are an AI assistant that helps users create and manage presentation slide decks.

You have access to tools that let you:
- Add new slides to a deck
- Remove slides from a deck
- Update the content, layout, or notes of existing slides
- Reorder slides within a deck
- Navigate to a specific slide

When the user asks you to modify their presentation, use the appropriate tools.
Always confirm what you did after making changes.

Guidelines:
- Slide indices are 0-based
- When adding slides, you can specify content, layout, notes, and position
- When updating slides, only include the fields you want to change
- Be helpful and proactive — suggest improvements when appropriate`;

interface ControllerContext {
  slideStore: Map<string, DeckStateInternal>;
  slideRuntime: ManagedRuntime.ManagedRuntime<SlideService, never>;
  appConfig: AppConfig;
}

function buildBroadcast(
  storeMap: Map<string, DeckStateInternal>
): BroadcastFn {
  return (deckId: string, state: ServerDeckState) => {
    const internal = storeMap.get(deckId);
    if (!internal) return;

    Effect.runSync(
      broadcastToClients(internal.clients, {
        type: "SLIDE_UPDATED" as const,
        deckId,
        state,
      })
    );
  };
}

export const agentController = new Elysia({ name: "agent-controller" })
  .post("/agent/chat", async (ctx) => {
    return Sentry.startSpan(
      {
        name: "agent.chat",
        op: "ai.chat",
      },
      (span) => {
        const { messages, deckId } = ctx.body as {
          messages: Array<{ role: string; content: string }>;
          deckId: string;
        };

        span.setAttribute("deck.id", deckId ?? "unknown");
        span.setAttribute("ai.model", "gpt-4o");
        span.setAttribute("message.count", messages.length);

        const { slideStore: storeMap, slideRuntime: runtime, appConfig } =
          ctx as unknown as ControllerContext;

        // Build broadcast function
        const broadcast = buildBroadcast(storeMap);

        // Create server tools with the shared runtime (no per-request Layer rebuild)
        const tools = createServerTools(runtime, broadcast);

        // Check for API key via Effect Config (Redacted + Option)
        if (Option.isNone(appConfig.openaiApiKey)) {
          span.setStatus({ code: 2, message: "OPENAI_API_KEY not configured" });
          return new Response(
            JSON.stringify({
              error: "OPENAI_API_KEY not configured",
              message:
                "Set the OPENAI_API_KEY environment variable to enable AI features.",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const apiKey = Redacted.value(appConfig.openaiApiKey.value);

        // Build context-aware system prompt
        const contextPrompt = deckId
          ? `${SYSTEM_PROMPT}\n\nThe user is currently working on deck "${deckId}".`
          : SYSTEM_PROMPT;

        // Separate system messages from user/assistant messages
        const chatMessages = messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        // Collect any inline system messages into systemPrompts
        const inlineSystemPrompts = messages
          .filter((m) => m.role === "system")
          .map((m) => m.content);

        // Create streaming chat with tools
        const stream = chat({
          adapter: createOpenaiChat("gpt-4o", apiKey),
          messages: chatMessages,
          tools: [...tools],
          systemPrompts: [contextPrompt, ...inlineSystemPrompts],
          agentLoopStrategy: maxIterations(10),
        });

        return toServerSentEventsResponse(stream);
      }
    );
  });
