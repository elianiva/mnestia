import { Elysia } from "elysia";
import { slideStatePlugin } from "./state/slide-state";
import { agentController } from "./agent/agent-controller";
import { slideWs } from "./ws/slide-ws";

const app = new Elysia()
  // 1. Register shared state
  .use(slideStatePlugin)
  // 2. Register agent routes (POST /agent/chat)
  .use(agentController)
  // 3. Register WebSocket handler (/ws/slides)
  .use(slideWs)
  // Health check
  .get("/", () => ({ status: "ok", service: "@mnestia/server" }))
  // 4. Start server
  .listen(3000);

// eslint-disable-next-line no-console
console.log(
  `🦊 @mnestia/server is running at ${app.server?.hostname}:${app.server?.port}`
);
