import test from "node:test";
import assert from "node:assert/strict";
import { makeBar, renderOneLine, renderUsage } from "../src/renderer.js";

test("makeBar renders bounded unicode bars", () => {
  assert.equal(makeBar(50, { width: 10 }), "█████░░░░░");
  assert.equal(makeBar(150, { width: 10 }), "██████████");
  assert.equal(makeBar(-20, { width: 10 }), "░░░░░░░░░░");
});

test("makeBar supports ascii mode", () => {
  assert.equal(makeBar(25, { width: 8, ascii: true }), "##------");
});

test("renderUsage uses context token count, not cumulative total", () => {
  const usage = {
    totalTokens: 1_500_000,
    contextTokens: 129_200,
    contextWindow: 258_400,
    contextPercent: 50,
    primary: { usedPercent: 43, resetsAt: 1779344766 },
    secondary: { usedPercent: 18, resetsAt: 1779844490 }
  };

  const output = renderUsage(usage, { width: 10, ascii: true, color: false });
  assert.match(output, /Ctx\s+\[#####-----\]\s+50% 129k \/ 258k/);
});

test("renderOneLine contains all three bars", () => {
  const usage = {
    contextTokens: 10,
    contextWindow: 100,
    contextPercent: 10,
    primary: { usedPercent: 20 },
    secondary: { usedPercent: 30 }
  };

  const output = renderOneLine(usage, { width: 5, ascii: true, color: false });
  assert.match(output, /5h/);
  assert.match(output, /W/);
  assert.match(output, /Ctx/);
});
