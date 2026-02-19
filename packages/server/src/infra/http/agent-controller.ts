import { Elysia } from "elysia";
import { chat, toServerSentEventsResponse, maxIterations } from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";
import { Effect, ManagedRuntime, Option, Redacted } from "effect";
import * as Sentry from "@sentry/bun";
import type { ServerDeckState } from "@mnestia/schema";
import type { SlideService } from "@/domain/ports/slide-service";
import type { DeckStateInternal } from "@/domain/ports/slide-store";
import type { AppConfig } from "@/infra/config/app-config";
import { broadcastToClients } from "@/infra/ws/effect-runtime";
import { createAgentTools } from "@/application/agent-tool-factory";
import type { BroadcastFn } from "@/application/agent-tool-executor";

// ── Constants ─────────────────────────────────────────────────────

const MAX_AGENT_ITERATIONS = 10;

const SYSTEM_PROMPT_BASE = `You are an AI assistant that helps users create and manage presentation slide decks.

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

// ── Prompt Helpers ────────────────────────────────────────────────

function buildSystemPrompt(deckId?: string): string {
  if (!deckId) return SYSTEM_PROMPT_BASE;
  return `${SYSTEM_PROMPT_BASE}\n\nThe user is currently working on deck "${deckId}".`;
}

function extractInlineSystemPrompts(
  messages: ReadonlyArray<{ role: string; content: string }>
): string[] {
  return messages
    .filter((m) => m.role === "system")
    .map((m) => m.content);
}

function filterChatMessages(
  messages: ReadonlyArray<{ role: string; content: string }>
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

// ── Controller ────────────────────────────────────────────────────

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
        const { slideStore: storeMap, slideRuntime: runtime, appConfig } =
          ctx as unknown as ControllerContext;
        const { aiModel } = appConfig;

        const { messages, deckId } = ctx.body as {
          messages: Array<{ role: string; content: string }>;
          deckId: string;
        };

        span.setAttribute("deck.id", deckId ?? "unknown");
        span.setAttribute("ai.model", aiModel);
        span.setAttribute("message.count", messages.length);

        const broadcast = buildBroadcast(storeMap);
        const tools = createAgentTools(runtime, broadcast);

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
        const contextPrompt = buildSystemPrompt(deckId);
        const chatMessages = filterChatMessages(messages);
        const inlineSystemPrompts = extractInlineSystemPrompts(messages);

        const stream = chat({
          adapter: createOpenaiChat(aiModel as "gpt-4o", apiKey),
          messages: chatMessages,
          tools: [...tools],
          systemPrompts: [contextPrompt, ...inlineSystemPrompts],
          agentLoopStrategy: maxIterations(MAX_AGENT_ITERATIONS),
        });

        return toServerSentEventsResponse(stream);
      }
    );
  });
