type LogContext = Record<string, string | number | boolean | null | undefined>;

function write(level: "info" | "error", event: string, context?: LogContext) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  });

  if (level === "error") console.error(entry);
  else console.info(entry);
}

export const logger = {
  info: (event: string, context?: LogContext) => write("info", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
};
