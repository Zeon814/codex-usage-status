#!/usr/bin/env node
import process from "node:process";
import { runCodex } from "./codex-runner.js";
import { readLatestUsage } from "./usage-reader.js";
import { renderOneLine, renderUsage, stripAnsi } from "./renderer.js";

function parseOptions(args) {
  const options = {
    width: 20,
    interval: 2000,
    ascii: false,
    color: process.stderr.isTTY,
    oneLine: false,
    title: false,
    codexAltScreen: false
  };
  const rest = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--width") {
      options.width = Number(args[++i] ?? options.width);
    } else if (arg === "--interval") {
      options.interval = Number(args[++i] ?? options.interval);
    } else if (arg === "--ascii") {
      options.ascii = true;
    } else if (arg === "--no-color") {
      options.color = false;
    } else if (arg === "--color") {
      options.color = true;
    } else if (arg === "--one-line") {
      options.oneLine = true;
    } else if (arg === "--title") {
      options.title = true;
    } else if (arg === "--codex-alt-screen") {
      options.codexAltScreen = true;
      rest.push(arg);
    } else {
      rest.push(arg);
    }
  }

  return { options, rest };
}

function usageText() {
  return `codex-usage-status

Usage:
  codex-status status [--width N] [--ascii] [--no-color]
  codex-status watch [--width N] [--interval MS] [--one-line]
  codex-status run [codex args...]
  codex-status [codex args...]

Commands:
  status   Print the latest Codex usage bars and exit.
  watch    Refresh the usage bars in place.
  run      Launch Codex CLI and show a live usage status line.

Run mode passes --no-alt-screen to Codex by default so the bars stay visible.
Use --codex-alt-screen if you prefer Codex's native full-screen TUI.

Environment:
  CODEX_HOME  Override the Codex home directory. Defaults to ~/.codex.
  CODEX_BIN   Override the Codex executable used by the run command.
`;
}

function printStatus(options) {
  const usage = readLatestUsage();
  const output = options.oneLine ? renderOneLine(usage, options) : renderUsage(usage, options);
  process.stdout.write(`${output}\n`);
}

function startWatch(options) {
  let last = "";
  const render = () => {
    const usage = readLatestUsage();
    const output = options.oneLine ? renderOneLine(usage, options) : renderUsage(usage, options);
    if (output === last) {
      return;
    }
    last = output;
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(`${output}\n`);
  };

  render();
  const timer = setInterval(render, Math.max(250, options.interval));
  process.on("SIGINT", () => {
    clearInterval(timer);
    process.stdout.write("\n");
    process.exit(130);
  });
}

function setTerminalTitle(text) {
  if (process.stderr.isTTY) {
    process.stderr.write(`\x1b]0;${stripAnsi(text)}\x07`);
  }
}

function startStatusTicker(options, child) {
  let last = "";
  let lastColumns = process.stderr.columns ?? process.stdout.columns ?? 0;
  const render = () => {
    const usage = readLatestUsage();
    const output = renderOneLine(usage, { ...options, width: Math.min(options.width, 12) });
    const columns = process.stderr.columns ?? process.stdout.columns ?? 0;
    const resized = columns !== lastColumns;
    lastColumns = columns;

    if (output === last && !resized) {
      if (!options.title) {
        process.stderr.write(`\r\x1b[2K${output}`);
      }
      return;
    }
    last = output;
    setTerminalTitle(output);

    if (!options.title) {
      process.stderr.write(`\r\x1b[2K${output}`);
    }
  };

  const timer = setInterval(render, Math.max(500, options.interval));
  render();
  process.stderr.on?.("resize", render);
  process.stdout.on?.("resize", render);
  child.once("exit", () => {
    clearInterval(timer);
    process.stderr.off?.("resize", render);
    process.stdout.off?.("resize", render);
    if (!options.title) {
      process.stderr.write("\n");
    }
  });
}

function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "run";

  if (command === "help" || rawArgs[0] === "--help" || rawArgs[0] === "-h") {
    process.stdout.write(usageText());
    return;
  }

  if (command === "status") {
    const { options } = parseOptions(rawArgs.slice(1));
    printStatus(options);
    return;
  }

  if (command === "watch") {
    const { options } = parseOptions(rawArgs.slice(1));
    startWatch(options);
    return;
  }

  const runArgs = command === "run" ? rawArgs.slice(1) : rawArgs;
  const { options, rest } = parseOptions(runArgs);
  const child = runCodex(rest, options);
  startStatusTicker(options, child);
}

main();
