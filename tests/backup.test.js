import test from "node:test";
import assert from "node:assert/strict";
import { saveBytes, shareBytes } from "../src/lib/backup.js";

const bytes = new TextEncoder().encode("zhkas");
const base = { fileName: "zhkas.json", bytes, mime: "application/json" };
const calls = [];
const shareYes = async () => {
  calls.push("share");
  return true;
};
const shareNo = async () => {
  calls.push("share");
  return false;
};
const downloadNull = async () => {
  calls.push("download");
  return null;
};
const downloadPath = async () => {
  calls.push("download");
  return "Documents/ZhKas/zhkas.json";
};

test("iOS prefers share sheet and skips download", async () => {
  calls.length = 0;
  const result = await saveBytes({
    ...base,
    preferShare: true,
    deps: { shareBytes: shareYes, downloadBytes: downloadNull },
  });
  assert.deepEqual(result, { outcome: "shared" });
  assert.deepEqual(calls, ["share"]);
});

test("iOS falls back to saved native path", async () => {
  calls.length = 0;
  const result = await saveBytes({
    ...base,
    preferShare: true,
    deps: { shareBytes: shareNo, downloadBytes: downloadPath },
  });
  assert.deepEqual(result, {
    outcome: "saved",
    path: "Documents/ZhKas/zhkas.json",
  });
  assert.deepEqual(calls, ["share", "download"]);
});

test("iOS falls back to browser download", async () => {
  calls.length = 0;
  const result = await saveBytes({
    ...base,
    preferShare: true,
    deps: { shareBytes: shareNo, downloadBytes: downloadNull },
  });
  assert.deepEqual(result, { outcome: "downloaded" });
  assert.deepEqual(calls, ["share", "download"]);
});

test("iOS share cancellation is reported without downloading", async () => {
  calls.length = 0;
  const result = await saveBytes({
    ...base,
    preferShare: true,
    deps: {
      shareBytes: async () => {
        calls.push("share");
        return "cancelled";
      },
      downloadBytes: downloadNull,
    },
  });
  assert.deepEqual(result, { outcome: "cancelled" });
  assert.deepEqual(calls, ["share"]);
});

test("shareBytes reports AbortError as cancelled, not shared", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      canShare: () => true,
      share: async () => {
        const error = new Error("dibatalkan");
        error.name = "AbortError";
        throw error;
      },
    },
  });
  try {
    const result = await shareBytes({
      fileName: "zhkas.json",
      bytes,
      mime: "application/json",
    });
    assert.equal(result, "cancelled");
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else delete globalThis.navigator;
  }
});

test("Android keeps download-first behavior", async () => {
  calls.length = 0;
  const result = await saveBytes({
    ...base,
    preferShare: false,
    deps: { shareBytes: shareYes, downloadBytes: downloadNull },
  });
  assert.deepEqual(result, { outcome: "downloaded" });
  assert.deepEqual(calls, ["download"]);
});
