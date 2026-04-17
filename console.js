/**
 * @author Roberto Stefani
 * @license MIT
 */
const DEFAULT_REDACTED_KEYS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "accesskey",
  "privatekey",
];

const LEVEL_PRIORITIES = {
  error: 0,
  warn: 1,
  info: 2,
  log: 2,
  debug: 3,
};

const nativeConsole = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
};

const DEFAULT_LOGGING_CONFIG = Object.freeze({
  enabled: true,
  level: "info",
  diagnostics: false,
  debug: false,
  includeCaller: false,
  redactKeys: DEFAULT_REDACTED_KEYS,
  maxStringLength: 500,
  maxArrayLength: 20,
  maxObjectKeys: 20,
  writer: null,
});

let runtimeLoggingConfig = createLoggingConfig();

function createLoggingConfig(overrides = {}) {
  return {
    ...DEFAULT_LOGGING_CONFIG,
    ...overrides,
    redactKeys: Array.isArray(overrides.redactKeys)
      ? [...new Set([...DEFAULT_REDACTED_KEYS, ...overrides.redactKeys.map((key) => String(key).toLowerCase())])]
      : [...DEFAULT_REDACTED_KEYS],
  };
}

export function getLoggingConfig() {
  return {
    ...runtimeLoggingConfig,
    redactKeys: [...runtimeLoggingConfig.redactKeys],
  };
}

export function configureLogging(overrides = {}) {
  runtimeLoggingConfig = createLoggingConfig(overrides);
  return getLoggingConfig();
}

export function resetLoggingConfig() {
  runtimeLoggingConfig = createLoggingConfig();
  asyncConsole.map = {};
}

function getCallerInfo() {
  const stack = new Error().stack;
  if (stack) {
    const stackLines = stack.split("\n");
    if (stackLines.length > 3) {
      const callerLine = stackLines[3].trim();
      const match = callerLine.match(/at\s+(.+):(\d+):\d+/);
      if (match) {
        return `${match[1]}:${match[2]}`;
      }
    }
  }
  return "unknown location";
}

function getLevelPriority(level) {
  return LEVEL_PRIORITIES[level] ?? LEVEL_PRIORITIES.info;
}

function shouldEmit(level, options = {}) {
  if (!runtimeLoggingConfig.enabled && !options.force) return false;
  if (options.diagnostic && !runtimeLoggingConfig.diagnostics && !options.force) return false;
  if (level === "debug" && !runtimeLoggingConfig.debug && !options.force) return false;
  if (level === "debug") return true;
  const configuredLevel = String(runtimeLoggingConfig.level ?? "info").toLowerCase();
  return getLevelPriority(level) <= getLevelPriority(configuredLevel) || options.force;
}

function truncateString(value) {
  if (value.length <= runtimeLoggingConfig.maxStringLength) return value;
  return `${value.slice(0, runtimeLoggingConfig.maxStringLength)}...<truncated>`;
}

function isSensitiveKey(key) {
  const normalizedKey = String(key).toLowerCase();
  return runtimeLoggingConfig.redactKeys.some((candidate) => normalizedKey.includes(candidate));
}

function sanitizeValue(value, seen = new WeakSet(), depth = 0) {
  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return value;
  }

  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message ?? ""),
    };
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    return value
      .slice(0, runtimeLoggingConfig.maxArrayLength)
      .map((item) => sanitizeValue(item, seen, depth + 1));
  }

  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const sanitized = {};
    for (const key of Object.keys(value).slice(0, runtimeLoggingConfig.maxObjectKeys)) {
      sanitized[key] = isSensitiveKey(key)
        ? "[REDACTED]"
        : sanitizeValue(value[key], seen, depth + 1);
    }
    return sanitized;
  }

  return String(value);
}

export function sanitizeForLogging(value) {
  return sanitizeValue(value);
}

function formatPrintable(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function emit(level, messages, options = {}) {
  if (!shouldEmit(level, options)) return;
  const payload = (messages ?? []).map((message) =>
    options.sanitize === false ? message : sanitizeForLogging(message)
  );
  const includeCaller = options.includeCaller ?? runtimeLoggingConfig.includeCaller;
  const callerInfo = includeCaller ? getCallerInfo() : null;
  if (typeof runtimeLoggingConfig.writer === "function") {
    runtimeLoggingConfig.writer(level, ...(callerInfo ? [`[${callerInfo}]`] : []), ...payload);
    return;
  }
  const writer = nativeConsole[level] ?? nativeConsole.log;
  if (callerInfo) {
    writer(`[${callerInfo}]`, ...payload);
    return;
  }
  writer(...payload);
}

/**
 * Async console: collects diagnostics and prints them only when explicitly enabled.
 */
export const asyncConsole = {
  map: {},
  log(name, msg, options = {}) {
    if (!shouldEmit(options.level ?? "debug", { ...options, diagnostic: true })) return;
    const channel = String(name ?? "default").trim() || "default";
    asyncConsole.map[channel] = asyncConsole.map[channel] ?? [];
    asyncConsole.map[channel].push(
      options.sanitize === false ? msg : sanitizeForLogging(msg)
    );
  },
  output(...names) {
    const channels = names.length > 0 ? names : Object.keys(asyncConsole.map);
    for (const name of channels) {
      if (!asyncConsole.map[name]?.length) continue;
      powerConsole.log(name, asyncConsole.map[name], "log", {
        diagnostic: true,
        sanitize: false,
      });
    }
  },
  clear(...names) {
    const channels = names.length > 0 ? names : Object.keys(asyncConsole.map);
    for (const name of channels) {
      delete asyncConsole.map[name];
    }
  },
};

export const powerConsole = {
  map: {},
  log(name, msg, format = "log", options = {}) {
    const printable = Array.isArray(msg)
      ? msg.map((entry) => formatPrintable(entry)).join("\n\t\t")
      : formatPrintable(msg);
    emit(format, [`[${name}] \n\t${printable}\n`], options);
  },
};

export function log(message, ...messages) {
  emit("log", [message, ...messages]);
}

export function error(message, ...messages) {
  emit("error", [message, ...messages], { includeCaller: true });
}

export function warn(message, ...messages) {
  emit("warn", [message, ...messages], { includeCaller: true });
}

export function info(message, ...messages) {
  emit("info", [message, ...messages]);
}

export function debug(message, ...messages) {
  emit("debug", [message, ...messages]);
}
  
