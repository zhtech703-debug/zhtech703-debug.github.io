import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Plus } from "lucide-react";
import AddTransactionSheet from "./components/AddTransactionSheet";
import BottomNav from "./components/BottomNav";
import BudgetSheet from "./components/BudgetSheet";
import Budgets from "./components/Budgets";
import CloudSheet from "./components/CloudSheet";
import DataSheet from "./components/DataSheet";
import Debts from "./components/Debts";
import DetailSheet from "./components/DetailSheet";
import ExportSheet from "./components/ExportSheet";
import ImportCsvSheet from "./components/ImportCsvSheet";
import Overview from "./components/Overview";
import Recap from "./components/Recap";
import Settings from "./components/Settings";
import StatusBar from "./components/StatusBar";
import Toast from "./components/Toast";
import Transactions from "./components/Transactions";
import { useFinance } from "./lib/store";
import { accentPalettes } from "./data";
import { formatRupiah } from "./lib/format";

export default function App() {
  const { deleteTransaction, settings } = useFinance();
  const [activeTab, setActiveTab] = useState("overview");
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [toast, setToast] = useState(null);
  const [transactionFilter, setTransactionFilter] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [addSheet, setAddSheet] = useState({ open: false, type: "expense" });
  const [importOpen, setImportOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const scrollRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const isNative =
    typeof window !== "undefined" &&
    (Boolean(window.Capacitor?.isNativePlatform?.()) ||
      Boolean(window.matchMedia?.("(display-mode: standalone)").matches) ||
      Boolean(window.navigator?.standalone));
  const [wide, setWide] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 720px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 720px)");
    function handleChange(event) {
      pendingScrollRef.current = scrollRef.current?.scrollTop ?? null;
      setWide(event.matches);
    }
    if (query.addEventListener) query.addEventListener("change", handleChange);
    else query.addListener(handleChange);
    return () => {
      if (query.removeEventListener)
        query.removeEventListener("change", handleChange);
      else query.removeListener(handleChange);
    };
  }, []);

  const [foldMotion, setFoldMotion] = useState("");
  const firstWideRef = useRef(true);

  useEffect(() => {
    if (firstWideRef.current) {
      firstWideRef.current = false;
      return undefined;
    }
    setFoldMotion(wide ? "open" : "close");
    const timer = window.setTimeout(() => setFoldMotion(""), 720);
    return () => window.clearTimeout(timer);
  }, [wide]);

  useLayoutEffect(() => {
    if (pendingScrollRef.current === null) return;
    const position = pendingScrollRef.current;
    pendingScrollRef.current = null;
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = position;
    });
  }, [wide]);

  const notify = useCallback((message) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const theme = settings?.theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", theme);
    const palette = accentPalettes[settings?.accent] ?? accentPalettes.glacier;
    const isLight = theme === "light";
    const accentColor = isLight ? palette.lightColor : palette.color;
    root.style.setProperty("--color-glacier", accentColor);
    root.style.setProperty("--accent", accentColor);
    root.style.setProperty(
      "--accent-soft",
      isLight ? palette.lightSoft : palette.soft,
    );
    root.style.setProperty(
      "--accent-contrast",
      isLight ? "#FFFFFF" : palette.contrast,
    );
  }, [settings?.theme, settings?.accent]);

  const closeDetail = useCallback(() => {
    setSelectedTransaction(null);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeTab]);

  function navigate(tab) {
    if (tab === activeTab && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setActiveTab(tab);
  }

  function openCategory(category) {
    setTransactionFilter(category);
    setSearchQuery("");
    setActiveTab("transactions");
  }

  function showAllTransactions() {
    setTransactionFilter("semua");
    setSearchQuery("");
    setActiveTab("transactions");
  }

  const openAddSheet = useCallback((type = "expense") => {
    setSelectedTransaction(null);
    setAddSheet({ open: true, type });
  }, []);

  const closeAddSheet = useCallback(() => {
    setAddSheet((current) => ({ ...current, open: false }));
  }, []);

  const openImportSheet = useCallback(() => {
    setSelectedTransaction(null);
    setAddSheet((current) => ({ ...current, open: false }));
    setImportOpen(true);
  }, []);

  const openDataSheet = useCallback(() => {
    setSelectedTransaction(null);
    setAddSheet((current) => ({ ...current, open: false }));
    setImportOpen(false);
    setDataOpen(true);
  }, []);

  const openExportSheet = useCallback(() => {
    setSelectedTransaction(null);
    setExportOpen(true);
  }, []);

  const openCloudSheet = useCallback(() => {
    setSelectedTransaction(null);
    setCloudOpen(true);
  }, []);

  function handleTransactionSaved(transaction) {
    closeAddSheet();
    notify(
      `${transaction.name} tersimpan · ${transaction.type === "income" ? "+" : "−"}${formatRupiah(transaction.amount)}`,
    );
  }

  function handleDeleteTransaction(id) {
    const transaction = selectedTransaction;
    deleteTransaction(id);
    setSelectedTransaction(null);
    notify(`${transaction?.name ?? "Transaksi"} dihapus dari perangkat ini.`);
  }

  function handleBudgetSaved(message) {
    notify(message);
  }

  return (
    <div
      className={`relative flex zhkas-app-shell w-full items-center justify-center overflow-hidden bg-[#03060B] text-white sm:p-4 ${
        wide ? "zhkas-wide items-stretch" : ""
      }`}
    >
      <DesktopBackdrop />

      <div
        className={
          wide
            ? "relative h-full w-full max-w-[1600px]"
            : "relative zhkas-phone-frame h-full w-full sm:w-[432px] sm:rounded-[47px] sm:bg-[linear-gradient(155deg,rgba(255,255,255,0.16),rgba(255,255,255,0.025)_38%,rgba(255,255,255,0.08))] sm:p-px sm:shadow-[0_55px_140px_-35px_rgba(0,0,0,0.95),0_0_80px_rgba(62,142,210,0.06)]"
        }
      >
        <div
          className={`relative flex h-full w-full flex-col overflow-hidden bg-[#060A12] ${
            wide ? "" : "sm:rounded-[46px]"
          }`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[340px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(72,146,214,0.17),rgba(72,146,214,0.03)_48%,transparent_74%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:linear-gradient(to_bottom,black,transparent_58%)]"
          />

          {isNative && (
            <div
              aria-hidden="true"
              className="native-top-space shrink-0"
              style={{ height: "max(env(safe-area-inset-top, 0px), 28px)" }}
            />
          )}
          {!isNative && <StatusBar />}
          <div
            aria-hidden="true"
            className="top-shade pointer-events-none absolute inset-x-0 top-0 z-0 h-[72px] bg-[linear-gradient(to_bottom,#060A12_0%,#060A12_38%,rgba(6,10,18,0.88)_70%,transparent_100%)]"
          />

          <div
            ref={scrollRef}
            className="app-scroll relative z-10 flex-1 overflow-y-auto overscroll-contain"
          >
            <div key={activeTab} className="tab-in min-h-full pb-32">
              {activeTab === "overview" && (
                <Overview
                  showBalance={showBalance}
                  onToggleBalance={() => setShowBalance((current) => !current)}
                  onNavigate={navigate}
                  onAddTransaction={openAddSheet}
                  onImportCsv={openImportSheet}
                  onOpenData={openDataSheet}
                  onOpenExport={openExportSheet}
                  onOpenCloud={openCloudSheet}
                  onNotify={notify}
                  onSelectTransaction={setSelectedTransaction}
                  onShowAllTransactions={showAllTransactions}
                />
              )}
              {activeTab === "transactions" && (
                <Transactions
                  activeFilter={transactionFilter}
                  onFilterChange={setTransactionFilter}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectTransaction={setSelectedTransaction}
                />
              )}
              {activeTab === "recap" && (
                <Recap onOpenExport={openExportSheet} onNotify={notify} />
              )}
              {activeTab === "debts" && <Debts onNotify={notify} />}
              {activeTab === "budgets" && (
                <Budgets
                  onOpenCategory={openCategory}
                  onOpenBudget={() => setBudgetOpen(true)}
                  onNotify={notify}
                />
              )}
              {activeTab === "settings" && (
                <Settings
                  onOpenData={openDataSheet}
                  onOpenExport={openExportSheet}
                  onOpenCloud={openCloudSheet}
                  onNavigate={navigate}
                  onNotify={notify}
                />
              )}
            </div>
          </div>

          <div className="nav-dock pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#05080F] via-[#05080F]/90 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-10">
            <div className="pointer-events-auto">
              <BottomNav
                activeTab={activeTab}
                onChange={navigate}
                wide={wide}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => openAddSheet("expense")}
            aria-label="Catat transaksi baru"
            className="add-fab accent-fab absolute bottom-[calc(env(safe-area-inset-bottom)+96px)] right-5 z-50 grid h-12 w-12 place-items-center rounded-full transition active:scale-95"
          >
            <Plus size={21} strokeWidth={2.4} />
          </button>

          {foldMotion && (
            <div
              aria-hidden="true"
              className={`fold-transition fold-${foldMotion}`}
            >
              <span className="fold-half fold-left" />
              <span className="fold-half fold-right" />
              <span className="fold-crease" />
            </div>
          )}

          <Toast toast={toast} />
          <DetailSheet
            transaction={selectedTransaction}
            onClose={closeDetail}
            onDelete={handleDeleteTransaction}
            onNotify={notify}
          />
          <AddTransactionSheet
            open={addSheet.open}
            initialType={addSheet.type}
            onClose={closeAddSheet}
            onSaved={handleTransactionSaved}
          />
          <ImportCsvSheet
            open={importOpen}
            onClose={() => setImportOpen(false)}
          />
          <DataSheet open={dataOpen} onClose={() => setDataOpen(false)} />
          <BudgetSheet
            open={budgetOpen}
            onClose={() => setBudgetOpen(false)}
            onSaved={handleBudgetSaved}
          />
          <ExportSheet
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            onNotify={notify}
          />
          <CloudSheet
            open={cloudOpen}
            onClose={() => setCloudOpen(false)}
            onNotify={notify}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-10 left-12 hidden 2xl:block">
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/25">
          ZhKas / Personal finance
        </p>
        <p className="mt-2 text-[11px] font-light text-white/15">
          Uang rapi. Pikiran tenang.
        </p>
      </div>
      <div className="pointer-events-none absolute right-12 top-12 hidden text-right 2xl:block">
        <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/20">
          Rp · 33 days · Glacier
        </p>
        <p className="mt-2 text-[11px] font-light text-white/15">
          Concept prototype · 2026
        </p>
      </div>
    </div>
  );
}

function DesktopBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(47,118,184,0.12),transparent_38%),radial-gradient(circle_at_78%_84%,rgba(89,199,244,0.055),transparent_28%),radial-gradient(circle_at_18%_18%,rgba(76,132,226,0.055),transparent_30%)]" />
      <div className="desktop-grid absolute inset-0" />
      <div className="orb-float absolute left-[calc(50%-410px)] top-[14%] h-64 w-64 rounded-full bg-sky-400/[0.07] blur-[100px]" />
      <div
        className="orb-float absolute bottom-[7%] right-[calc(50%-420px)] h-72 w-72 rounded-full bg-[#5BC8FF]/[0.05] blur-[110px]"
        style={{ animationDelay: "-4s" }}
      />
      <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.025]" />
      <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]" />
    </div>
  );
}
