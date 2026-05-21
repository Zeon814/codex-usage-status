import fs from "node:fs";
import { spawn } from "node:child_process";
import { getCodexJsPath } from "./paths.js";

export function resolveCodexCommand() {
  const explicit = process.env.CODEX_BIN;
  if (explicit) {
    return { command: explicit, args: [] };
  }

  const codexJs = getCodexJsPath();
  if (codexJs && fs.existsSync(codexJs)) {
    return { command: process.execPath, args: [codexJs] };
  }

  return { command: process.platform === "win32" ? "codex.cmd" : "codex", args: [] };
}

export function prepareCodexArgs(args, options = {}) {
  const hasAltScreenFlag = args.includes("--no-alt-screen") || args.includes("--codex-alt-screen");
  const normalized = args.filter((arg) => arg !== "--codex-alt-screen");

  if (!options.codexAltScreen && !hasAltScreenFlag) {
    return ["--no-alt-screen", ...normalized];
  }

  return normalized;
}

export function runCodex(args, options = {}) {
  const resolved = resolveCodexCommand();
  const codexArgs = prepareCodexArgs(args, options);
  const child = spawn(resolved.command, [...resolved.args, ...codexArgs], {
    stdio: "inherit",
    env: process.env
  });

  return child;
}
