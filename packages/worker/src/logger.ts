type LogLevel = "info" | "warn" | "error";

const write = (level: LogLevel, event: string, payload: Record<string, unknown> = {}) => {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...payload
  });

  if (level === "error") return console.error(line);
  if (level === "warn") return console.warn(line);
  return console.info(line);
};

export const logger = {
  info: (event: string, payload?: Record<string, unknown>) => write("info", event, payload),
  warn: (event: string, payload?: Record<string, unknown>) => write("warn", event, payload),
  error: (event: string, payload?: Record<string, unknown>) => write("error", event, payload)
};
