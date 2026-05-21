const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const COLORS = {
  orange: "\x1b[38;5;208m",
  blue: "\x1b[38;5;39m",
  green: "\x1b[38;5;42m",
  yellow: "\x1b[38;5;220m",
  red: "\x1b[38;5;196m",
  gray: "\x1b[38;5;240m"
};

function colorize(text, color, enabled) {
  if (!enabled) {
    return text;
  }
  return `${color}${text}${RESET}`;
}

function pickColor(baseColor, percent) {
  if (percent >= 95) {
    return COLORS.red;
  }
  if (percent >= 80) {
    return COLORS.yellow;
  }
  return COLORS[baseColor];
}

export function formatCompactNumber(value) {
  if (!Number.isFinite(value)) {
    return "?";
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}m`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}k`;
  }
  return String(Math.round(value));
}

export function formatResetTime(epochSeconds) {
  if (!epochSeconds) {
    return "unknown";
  }

  const reset = new Date(epochSeconds * 1000);
  const now = new Date();
  const sameDay =
    reset.getFullYear() === now.getFullYear() &&
    reset.getMonth() === now.getMonth() &&
    reset.getDate() === now.getDate();

  if (sameDay) {
    return reset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return reset.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export function makeBar(percent, options = {}) {
  const width = Math.max(4, Number(options.width ?? 20));
  const ascii = Boolean(options.ascii);
  const bounded = Math.max(0, Math.min(100, Number(percent ?? 0)));
  const filled = Math.round((bounded / 100) * width);
  const fillChar = ascii ? "#" : "█";
  const emptyChar = ascii ? "-" : "░";
  return `${fillChar.repeat(filled)}${emptyChar.repeat(width - filled)}`;
}

function renderLine(label, percent, meta, baseColor, options) {
  const color = pickColor(baseColor, percent);
  const bar = makeBar(percent, options);
  const coloredBar = colorize(bar, color, options.color);
  const paddedLabel = label.padEnd(5, " ");
  const pct = `${Math.round(percent).toString().padStart(3, " ")}%`;
  const labelText = colorize(paddedLabel, options.color ? BOLD : "", options.color);
  return `${labelText} [${coloredBar}] ${pct} ${colorize(meta, COLORS.gray, options.color)}`;
}

export function renderUsage(usage, options = {}) {
  const renderOptions = {
    width: options.width ?? 20,
    ascii: options.ascii ?? false,
    color: options.color ?? process.stderr.isTTY
  };

  if (!usage) {
    return "Codex usage: no token_count event found yet.";
  }

  const fiveHour = usage.primary?.usedPercent ?? 0;
  const week = usage.secondary?.usedPercent ?? 0;
  const context = usage.contextPercent ?? 0;

  return [
    renderLine("5h", fiveHour, `reset ${formatResetTime(usage.primary?.resetsAt)}`, "orange", renderOptions),
    renderLine("Week", week, `reset ${formatResetTime(usage.secondary?.resetsAt)}`, "blue", renderOptions),
    renderLine(
      "Ctx",
      context,
      `${formatCompactNumber(usage.contextTokens)} / ${formatCompactNumber(usage.contextWindow)}`,
      "green",
      renderOptions
    )
  ].join("\n");
}

export function renderOneLine(usage, options = {}) {
  const renderOptions = {
    width: options.width ?? 10,
    ascii: options.ascii ?? false,
    color: options.color ?? process.stderr.isTTY
  };

  if (!usage) {
    return "Codex usage: waiting for token_count";
  }

  const parts = [
    ["5h", usage.primary?.usedPercent ?? 0, "orange"],
    ["W", usage.secondary?.usedPercent ?? 0, "blue"],
    ["Ctx", usage.contextPercent ?? 0, "green"]
  ].map(([label, percent, baseColor]) => {
    const color = pickColor(baseColor, percent);
    const bar = colorize(makeBar(percent, renderOptions), color, renderOptions.color);
    return `${label} [${bar}]${Math.round(percent)}%`;
  });

  return parts.join("  ");
}

export function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}
