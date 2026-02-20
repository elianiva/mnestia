import { Elysia } from "elysia";
import { Effect } from "effect";
import { loadAppConfig } from "./config/app-config";
import { initSentry } from "./config/sentry-init";
import { createTracingLayer } from "./config/tracing-layer";
import { createSlideStatePlugin } from "./state/slide-state";
import { agentController } from "./agent/agent-controller";
import { slideWs } from "./ws/slide-ws";

// Single Effect pipeline — all config via Effect Config
const { config, tracingLayer } = await Effect.runPromise(
  Effect.gen(function* () {
    const config = yield* loadAppConfig;
    const sentryEnabled = yield* initSentry(config.sentry);
    const tracingLayer = createTracingLayer(config.sentry, sentryEnabled);
    return { config, tracingLayer };
  })
);

const app = new Elysia()
  // 1. Register app config
  .decorate("appConfig", config)
  // 2. Register shared state (with tracing layer wired into runtime)
  .use(createSlideStatePlugin(tracingLayer))
  // 3. Register agent routes (POST /agent/chat)
  .use(agentController)
  // 4. Register WebSocket handler (/ws/slides)
  .use(slideWs)
  // Health check
  .get("/", () => ({ status: "ok", service: "@mnestia/server" }))
  // 5. Start server
  .listen({ port: config.port, hostname: config.host });

// eslint-disable-next-line no-console
console.log(
  `🦊 @mnestia/server is running at ${app.server?.hostname}:${app.server?.port}`
);
