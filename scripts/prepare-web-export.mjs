import { cpSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Daftar putih: hanya aset web yang boleh masuk repo publik. `android/`,
// `key.properties`, dan `*.keystore` sengaja tidak pernah disalin.
const INCLUDES = [
  ".gitignore",
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.js",
  "src",
  "tests",
  "scripts/prepare-web-export.mjs",
  "public",
  ".github",
  "docs/IOS.md",
  "docs/GITHUB_PAGES.md",
  "docs/monetization/promo-kit/LYNK_ID.md",
  "README.md",
];

export function prepareWebExport(dest) {
  const target = resolve(dest);

  // Jangan pernah menghapus repo sumber atau induknya.
  if (target === ROOT || ROOT.startsWith(`${target}${sep}`)) {
    throw new Error("Tujuan ekspor tidak boleh repo sumber atau induknya.");
  }
  // Di dalam repo hanya folder web-export yang boleh dibersihkan.
  if (target.startsWith(`${ROOT}${sep}`) && basename(target) !== "web-export") {
    throw new Error("Di dalam repo, tujuan ekspor harus bernama web-export.");
  }

  // Bersihkan tujuan: file lama (terutama kunci Android) tidak boleh ikut
  // ter-push bila perintah dijalankan ulang pada folder yang sudah ada.
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  for (const entry of INCLUDES) {
    cpSync(join(ROOT, entry), join(target, entry), { recursive: true });
  }

  return target;
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const dest = process.argv[2] ?? "web-export";
  console.log(`Ekspor web bersih siap di: ${prepareWebExport(dest)}`);
}
