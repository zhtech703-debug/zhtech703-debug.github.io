import test, { after } from "node:test";
import assert from "node:assert/strict";
import { isIOS } from "../src/lib/platform.js";

const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
function setNavigator(value) {
  Object.defineProperty(globalThis, "navigator", { value, configurable: true });
}
after(() => {
  if (original) Object.defineProperty(globalThis, "navigator", original);
  else delete globalThis.navigator;
});

test("detects iPhone", () => {
  setNavigator({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
  });
  assert.equal(isIOS(), true);
});

test("detects iPadOS desktop user agent", () => {
  setNavigator({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
    maxTouchPoints: 5,
  });
  assert.equal(isIOS(), true);
});

test("does not detect Android", () => {
  setNavigator({
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
    maxTouchPoints: 5,
  });
  assert.equal(isIOS(), false);
});

test("does not detect desktop", () => {
  setNavigator({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    maxTouchPoints: 0,
  });
  assert.equal(isIOS(), false);
});
