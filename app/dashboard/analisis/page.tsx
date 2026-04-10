"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Bell,
  BrainCircuit,
  Loader2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Activity,
  RefreshCw,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

/* -- Types -------------------------------------------------- */

type CategoryStatus = "baik" | "perlu_perhatian" | "kritis";

interface CategoryItem {
  kategori: string;
  status: CategoryStatus;
  temuan: string;
  rekomendasi: string;
}

interface AnalysisResult {
  ringkasan: string;
  kategoriUtama: CategoryItem[];
  skorKesehatan: number;
  tindakanSegera: string[];
}

interface TaskSummary {
  total: number;
  done: number;
  inProgress: number;
  waiting: number;
  darurat: number;
}

/* -- Helpers ----------------------------------------------- */

function todayString() {
  const d = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<CategoryStatus, { label: string; bg: string; color: string; border: string; icon: typeof CheckCircle2 }> = {
  baik:            { label: "Baik",            bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC", icon: CheckCircle2 },
  perlu_perhatian: { label: "Perlu Perhatian", bg: "#FFFBEB", color: "#D97706", border: "#FCD34D", icon: AlertTriangle },
  kritis:          { label: "Kritis",          bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5", icon: ShieldAlert },
};

function HealthGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 75 ? "#16A34A" : clamped >= 50 ? "#D97706" : "#DC2626";
  const label = clamped >= 75 ? "Baik" : clamped >= 50 ? "Cukup" : "Perlu Perbaikan";
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r="52" fill="none" stroke="#E5E7EB" strokeWidth="12" />
          <circle
            cx="70" cy="70" r="52"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{clamped}</span>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>/100</span>
        </div>
      </div>
      <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

function CategoryCard({ item }: { item: CategoryItem }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.perlu_perhatian;
  const Ic = cfg.icon;
  return (
    <div className="flex flex-col rounded-xl overflow-hidden"
      style={{ border: `1.5px solid ${cfg.border}`, background: "#FFFFFF", boxShadow: "0 2px 8px #00000010" }}>
      <button
        className="flex items-center justify-between text-left w-full"
        style={{ padding: "14px 18px", background: cfg.bg, border: "none", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <Ic size={16} color={cfg.color} />
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.kategori}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full" style={{ padding: "2px 10px", background: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: cfg.color }}>
            {cfg.label}
          </span>
          {open ? <ChevronUp size={14} color="#6B7280" /> : <ChevronDown size={14} color="#6B7280" />}
        </div>
      </button>
      {open && (
        <div className="flex flex-col gap-3" style={{ padding: "14px 18px" }}>
          <div>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>Temuan</span>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#374151", marginTop: 4, lineHeight: 1.6 }}>{item.temuan}</p>
          </div>
          <div>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>Rekomendasi</span>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#374151", marginTop: 4, lineHeight: 1.6 }}>{item.rekomendasi}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* -- Page -------------------------------------------------- */

const FOCUS_OPTIONS = [
  { value: "",                                    label: "Analisis Umum" },
  { value: "prioritas darurat dan tugas mendesak", label: "Prioritas & Urgensi" },
  { value: "kecepatan dan efisiensi penyelesaian", label: "Kecepatan Kerja" },
  { value: "distribusi jenis tugas dan area",      label: "Jenis & Area Tugas" },
  { value: "tren performa dan pola kerja",         label: "Tren Performa" },
];

export default function DashboardAnalisisPage() {
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAI, setLoadingAI]   = useState(false);
  const [dataError, setDataError]   = useState<string | null>(null);
  const [aiError, setAiError]       = useState<string | null>(null);
  const [analysis, setAnalysis]     = useState<AnalysisResult | null>(null);
  const [focus, setFocus]           = useState("");
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  /* -- Fetch summary from my-tasks -------------------------- */
  const fetchData = useCallback(async () => {
    try {
      setDataError(null);
      const res = await fetch("/api/tasks/my-tasks");
      if (!res.ok) throw new Error("Gagal memuat data tugas");
      const data = await res.json();
      const tasks = data.tasks ?? [];
      setTaskSummary({
        total:      tasks.length,
        done:       tasks.filter((t: { status: string }) => t.status === "done").length,
        inProgress: tasks.filter((t: { status: string }) => t.status === "progress").length,
        waiting:    tasks.filter((t: { status: string }) => t.status === "menunggu").length,
        darurat:    tasks.filter((t: { prioritas: string }) => t.prioritas === "darurat").length,
      });
    } catch (e: unknown) {
      setDataError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* -- Run AI ----------------------------------------------- */
  const runAnalysis = async () => {
    setLoadingAI(true);
    setAiError(null);
    try {
      const res = await fetch("/api/tasks/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mendapatkan analisis");
      if (json.error) throw new Error(json.error);
      if (json.analysis) {
        setAnalysis(json.analysis as AnalysisResult);
        setLastAnalyzed(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      } else {
        setAiError("Respons AI tidak valid. Coba lagi.");
      }
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Gagal mendapatkan analisis");
    } finally {
      setLoadingAI(false);
    }
  };

  /* -- Loading / Error states ------------------------------- */
  if (loadingData) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
        <DashboardSidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin" color="#15803D" />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>Memuat data tugas...</span>
          </div>
        </main>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
        <DashboardSidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle size={36} color="#EF4444" />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#EF4444" }}>{dataError}</span>
            <button onClick={() => { setLoadingData(true); fetchData(); }} className="rounded-lg"
              style={{ padding: "8px 20px", background: "#15803D", color: "#FFFFFF", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600 }}>
              Coba Lagi
            </button>
          </div>
        </main>
      </div>
    );
  }

  const efficiency = taskSummary && taskSummary.total > 0
    ? Math.round((taskSummary.done / taskSummary.total) * 100)
    : 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
      <DashboardSidebar />

      <main className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <div className="flex items-center justify-between pl-14 pr-4 sm:pl-8 sm:pr-8"
          style={{ background: "#FFFFFF", height: 70, flexShrink: 0, boxShadow: "0 1px 6px #00000010" }}>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#111827" }}>Analisis AI</span>
              <span className="flex items-center gap-1 rounded-full" style={{ padding: "3px 10px", background: "#F0FDF4", fontSize: 11, fontFamily: "var(--font-inter)", fontWeight: 600, color: "#15803D" }}>
                <Sparkles size={10} /> Gemini
              </span>
            </div>
            <span className="hidden sm:block" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
              {todayString()} • Analisis performa kerjamu berbasis AI
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => { setLoadingData(true); fetchData(); }}
              className="flex items-center justify-center rounded-[10px]"
              style={{ width: 38, height: 38, background: "#F9FAFB", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <RefreshCw size={15} color="#374151" />
            </button>
            <div className="relative flex items-center justify-center rounded-[10px]"
              style={{ width: 38, height: 38, background: "#F9FAFB", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <Bell size={17} color="#374151" />
              <span className="absolute rounded-full" style={{ width: 8, height: 8, background: "#EF4444", top: 6, right: 6 }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto" style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { Icon: ClipboardList, iconBg: "#DBEAFE", iconColor: "#2563EB", label: "Total Tugas",   value: String(taskSummary?.total ?? 0) },
              { Icon: CheckCircle2,  iconBg: "#DCFCE7", iconColor: "#16A34A", label: "Selesai",       value: String(taskSummary?.done ?? 0) },
              { Icon: ShieldAlert,   iconBg: "#FEE2E2", iconColor: "#EF4444", label: "Darurat",       value: String(taskSummary?.darurat ?? 0) },
              { Icon: TrendingUp,    iconBg: "#FEF3C7", iconColor: "#D97706", label: "Efisiensi",     value: `${efficiency}%` },
            ].map(({ Icon, iconBg, iconColor, label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl"
                style={{ background: "#FFFFFF", padding: "18px 20px", boxShadow: "0 2px 8px #00000012" }}>
                <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 46, height: 46, background: iconBg }}>
                  <Icon size={22} color={iconColor} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>{value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI PANEL + RESULTS */}
          <div className="flex flex-col lg:flex-row gap-5">

            {/* LEFT — Control Panel */}
            <div className="flex flex-col gap-4 rounded-2xl w-full lg:w-[300px] lg:shrink-0"
              style={{ background: "#FFFFFF", padding: 24, boxShadow: "0 2px 10px #00000012" }}>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: "#F0FDF4" }}>
                  <BrainCircuit size={20} color="#15803D" />
                </div>
                <div>
                  <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>Analisis Performa</span>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280", margin: 0 }}>Didukung Gemini 1.5 Flash</p>
                </div>
              </div>

              <div style={{ height: 1, background: "#F3F4F6" }} />

              {/* Focus selector */}
              <div className="flex flex-col gap-2">
                <label style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "#374151" }}>Fokus Analisis</label>
                <div className="flex flex-col gap-1.5">
                  {FOCUS_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setFocus(opt.value)}
                      className="flex items-center gap-2 rounded-[8px] text-left"
                      style={{
                        padding: "9px 12px",
                        border: focus === opt.value ? "1.5px solid #15803D" : "1.5px solid #E5E7EB",
                        background: focus === opt.value ? "#F0FDF4" : "#F9FAFB",
                        cursor: "pointer",
                      }}>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: focus === opt.value ? 700 : 400, color: focus === opt.value ? "#15803D" : "#374151" }}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: "#F3F4F6" }} />

              {/* Data summary */}
              <div className="flex flex-col gap-2 rounded-xl" style={{ background: "#F9FAFB", padding: "12px 14px" }}>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>Data tugasmu</span>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "Total",      value: taskSummary?.total ?? 0 },
                    { label: "Selesai",    value: taskSummary?.done ?? 0 },
                    { label: "Berjalan",   value: taskSummary?.inProgress ?? 0 },
                    { label: "Menunggu",   value: taskSummary?.waiting ?? 0 },
                    { label: "Efisiensi",  value: `${efficiency}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: "#111827" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analyze button */}
              <button onClick={runAnalysis} disabled={loadingAI || !taskSummary || taskSummary.total === 0}
                className="flex items-center justify-center gap-2 rounded-[10px]"
                style={{
                  padding: "12px 0",
                  background: loadingAI ? "#94A3B8" : "#15803D",
                  border: "none",
                  cursor: loadingAI || !taskSummary || taskSummary.total === 0 ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}>
                {loadingAI
                  ? <Loader2 size={16} color="#FFFFFF" className="animate-spin" />
                  : <Sparkles size={16} color="#FFFFFF" />}
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>
                  {loadingAI ? "Menganalisis..." : "Jalankan Analisis"}
                </span>
              </button>

              {lastAnalyzed && !loadingAI && (
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
                  Terakhir: {lastAnalyzed}
                </span>
              )}
            </div>

            {/* RIGHT — Results */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">

              {aiError && (
                <div className="flex items-start gap-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", padding: "14px 18px" }}>
                  <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 700, color: "#DC2626" }}>Analisis gagal</span>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#991B1B", margin: "4px 0 0" }}>{aiError}</p>
                    {aiError.includes("GEMINI_API_KEY") && (
                      <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#991B1B", marginTop: 4 }}>
                        Minta admin untuk menambahkan <code style={{ background: "#FEE2E2", padding: "1px 4px", borderRadius: 4 }}>GEMINI_API_KEY</code> ke konfigurasi server.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {loadingAI && (
                <div className="flex flex-col gap-4 rounded-2xl" style={{ background: "#FFFFFF", padding: 24, boxShadow: "0 2px 10px #00000012" }}>
                  <div className="flex items-center gap-3">
                    <BrainCircuit size={20} color="#15803D" className="animate-pulse" />
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#15803D" }}>Gemini sedang menganalisis tugasmu...</span>
                  </div>
                  {[120, 80, 160, 100].map((w, i) => (
                    <div key={i} className="animate-pulse rounded-lg" style={{ height: 14, width: `${w}px`, maxWidth: "100%", background: "#E5E7EB" }} />
                  ))}
                </div>
              )}

              {!loadingAI && !analysis && !aiError && (
                <div className="flex flex-col items-center justify-center rounded-2xl gap-4"
                  style={{ background: "#FFFFFF", padding: "48px 24px", boxShadow: "0 2px 10px #00000012", flex: 1 }}>
                  <div className="flex items-center justify-center rounded-2xl" style={{ width: 72, height: 72, background: "#F0FDF4" }}>
                    <BrainCircuit size={36} color="#15803D" />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 17, fontWeight: 700, color: "#111827" }}>Siap Menganalisis</span>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280", textAlign: "center", maxWidth: 320 }}>
                      Pilih fokus analisis di kiri, lalu klik &quot;Jalankan Analisis&quot; untuk mendapatkan insight dari Gemini tentang performa kerjamu.
                    </span>
                  </div>
                </div>
              )}

              {!loadingAI && analysis && (
                <>
                  {/* Score + Summary */}
                  <div className="flex flex-col sm:flex-row gap-5 rounded-2xl" style={{ background: "#FFFFFF", padding: 24, boxShadow: "0 2px 10px #00000012" }}>
                    <div className="flex justify-center sm:justify-start">
                      <HealthGauge score={analysis.skorKesehatan} />
                    </div>
                    <div className="flex flex-col gap-3 flex-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Activity size={15} color="#15803D" />
                          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>Skor Performa Kerjamu</span>
                        </div>
                        <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>{analysis.ringkasan}</p>
                      </div>

                      {analysis.tindakanSegera.length > 0 && (
                        <div className="flex flex-col gap-2 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FCD34D", padding: "12px 14px" }}>
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle size={13} color="#D97706" />
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.04em" }}>Tindakan Segera</span>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {analysis.tindakanSegera.map((a, i) => (
                              <li key={i} style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Cards */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={15} color="#15803D" />
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>Analisis per Kategori</span>
                    </div>
                    {analysis.kategoriUtama.map((item, i) => (
                      <CategoryCard key={i} item={item} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
