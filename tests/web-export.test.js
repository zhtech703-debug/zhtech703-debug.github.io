import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  existsSync,
  rmSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareWebExport } from "../scripts/prepare-web-export.mjs";

test("web export omits Android signing material", () => {
  const dest = mkdtempSync(join(tmpdir(), "zhkas-web-"));
  try {
    prepareWebExport(dest);
    assert.ok(existsSync(join(dest, "src", "App.jsx")));
    assert.ok(existsSync(join(dest, "public", "manifest.webmanifest")));
    assert.ok(existsSync(join(dest, ".github", "workflows", "deploy.yml")));
    assert.ok(existsSync(join(dest, "tests", "backup.test.js")));
    assert.ok(existsSync(join(dest, "scripts", "prepare-web-export.mjs")));
    assert.ok(existsSync(join(dest, "docs", "GITHUB_PAGES.md")));
    assert.ok(
      existsSync(join(dest, "docs", "monetization", "promo-kit", "LYNK_ID.md")),
    );
    const ignore = readFileSync(join(dest, ".gitignore"), "utf8");
    assert.ok(ignore.includes("node_modules"));
    assert.ok(ignore.includes("dist"));
    assert.equal(existsSync(join(dest, "android")), false);
    assert.equal(existsSync(join(dest, "android", "key.properties")), false);
    assert.equal(existsSync(join(dest, "android", "zhkas-upload.keystore")), false);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test("web export purges stale signing files from a reused destination", () => {
  const dest = mkdtempSync(join(tmpdir(), "zhkas-web-stale-"));
  try {
    mkdirSync(join(dest, "android"));
    writeFileSync(join(dest, "android", "key.properties"), "stale");
    writeFileSync(join(dest, "android", "zhkas-upload.keystore"), "stale");
    writeFileSync(join(dest, "stale.txt"), "stale");

    prepareWebExport(dest);

    assert.equal(existsSync(join(dest, "android")), false);
    assert.equal(existsSync(join(dest, "android", "key.properties")), false);
    assert.equal(
      existsSync(join(dest, "android", "zhkas-upload.keystore")),
      false,
    );
    assert.equal(existsSync(join(dest, "stale.txt")), false);
    assert.ok(existsSync(join(dest, "src", "App.jsx")));
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test("web export refuses the repository root as destination", () => {
  assert.throws(() => prepareWebExport(process.cwd()));
});
