import fs from "node:fs";
import path from "node:path";
import { getSessionsDir } from "./paths.js";

const TOKEN_COUNT_TYPE = "token_count";

function statSafe(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function collectJsonlFiles(root) {
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        const stats = statSafe(fullPath);
        if (stats) {
          files.push({ path: fullPath, mtimeMs: stats.mtimeMs, size: stats.size });
        }
      }
    }
  }

  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files;
}

export function findLatestSessionFile(sessionsDir = getSessionsDir()) {
  return collectJsonlFiles(sessionsDir)[0]?.path ?? null;
}

function parseJsonLines(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function normalizeTokenCount(event, sourceFile) {
  const payload = event?.payload;
  if (event?.type !== "event_msg" || payload?.type !== TOKEN_COUNT_TYPE) {
    return null;
  }

  const info = payload.info ?? {};
  const rateLimits = payload.rate_limits ?? {};
  const usage = info.total_token_usage ?? {};
  const lastUsage = info.last_token_usage ?? {};
  const contextWindow = Number(info.model_context_window ?? 0);
  const totalTokens = Number(usage.total_tokens ?? 0);
  const contextTokens = Number(lastUsage.input_tokens ?? 0);

  return {
    sourceFile,
    timestamp: event.timestamp ?? null,
    totalTokens,
    contextTokens,
    contextWindow,
    contextPercent: contextWindow > 0 ? (contextTokens / contextWindow) * 100 : null,
    lastTokenUsage: lastUsage,
    totalTokenUsage: usage,
    primary: normalizeLimit(rateLimits.primary),
    secondary: normalizeLimit(rateLimits.secondary),
    planType: rateLimits.plan_type ?? null,
    limitId: rateLimits.limit_id ?? null,
    reachedType: rateLimits.rate_limit_reached_type ?? null
  };
}

function normalizeLimit(limit) {
  if (!limit) {
    return null;
  }

  return {
    usedPercent: Number(limit.used_percent ?? 0),
    windowMinutes: Number(limit.window_minutes ?? 0),
    resetsAt: Number(limit.resets_at ?? 0)
  };
}

export function readLatestUsage(options = {}) {
  const sessionsDir = options.sessionsDir ?? getSessionsDir(options.codexHome);
  const maxFiles = options.maxFiles ?? 8;
  const files = collectJsonlFiles(sessionsDir).slice(0, maxFiles);

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file.path, "utf8");
    } catch {
      continue;
    }

    const events = parseJsonLines(text);
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const usage = normalizeTokenCount(events[i], file.path);
      if (usage) {
        return usage;
      }
    }
  }

  return null;
}
