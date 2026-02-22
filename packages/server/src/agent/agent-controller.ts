import { Elysia } from "elysia";
import { ManagedRuntime, Option } from "effect";
import * as v from "valibot";
import * as Sentry from "@sentry/bun";
import { SLIDE_TOOL_DESCRIPTIONS } from "@mnestia/schema";
import type { ServerDeckState, AgentChatBodySchema } from "@mnestia/schema";
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

function buildBroadcast(
  storeMap: Map<string, DeckStateInternal>,
  runtime: ManagedRuntime.ManagedRuntime<SlideService, never>
): BroadcastFn {
  return (deckId: string, state: ServerDeckState) => {
    const internal = storeMap.get(deckId);
    if (!internal) return;

    void runtime.runPromise(
      broadcastToClients(internal.clients, {
        type: "SLIDE_UPDATED" as const,
        deckId,
        state,
      })
    );
  };
}

function createPiClient(config: AppConfig): PiRpcClient {
  const options: PiRpcClientOptions = {};
  if (Option.isSome(config.piProvider)) {
    options.provider = config.piProvider.value;
  }
  if (Option.isSome(config.piModel)) {
    options.model = config.piModel.value;
  }
  return new PiRpcClient(options);
}

// ── SSE helpers ───────────────────────────────────────────────────

function sseEncode(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export const agentController = new Elysia({ name: "agent-controller" })
  .derive((ctx) => {
    const { appConfig } = ctx as unknown as { appConfig: AppConfig };
    return { piClient: createPiClient(appConfig) };
  })
  .post("/agent/chat", async (ctx) => {
    return Sentry.startSpan(
      {
        name: "agent.chat",
        op: "ai.chat",
      },
      async (span) => {
        const parsed = v.safeParse(AgentChatBodySchema, ctx.body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({
              error: "Invalid request body",
              issues: parsed.issues.map((i) => i.message),
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const { messages, deckId } = parsed.output;

        span.setAttribute("deck.id", deckId ?? "unknown");
        span.setAttribute("message.count", messages.length);

        const { slideStore: storeMap, slideRuntime: runtime } =
          ctx as unknown as {
            slideStore: Map<string, DeckStateInternal>;
            slideRuntime: ManagedRuntime.ManagedRuntime<SlideService, never>;
          };

        const broadcast = buildBroadcast(storeMap, runtime);
        const client = ctx.piClient;

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
            let closed = false;

            function tryClose() {
              if (closed) return;
              closed = true;
              try {
                controller.close();
              } catch {
                // Already closed
              }
            }

            function tryEnqueue(chunk: string) {
              if (closed) return;
              try {
                controller.enqueue(chunk);
              } catch {
                // Stream already closed
              }
            }

            const unsubscribe = client.onEvent((event: PiRpcEvent) => {
              if (event.type === "message_update") {
                const delta = event.assistantMessageEvent as
                  | { type: string; delta?: string }
                  | undefined;

                if (delta?.type === "text_delta" && delta.delta) {
                  fullText += delta.delta;
                  tryEnqueue(
                    sseEncode(
                      "text",
                      JSON.stringify({ content: delta.delta })
                    )
                  );
                }
              }

              if (event.type === "agent_end") {
                unsubscribe();

                // Extract commands from full response, execute them
                const commands = parseSlideCommands(fullText);

                if (commands.length > 0) {
                  executeSlideCommands(commands, runtime, broadcast)
                    .then((result) => {
                      tryEnqueue(
                        sseEncode(
                          "commands",
                          JSON.stringify(result)
                        )
                      );
                      tryEnqueue(sseEncode("done", "{}"));
                      tryClose();
                    })
                    .catch(() => {
                      tryEnqueue(sseEncode("done", "{}"));
                      tryClose();
                    });
                } else {
                  tryEnqueue(sseEncode("done", "{}"));
                  tryClose();
                }
              }
            });

            // Send prompt to Pi
            const resp = await client.prompt(fullPrompt);
            if (!resp.success) {
              unsubscribe();
              tryEnqueue(
                sseEncode(
                  "error",
                  JSON.stringify({ error: resp.error })
                )
              );
              tryClose();
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
