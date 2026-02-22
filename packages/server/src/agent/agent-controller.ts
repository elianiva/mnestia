import { Elysia } from "elysia";
import { Effect, ManagedRuntime, Option, PubSub, Queue } from "effect";
import * as v from "valibot";
import * as Sentry from "@sentry/bun";
import { BunContext } from "@effect/platform-bun";
import { SLIDE_TOOL_DESCRIPTIONS } from "@mnestia/schema";
import type { ServerDeckState } from "@mnestia/schema";
import { AgentChatBodySchema } from "@mnestia/schema";
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
  makePiRpcClient,
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

function buildClientOptions(config: AppConfig): PiRpcClientOptions {
  return {
    provider: Option.getOrUndefined(config.piProvider),
    model: Option.getOrUndefined(config.piModel),
  };
}

// ── SSE helpers ───────────────────────────────────────────────────

function sseEncode(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export const agentController = new Elysia({ name: "agent-controller" }).post(
  "/agent/chat",
  async (ctx) => {
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
        const { appConfig } = ctx as unknown as { appConfig: AppConfig };

        const broadcast = buildBroadcast(storeMap, runtime);
        const clientOptions = buildClientOptions(appConfig);

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

            // Run the entire agent interaction as a scoped Effect
            const program = Effect.gen(function* () {
              const client = yield* makePiRpcClient(clientOptions);
              let fullText = "";

              // Subscribe to events
              const sub = yield* PubSub.subscribe(client.events);

              // Send prompt
              const resp = yield* client.prompt(fullPrompt).pipe(
                Effect.catchAll((err) =>
                  Effect.succeed({
                    type: "response" as const,
                    command: "prompt",
                    success: false,
                    error: err.message,
                  })
                )
              );

              if (!resp.success) {
                tryEnqueue(
                  sseEncode(
                    "error",
                    JSON.stringify({ error: resp.error })
                  )
                );
                tryClose();
                return;
              }

              // Process events from the subscription
              yield* Effect.gen(function* () {
                while (true) {
                  const event = yield* Queue.take(sub);

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
                    break;
                  }
                }
              });

              // Extract and execute commands
              const commands = parseSlideCommands(fullText);

              if (commands.length > 0) {
                const result = yield* Effect.tryPromise({
                  try: () =>
                    executeSlideCommands(commands, runtime, broadcast),
                  catch: () => "command execution failed" as const,
                }).pipe(Effect.option);

                if (result._tag === "Some") {
                  tryEnqueue(
                    sseEncode("commands", JSON.stringify(result.value))
                  );
                }
              }

              tryEnqueue(sseEncode("done", "{}"));
              tryClose();
            }).pipe(
              Effect.scoped,
              Effect.catchAll((err) =>
                Effect.sync(() => {
                  tryEnqueue(
                    sseEncode(
                      "error",
                      JSON.stringify({
                        error:
                          typeof err === "object" &&
                          err !== null &&
                          "message" in err
                            ? (err as { message: string }).message
                            : String(err),
                      })
                    )
                  );
                  tryClose();
                })
              ),
              Effect.withSpan("agent.chat.stream"),
              Effect.provide(BunContext.layer)
            );

            await Effect.runPromise(program);
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
  }
);
