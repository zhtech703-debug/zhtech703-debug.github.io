import test from "node:test";
import assert from "node:assert/strict";
import { getInstallMenuState } from "../src/lib/install.js";

const base = { canInstall: false, standalone: false, ios: false };

test("standalone state is already installed", () => {
  assert.deepEqual(getInstallMenuState({ ...base, standalone: true }), {
    title: "Instal aplikasi",
    description: "ZhKas sudah terpasang.",
    disabled: true,
    notice: null,
  });
});

test("Chromium install prompt stays available", () => {
  assert.deepEqual(getInstallMenuState({ ...base, canInstall: true }), {
    title: "Instal aplikasi",
    description: "Tambahkan ke layar utama.",
    disabled: false,
    notice: null,
  });
});

test("iOS Safari gets Add to Home Screen instructions", () => {
  assert.deepEqual(getInstallMenuState({ ...base, ios: true }), {
    title: "Instal aplikasi",
    description: "Di iPhone/iPad: ketuk Bagikan → Tambahkan ke Layar Utama.",
    disabled: false,
    notice:
      "Ketuk tombol Bagikan di Safari, lalu pilih Tambahkan ke Layar Utama.",
  });
});

test("other browsers keep the existing Chrome hint", () => {
  assert.deepEqual(getInstallMenuState(base), {
    title: "Instal aplikasi",
    description: "Gunakan Chrome untuk instalasi.",
    disabled: true,
    notice: null,
  });
});
