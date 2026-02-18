import { NodeSdk } from "@effect/opentelemetry";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { SentrySpanProcessor } from "@sentry/opentelemetry";
import { Layer } from "effect";
import type { Resource } from "@effect/opentelemetry/Resource";
import type { SentryConfig } from "./sentry-config";

export function createTracingLayer(
  config: SentryConfig,
  sentryEnabled: boolean
): Layer.Layer<Resource> {
  const processors: Array<SpanProcessor> = [];

  if (sentryEnabled) {
    processors.push(new SentrySpanProcessor());
  }

  if (config.consoleTrace) {
    processors.push(new BatchSpanProcessor(new ConsoleSpanExporter()));
  }

  // No processors → no tracing layer needed
  if (processors.length === 0) {
    return NodeSdk.layerEmpty;
  }

  return NodeSdk.layer(() => ({
    resource: {
      serviceName: "@mnestia/server",
      serviceVersion: "0.0.1",
    },
    spanProcessor:
      processors.length === 1 ? processors[0]! : processors,
  }));
}
