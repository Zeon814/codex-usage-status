import os from "node:os";
import path from "node:path";

export function getCodexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

export function getSessionsDir(codexHome = getCodexHome()) {
  return path.join(codexHome, "sessions");
}

export function getCodexJsPath() {
  const appData = process.env.APPDATA;
  if (appData) {
    return path.join(appData, "npm", "node_modules", "@openai", "codex", "bin", "codex.js");
  }
  return null;
}
