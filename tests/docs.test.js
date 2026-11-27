import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("Pages workflow builds dist and deploys it", () => {
  const workflow = read(".github/workflows/deploy.yml");
  for (const needle of [
    "npm ci",
    "npm test",
    "npm run build",
    "actions/upload-pages-artifact@v3",
    "path: dist",
    "actions/deploy-pages@v4",
  ]) {
    assert.ok(workflow.includes(needle), `missing ${needle}`);
  }
});

test("iOS guide has final URL and user test checklist", () => {
  const guide = read("docs/IOS.md");
  for (const needle of [
    "https://zhtech703-debug.github.io",
    "Tambahkan ke Layar Utama",
    "[ ] Buka https://zhtech703-debug.github.io di Safari",
    "[ ] Matikan internet",
    "Google Drive",
    "zhtech703@gmail.com",
    "bila tersedia",
    "Downloads",
  ]) {
    assert.ok(guide.includes(needle), `missing ${needle}`);
  }
});

test("handoff docs require a site-root repository", () => {
  const pages = read("docs/GITHUB_PAGES.md");
  for (const needle of [
    "prepare-web-export",
    "<username>.github.io",
    "git push -u origin main",
    "Settings → Pages",
    "https://zhtech703-debug.github.io",
    "key.properties",
  ]) {
    assert.ok(pages.includes(needle), `missing ${needle}`);
  }
});

test("Lynk kit has paste-ready web button copy", () => {
  const lynk = read("docs/monetization/promo-kit/LYNK_ID.md");
  assert.ok(lynk.includes("Web app untuk iPhone/iPad"));
  assert.ok(lynk.includes("https://zhtech703-debug.github.io"));
});

test("README links the iOS guide", () => {
  assert.ok(read("README.md").includes("docs/IOS.md"));
});

test("test script uses Node 22-compatible discovery", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.test, "node --test");
});
