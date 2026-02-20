import { Elysia } from "elysia";
import { Effect, ManagedRuntime, Option } from "effect";
import * as Sentry from "@sentry/bun";
import { SLIDE_TOOL_DESCRIPTIONS } from "@mnestia/schema";
import type { ServerDeckState } from "@mnestia/schema";
import type { SlideService } from "../domain/slide-service";
import type { DeckStateInternal } from "../domain/slide-store";
import type { AppConfig } from "../config/app-config";
import { broadcastToClients } from "../ws/effect-runtime";
import {
  parseSlideCommands,
  executeSlideCommands,
  type BroadcastFn,
} from "./agent-service";
import {
  PiRpcClient,
  type PiRpcEvent,
  type PiRpcClientOptions,
} from "./pi-rpc-client";

const SYSTEM_PROMPT = `You are an AI assistant that helps users create and manage presentation slide decks.

${SLIDE_TOOL_DESCRIPTIONS}

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

// ── Singleton Pi RPC client (lazy init) ───────────────────────────

let piClient: PiRpcClient | null = null;

function getOrCreateClient(config: AppConfig): PiRpcClient {
  if (piClient?.isAlive) return piClient;

  const options: PiRpcClientOptions = {};
  if (Option.isSome(config.piProvider)) {
    options.provider = config.piProvider.value;
  }
  if (Option.isSome(config.piModel)) {
    options.model = config.piModel.value;
  }

  piClient = new PiRpcClient(options);
  return piClient;
}

// ── SSE helpers ───────────────────────────────────────────────────

function sseEncode(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export const agentController = new Elysia({ name: "agent-controller" })
  .post("/agent/chat", async (ctx) => {
    return Sentry.startSpan(
      {
        name: "agent.chat",
        op: "ai.chat",
      },
      async (span) => {
        const { messages, deckId } = ctx.body as {
          messages: Array<{ role: string; content: string }>;
          deckId: string;
        };

        span.setAttribute("deck.id", deckId ?? "unknown");
        span.setAttribute("message.count", messages.length);

        const { slideStore: storeMap, slideRuntime: runtime, appConfig } =
          ctx as unknown as ControllerContext;

        const broadcast = buildBroadcast(storeMap);
        const client = getOrCreateClient(appConfig);

        // Build the full prompt with system context
        const contextLine = deckId
          ? `\nThe user is currently working on deck "${deckId}".`
          : "";

        const lastUserMessage =
          messages.filter((m) => m.role === "user").at(-1)?.content ?? "";

        const fullPrompt = `${SYSTEM_PROMPT}${contextLine}\n\n${lastUserMessage}`;

        // Stream response as SSE
        const stream = new ReadableStream({
          async start(controller) {
            let fullText = "";

            const unsubscribe = client.onEvent((event: PiRpcEvent) => {
              if (event.type === "message_update") {
                const delta = event.assistantMessageEvent as
                  | { type: string; delta?: string }
                  | undefined;

                if (delta?.type === "text_delta" && delta.delta) {
                  fullText += delta.delta;
                  controller.enqueue(
                    sseEncode(
                      "text",
                      JSON.stringify({ content: delta.delta })
                    )
                  );
                }
              }

              if (event.type === "agent_end") {
                // Extract commands from full response, execute them
                const commands = parseSlideCommands(fullText);

                if (commands.length > 0) {
                  executeSlideCommands(commands, runtime, broadcast)
                    .then((result) => {
                      controller.enqueue(
                        sseEncode(
                          "commands",
                          JSON.stringify(result)
                        )
                      );
                      controller.enqueue(sseEncode("done", "{}"));
                      controller.close();
                    })
                    .catch(() => {
                      controller.enqueue(sseEncode("done", "{}"));
                      controller.close();
                    });
                } else {
                  controller.enqueue(sseEncode("done", "{}"));
                  controller.close();
                }

                unsubscribe();
              }
            });

            // Send prompt to Pi
            const resp = await client.prompt(fullPrompt);
            if (!resp.success) {
              controller.enqueue(
                sseEncode(
                  "error",
                  JSON.stringify({ error: resp.error })
                )
              );
              controller.close();
              unsubscribe();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
    );
  });
