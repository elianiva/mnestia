import * as Sentry from "@sentry/bun";
import { Cause, Either } from "effect";

export function captureEffectError<E>(
  cause: Cause.Cause<E>
): void {
  const either = Cause.failureOrCause(cause);

  Either.match(either, {
    onLeft: (error) => {
      if (typeof error === "object" && error !== null && "_tag" in error) {
        const tagged = error as { _tag: string; [key: string]: unknown };
        Sentry.captureException(new Error(`[${tagged._tag}]`), {
          tags: { "effect.error_tag": tagged._tag },
          extra: { ...tagged },
        });
      } else {
        Sentry.captureException(error);
      }
    },
    onRight: (defectCause) => {
      Sentry.captureException(
        new Error(Cause.pretty(defectCause)),
        { tags: { "effect.error_type": "defect" } }
      );
    },
  });
}
