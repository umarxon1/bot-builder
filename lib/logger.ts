type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function write(level: LogLevel, event: string, payload: LogPayload = {}) {
  const log = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const serialized = JSON.stringify(log);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

export const logger = {
  info(event: string, payload?: LogPayload) {
    write("info", event, payload);
  },
  warn(event: string, payload?: LogPayload) {
    write("warn", event, payload);
  },
  error(event: string, payload?: LogPayload) {
    write("error", event, payload);
  },
};
