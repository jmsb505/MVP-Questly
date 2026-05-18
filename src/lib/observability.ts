import * as Sentry from "@sentry/react";
import { env } from "./env";

export function initSentry() {
  if (!env.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appEnv,
    tracesSampleRate: env.sentryTracesSampleRate,
    sendDefaultPii: false
  });
}
