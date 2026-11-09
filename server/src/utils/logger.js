function write(level, message, metadata = {}) {
  const safeMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !/text|content|token|key|secret|password|prompt/i.test(key)),
  )
  console[level](JSON.stringify({ level, message, ...safeMetadata, at: new Date().toISOString() }))
}

export const logger = {
  info: (message, metadata) => write('log', message, metadata),
  warn: (message, metadata) => write('warn', message, metadata),
  error: (message, metadata) => write('error', message, metadata),
}
