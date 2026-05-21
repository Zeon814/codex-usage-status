import test from "node:test";
import assert from "node:assert/strict";
import { prepareCodexArgs } from "../src/codex-runner.js";

test("prepareCodexArgs defaults to inline Codex output", () => {
  assert.deepEqual(prepareCodexArgs(["--model", "gpt-5.5"]), ["--no-alt-screen", "--model", "gpt-5.5"]);
});

test("prepareCodexArgs does not duplicate no-alt-screen", () => {
  assert.deepEqual(prepareCodexArgs(["--no-alt-screen"]), ["--no-alt-screen"]);
});

test("prepareCodexArgs supports native alt screen escape hatch", () => {
  assert.deepEqual(prepareCodexArgs(["--codex-alt-screen", "--model", "gpt-5.5"]), ["--model", "gpt-5.5"]);
});
