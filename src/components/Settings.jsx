import { useEffect, useState } from "react";
import {
  BarChart3,
  Cloud,
  CreditCard,
  Download,
  Globe,
  HardDrive,
  HelpCircle,
  Info,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Lock,
  PieChart,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { useFinance } from "../lib/store";
import { accentPalettes } from "../data";
import { formatRupiah } from "../lib/format";
import { useInstallState, promptInstall, getInstallMenuState } from "../lib/install";
import { isIOS } from "../lib/platform";
import { SheetShell, FormField, TextInput, Toggle, CancelButton, SubmitButton, ErrorNote, InfoNote } from "./SheetKit";
import WalletCardSheet from "./WalletCardSheet";

export default function Settings({
  onOpenData,
  onOpenExport,
  onOpenCloud,
  onNavigate,
  onNotify,
}) {
  const { settings, updateSettings, debts, totalBalance } = useFinance();
  const [profileOpen, setProfileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [name, setName] = useState(settings.name);
  const [incomeTarget, setIncomeTarget] = useState(String(settings.incomeTarget));
  const [savingsTarget, setSavingsTarget] = useState(String(settings.savingsTargetPercent));
  const [emergencyMonths, setEmergencyMonths] = useState(String(settings.emergencyFundMonths));
  const [error, setError] = useState("");
  const install = useInstallState();
  const installMenu = getInstallMenuState({ ...install, ios: isIOS() });

  useEffect(() => {
    setName(settings.name);
    setIncomeTarget(String(settings.incomeTarget));
    setSavingsTarget(String(settings.savingsTargetPercent));
    setEmergencyMonths(String(settings.emergencyFundMonths));
  }, [settings]);

  function handleSaveProfile(event) {
    event.preventDefault();
    const income = Math.max(Math.round(Number(incomeTarget) || 0), 0);
    const savings = Math.min(Math.max(Math.round(Number(savingsTarget) || 0), 0), 100);
    const emergency = Math.min(Math.max(Math.round(Number(emergencyMonths) || 0), 0), 24);
    if (!name.trim()) {
      setError("Nama pengguna wajib diisi.");
      return;
    }
    updateSettings({
      name: name.trim(),
      incomeTarget: income,
      savingsTargetPercent: savings,
      emergencyFundMonths: emergency,
    });
    setError("");
    setProfileOpen(false);
    onNotify?.("Profil keuangan disimpan.");
  }

  async function handleInstall() {
    if (installMenu.notice) {
      onNotify?.(installMenu.notice);
      return;
    }

    const result = await promptInstall();
    if (result.outcome === "accepted") {
      onNotify?.("ZhKas ditambahkan ke layar utama.");
    } else if (result.outcome === "dismissed") {
      onNotify?.("Instalasi dibatalkan.");
    } else {
      onNotify?.("Instalasi belum tersedia di browser ini.");
    }
  }

  return (
    <div className="fold-column min-h-full">
      <header className="px-5 pt-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Preferensi</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.045em] text-white">
              Atur<span className="text-glacier">.</span>
            </h1>
            <p className="mt-2 text-[10px] font-medium text-slate-500">
              Profil, budget, data, dan sinkronisasi.
            </p>
          </div>
          <div className="mt-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] border border-white/20 bg-[linear-gradient(145deg,#cceaff,#5f9fd9_58%,#244260)] text-[13px] font-bold text-[#071523] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
            {(settings.name || "Z").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <section className="mt-6 px-5">
        <div className="relative overflow-hidden rounded-[30px] border border-sky-200/[0.11] bg-[linear-gradient(145deg,#102D50_0%,#0A1D34_48%,#07111F_100%)] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,.9)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
          />
          <div className="relative flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[17px] border border-white/20 bg-[linear-gradient(145deg,#cceaff,#5f9fd9_58%,#244260)] text-[15px] font-bold text-[#071523]">
              {(settings.name || "Z").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white">
                {settings.name}
              </p>
              <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                {debts.length} catatan hutang · {totalBalance >= 0 ? "saldo" : "minus"}{" "}
                {formatRupiah(totalBalance)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[8.5px] font-semibold text-slate-300 transition hover:bg-white/[0.08]"
            >
              Edit profil
            </button>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4 text-center">
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                Target pendapatan
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200 tabular-nums">
                {formatRupiah(settings.incomeTarget)}
              </p>
            </div>
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                Target tabungan
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200 tabular-nums">
                {settings.savingsTargetPercent}%
              </p>
            </div>
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                Dana darurat
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200 tabular-nums">
                {settings.emergencyFundMonths} bulan
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 px-5">
        <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Keuangan
        </p>
        <div className="space-y-2">
          <MenuRow
            icon={CreditCard}
            title="Kartu sumber dana"
            description="Tambah, ubah, dan hapus kartu dompet bank."
            onClick={() => setWalletOpen(true)}
          />
          <MenuRow
            icon={PieChart}
            title="Budget bulanan"
            description="Atur batas pengeluaran per kategori."
            onClick={() => onNavigate("budgets")}
          />
          <MenuRow
            icon={BarChart3}
            title="Rekap & grafik"
            description="Arus kas, kategori, dan tren."
            onClick={() => onNavigate("recap")}
          />
          <MenuRow
            icon={Landmark}
            title="Buku hutang"
            description="Piutang & hutang, pelunasan."
            onClick={() => onNavigate("debts")}
          />
        </div>
      </section>

      <section className="mt-5 px-5">
        <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Data & perangkat
        </p>
        <div className="space-y-2">
          <MenuRow
            icon={HardDrive}
            title="Backup & pulihkan"
            description="JSON / .zhkas terenkripsi."
            onClick={onOpenData}
          />
          <MenuRow
            icon={Download}
            title="Ekspor Word / Excel"
            description="Mutasi, rekap bulanan, buku hutang."
            onClick={onOpenExport}
          />
          <MenuRow
            icon={Cloud}
            title="Sinkronisasi Google Drive"
            description="Backup privat di Drive appDataFolder."
            onClick={onOpenCloud}
          />
          <MenuRow
            icon={Smartphone}
            title="Instal aplikasi"
            description={installMenu.description}
            onClick={handleInstall}
            disabled={installMenu.disabled}
          />
        </div>
      </section>

      <section className="mt-5 px-5">
        <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Tampilan
        </p>
        <div className="space-y-2">
          <div className="rounded-[20px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.042),rgba(255,255,255,.015))] px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border border-white/[0.055] bg-white/[0.035] text-glacier">
                  <LayoutDashboard size={16} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-semibold text-slate-200">
                    Mode gelap / terang
                  </span>
                  <span className="mt-0.5 block text-[8.5px] font-medium text-slate-500">
                    {settings.theme === "light" ? "Terang" : "Gelap"}
                  </span>
                </span>
              </div>
              <div className="flex gap-1.5">
                {["dark", "light"].map((mode) => {
                  const active = settings.theme === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        updateSettings({ theme: mode })
                      }
                      className={`rounded-full border px-3 py-1.5 text-[8.5px] font-semibold transition ${
                        active
                          ? "accent-submit border-transparent"
                          : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-white"
                      }`}
                    >
                      {mode === "dark" ? "Gelap" : "Terang"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.042),rgba(255,255,255,.015))] px-3.5 py-3">
            <p className="text-[10.5px] font-semibold text-slate-200">
              Warna aksen
            </p>
            <p className="mt-0.5 text-[8.5px] font-medium text-slate-500">
              Pilih warna dasar rekomendasi.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Object.entries(accentPalettes).map(([key, palette]) => {
                const active = settings.accent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateSettings({ accent: key })}
                    className={`flex items-center gap-2 rounded-[14px] border px-2.5 py-2 text-left transition ${
                      active
                        ? "border-sky-200/40 bg-sky-300/[0.08]"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    }`}
                  >
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-white/20"
                      style={{
                        background:
                          settings.theme === "light"
                            ? palette.lightColor
                            : palette.color,
                      }}
                    />
                    <span className="truncate text-[8px] font-semibold text-slate-300">
                      {palette.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 px-5">
        <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Tentang aplikasi
        </p>
        <div className="space-y-2">
          <MenuRow
            icon={ShieldCheck}
            title="Mode aman"
            description="Tanpa bank API, PIN, OTP, atau kredensial."
            onClick={() =>
              onNotify?.(
                "ZhKas tidak pernah meminta PIN, OTP, password bank, atau akses SMS.",
              )
            }
          />
          <MenuRow
            icon={HelpCircle}
            title="Bantuan"
            description="Impor CSV, backup, dan ekspor."
            onClick={() =>
              onNotify?.(
                "Gunakan menu Data untuk backup/pulih, Transaksi untuk impor CSV, Rekap untuk ekspor.",
              )
            }
          />
          <MenuRow
            icon={Info}
            title="ZhKas v0.2.0"
            description="Personal finance · ZhStoreLsw Corp."
            onClick={() =>
              onNotify?.("ZhKas · dibuat untuk pengelolaan kas pribadi.")
            }
          />
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="relative overflow-hidden rounded-[26px] border border-[#D9A84E]/20 bg-[linear-gradient(135deg,rgba(217,168,78,0.12),rgba(13,31,55,0.3))] p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#D9A84E]/15 blur-3xl"
          />
          <div className="relative flex items-center gap-3">
            <img
              src="/branding/zhkas-mark.png"
              alt="ZhStoreLsw Corp."
              className="h-12 w-12 shrink-0 rounded-[14px] border border-white/10 object-cover shadow-[0_8px_24px_-8px_rgba(0,0,0,.7)]"
            />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#D9A84E]">
                Developer
              </p>
              <p className="mt-0.5 text-[12px] font-semibold text-white">
                ZhStoreLsw Corp.
              </p>
              <p className="mt-0.5 text-[8.5px] font-medium text-slate-400">
                Aplikasi dikembangkan untuk pengelolaan kas pribadi yang aman dan
                sederhana.
              </p>
            </div>
          </div>
        </div>
      </section>

      <WalletCardSheet
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onNotify={onNotify}
      />

      <ProfileSheet
        open={profileOpen}
        name={name}
        incomeTarget={incomeTarget}
        savingsTarget={savingsTarget}
        emergencyMonths={emergencyMonths}
        error={error}
        onNameChange={setName}
        onIncomeChange={setIncomeTarget}
        onSavingsChange={setSavingsTarget}
        onEmergencyChange={setEmergencyMonths}
        onClose={() => setProfileOpen(false)}
        onSubmit={handleSaveProfile}
      />
    </div>
  );
}

function MenuRow({ icon: Icon, title, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-[20px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.042),rgba(255,255,255,.015))] px-3.5 py-3 text-left transition hover:border-white/[0.12] hover:bg-white/[0.05] active:scale-[0.99] ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border border-white/[0.055] bg-white/[0.035] text-glacier">
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-semibold text-slate-200">
          {title}
        </span>
        <span className="mt-0.5 block text-[8.5px] font-medium text-slate-500">
          {description}
        </span>
      </span>
      <span className="text-slate-600">›</span>
    </button>
  );
}

function ProfileSheet({
  open,
  name,
  incomeTarget,
  savingsTarget,
  emergencyMonths,
  error,
  onNameChange,
  onIncomeChange,
  onSavingsChange,
  onEmergencyChange,
  onClose,
  onSubmit,
}) {
  return (
    <SheetShell
      open={open}
      onClose={onClose}
      label="Profil keuangan"
      title="Profil keuangan"
      subtitle="Atur nama dan target agar saran keuangan lebih relevan."
      badge={
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/15 bg-sky-300/[0.08] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-glacier">
          <User size={10} strokeWidth={2.1} />
          Profil
        </span>
      }
    >
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <FormField id="profile-name" label="Nama pengguna" icon={User}>
          <TextInput
            id="profile-name"
            value={name}
            onChange={onNameChange}
            placeholder="Nama kamu"
            maxLength={40}
          />
        </FormField>

        <FormField
          id="profile-income"
          label="Pendapatan acuan bulanan"
          icon={Wallet}
          hint="Dipakai untuk saran 50/30/20 dan rasio hutang."
        >
          <input
            id="profile-income"
            type="text"
            inputMode="numeric"
            value={new Intl.NumberFormat("id-ID").format(Number(incomeTarget) || 0)}
            onChange={(event) =>
              onIncomeChange(event.target.value.replace(/\D/g, "").slice(0, 12))
            }
            placeholder="0"
            className="mt-1.5 w-full bg-transparent text-[12px] font-medium text-white outline-none placeholder:text-slate-600"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-2">
          <FormField
            id="profile-savings"
            label="Target tabungan"
            icon={Sparkles}
            hint="Persen dari pemasukan."
          >
            <input
              id="profile-savings"
              type="number"
              min="0"
              max="100"
              value={savingsTarget}
              onChange={(event) => onSavingsChange(event.target.value)}
              className="mt-1.5 w-full bg-transparent text-[12px] font-medium text-white outline-none placeholder:text-slate-600"
            />
          </FormField>
          <FormField
            id="profile-emergency"
            label="Dana darurat"
            icon={ShieldCheck}
            hint="Jumlah bulan biaya hidup."
          >
            <input
              id="profile-emergency"
              type="number"
              min="0"
              max="24"
              value={emergencyMonths}
              onChange={(event) => onEmergencyChange(event.target.value)}
              className="mt-1.5 w-full bg-transparent text-[12px] font-medium text-white outline-none placeholder:text-slate-600"
            />
          </FormField>
        </div>

        <ErrorNote>{error}</ErrorNote>

        <InfoNote>
          Semua pengaturan disimpan lokal. Tidak ada data yang dikirim ke
          server.
        </InfoNote>

        <div className="mt-5 flex items-center gap-2.5">
          <CancelButton onClick={onClose} />
          <SubmitButton>Simpan profil</SubmitButton>
        </div>
      </form>
    </SheetShell>
  );
}
