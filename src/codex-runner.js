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

export function runCodex(args) {
  const resolved = resolveCodexCommand();
  const child = spawn(resolved.command, [...resolved.args, ...args], {
    stdio: "inherit",
    env: process.env
  });

  return child;
}
