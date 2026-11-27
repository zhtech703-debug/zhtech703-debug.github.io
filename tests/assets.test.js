import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("iOS startup image exists with expected dimensions", () => {
  const png = readFileSync("public/icons/apple-touch-startup-image.png");
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1242);
  assert.equal(png.readUInt32BE(20), 2688);
});
