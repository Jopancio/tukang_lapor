"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MapPin,
  Tag,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Eye,
  ClipboardList,
  Zap,
  Leaf,
  TriangleAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RestrictedPopup from "@/components/RestrictedPopup";

/* --- TYPES ---------------------------------------------------- */

interface Laporan {
  id: string;
  reporter_name: string;
  lokasi: string;
  kategori: string;
  deskripsi: string;
  urgency: string;
  status: string;
  foto_url: string | null;
  created_at: string;
}

type StatusFilter = "semua" | "baru" | "proses" | "selesai";

/* --- HELPERS -------------------------------------------------- */

const KATEGORI_LABEL: Record<string, string> = {
  kebersihan_kelas: "Kebersihan Kelas",
  kebersihan_toilet: "Kebersihan Toilet",
  kebersihan_koridor: "Kebersihan Koridor",
  kebersihan_kantin: "Kebersihan Kantin",
  kebersihan_halaman: "Kebersihan Halaman",
  kerusakan_fasilitas: "Kerusakan Fasilitas",
  sampah_menumpuk: "Sampah Menumpuk",
  lainnya: "Lainnya",
};

function statusConfig(s: string) {
  switch (s) {
    case "baru":
      return { label: "Baru", bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", Icon: Clock };
    case "proses":
      return { label: "Diproses", bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA", Icon: Loader2 };
    case "selesai":
      return { label: "Selesai", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", Icon: CheckCircle2 };
    default:
      return { label: s, bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB", Icon: Clock };
  }
}

function urgencyConfig(u: string) {
  switch (u) {
    case "darurat":
      return { label: "DARURAT", bg: "#FEF2F2", color: "#EF4444", Icon: TriangleAlert };
    case "segera":
      return { label: "SEGERA", bg: "#FFF7ED", color: "#F97316", Icon: Zap };
    default:
      return { label: "NORMAL", bg: "#F0FDF4", color: "#16A34A", Icon: Leaf };
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* --- PAGE COMPONENT ------------------------------------------- */

export default function GuestDashboardPage() {
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  /* -- Fetch laporan by name -------------------------------- */
  const fetchLaporan = useCallback(async (searchName: string) => {
    if (searchName.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/laporan/guest?name=${encodeURIComponent(searchName.trim())}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setLaporan(data.laporan ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  /* -- Realtime subscription -------------------------------- */
  useEffect(() => {
    if (!submittedName) return;

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("guest-laporan-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "laporan" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const l = payload.new as Laporan;
            if (l.reporter_name.toLowerCase() === submittedName.toLowerCase()) {
              setLaporan((prev) => [l, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const l = payload.new as Laporan;
            if (l.reporter_name.toLowerCase() === submittedName.toLowerCase()) {
              setLaporan((prev) =>
                prev.map((p) => (p.id === l.id ? l : p))
              );
            }
          } else if (payload.eventType === "DELETE") {
            const d = payload.old as { id: string };
            setLaporan((prev) => prev.filter((p) => p.id !== d.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submittedName]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Masukkan minimal 2 karakter untuk mencari");
      return;
    }
    setSubmittedName(name.trim());
    fetchLaporan(name);
  }

  /* -- Derived data ----------------------------------------- */
  const baruCount = laporan.filter((l) => l.status === "baru").length;
  const prosesCount = laporan.filter((l) => l.status === "proses").length;
  const selesaiCount = laporan.filter((l) => l.status === "selesai").length;

  const visible = laporan.filter((l) => {
    return activeFilter === "semua" || l.status === activeFilter;
  });

  /* --- RENDER ------------------------------------------------- */
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      <Suspense fallback={null}>
        <RestrictedPopup />
      </Suspense>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 sm:px-8"
        style={{
          height: 60,
          background: "#FFFFFF",
          borderBottom: "1px solid #F3F4F6",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={18} color="#15803D" />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: 15,
              fontWeight: 700,
              color: "#15803D",
            }}
          >
            Tukang Lapor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/lapor"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              fontWeight: 600,
              color: "#15803D",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 8,
              padding: "6px 14px",
              textDecoration: "none",
            }}
          >
            + Lapor Baru
          </Link>
          <Link
            href="/login"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              fontWeight: 500,
              color: "#6B7280",
              textDecoration: "none",
            }}
          >
            Masuk
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-10" style={{ gap: 24 }}>
        {/* Header */}
        <div className="flex flex-col items-center text-center" style={{ maxWidth: 520, gap: 8 }}>
          <div
            className="flex items-center gap-2"
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 20,
              padding: "5px 14px",
            }}
          >
            <Eye size={13} color="#15803D" />
            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                fontWeight: 600,
                color: "#15803D",
              }}
            >
              Pantau Laporan Kamu
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "clamp(22px, 5vw, 30px)",
              fontWeight: 700,
              color: "#0D0D0D",
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            Dashboard Pelapor
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              color: "#6B7280",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Masukkan nama kamu untuk melihat riwayat dan status laporan yang pernah kamu kirim.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="flex items-center w-full gap-3"
          style={{ maxWidth: 520 }}
        >
          <div
            className="flex items-center gap-2 flex-1"
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1.5px solid #E5E7EB",
              padding: "11px 16px",
              boxShadow: "0 2px 8px #00000008",
            }}
          >
            <Search size={16} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Masukkan nama kamu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "#111827",
                flex: 1,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
            style={{
              padding: "11px 20px",
              borderRadius: 12,
              background: "#15803D",
              color: "#FFFFFF",
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Cari
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 w-full"
            style={{
              maxWidth: 520,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            <AlertTriangle size={16} color="#DC2626" />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#B91C1C" }}>
              {error}
            </span>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div className="flex flex-col w-full" style={{ maxWidth: 680, gap: 20 }}>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { Icon: ClipboardList, iconColor: "#2563EB", iconBg: "#DBEAFE", title: "Total Laporan", value: laporan.length },
                { Icon: Clock, iconColor: "#EA580C", iconBg: "#FFEDD5", title: "Baru", value: baruCount },
                { Icon: Loader2, iconColor: "#D97706", iconBg: "#FEF3C7", title: "Diproses", value: prosesCount },
                { Icon: CheckCircle2, iconColor: "#16A34A", iconBg: "#DCFCE7", title: "Selesai", value: selesaiCount },
              ].map(({ Icon, iconColor, iconBg, title, value }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-xl"
                  style={{
                    background: "#FFFFFF",
                    padding: "14px 16px",
                    boxShadow: "0 2px 8px #00000010",
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 38, height: 38, background: iconBg }}
                  >
                    <Icon size={18} color={iconColor} />
                  </div>
                  <div className="flex flex-col">
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280" }}>
                      {title}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk)",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  { key: "semua" as StatusFilter, label: "Semua", count: laporan.length },
                  { key: "baru" as StatusFilter, label: "Baru", count: baruCount },
                  { key: "proses" as StatusFilter, label: "Diproses", count: prosesCount },
                  { key: "selesai" as StatusFilter, label: "Selesai", count: selesaiCount },
                ] as const
              ).map(({ key, label, count }) => {
                const active = activeFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className="rounded-lg"
                    style={{
                      padding: "6px 14px",
                      border: active ? "1.5px solid #15803D" : "1.5px solid #E5E7EB",
                      background: active ? "#F0FDF4" : "#FFFFFF",
                      fontFamily: "var(--font-inter)",
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      color: active ? "#15803D" : "#6B7280",
                      cursor: "pointer",
                    }}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Laporan list */}
            {visible.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: "48px 24px",
                  boxShadow: "0 2px 8px #00000010",
                }}
              >
                <FileText size={36} color="#D1D5DB" />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                  {laporan.length === 0
                    ? `Belum ada laporan dari "${submittedName}".`
                    : "Tidak ada laporan yang sesuai filter."}
                </span>
                {laporan.length === 0 && (
                  <Link
                    href="/lapor"
                    className="flex items-center gap-2"
                    style={{
                      marginTop: 8,
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: "#15803D",
                      color: "#FFFFFF",
                      fontFamily: "var(--font-inter)",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Buat Laporan Pertama <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visible.map((l) => {
                  const sc = statusConfig(l.status);
                  const uc = urgencyConfig(l.urgency);
                  const isExpanded = expandedId === l.id;
                  return (
                    <div
                      key={l.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: "#FFFFFF",
                        boxShadow: "0 2px 8px #00000010",
                        border: `1px solid ${sc.border}`,
                      }}
                    >
                      {/* Card header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : l.id)}
                        className="flex items-start gap-3 w-full text-left"
                        style={{
                          padding: "16px 18px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {/* Status icon */}
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{
                            width: 36,
                            height: 36,
                            background: sc.bg,
                            marginTop: 2,
                          }}
                        >
                          <sc.Icon size={16} color={sc.color} />
                        </div>

                        <div className="flex flex-col flex-1 gap-1" style={{ minWidth: 0 }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              {KATEGORI_LABEL[l.kategori] ?? l.kategori}
                            </span>
                            <span
                              className="rounded-full"
                              style={{
                                padding: "2px 8px",
                                background: sc.bg,
                                fontFamily: "var(--font-inter)",
                                fontSize: 10,
                                fontWeight: 700,
                                color: sc.color,
                              }}
                            >
                              {sc.label}
                            </span>
                            <span
                              className="rounded-full"
                              style={{
                                padding: "2px 8px",
                                background: uc.bg,
                                fontFamily: "var(--font-inter)",
                                fontSize: 10,
                                fontWeight: 700,
                                color: uc.color,
                              }}
                            >
                              {uc.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className="flex items-center gap-1"
                              style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}
                            >
                              <MapPin size={11} /> {l.lokasi}
                            </span>
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>
                              {timeAgo(l.created_at)}
                            </span>
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronUp size={16} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 4 }} />
                        ) : (
                          <ChevronDown size={16} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 4 }} />
                        )}
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: "0 18px 16px",
                            borderTop: "1px solid #F3F4F6",
                          }}
                        >
                          <div className="flex flex-col gap-3" style={{ paddingTop: 14 }}>
                            {/* Description */}
                            <div className="flex flex-col gap-1">
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#6B7280" }}>
                                Deskripsi
                              </span>
                              <p
                                style={{
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 13,
                                  color: "#374151",
                                  lineHeight: 1.6,
                                  margin: 0,
                                }}
                              >
                                {l.deskripsi}
                              </p>
                            </div>

                            {/* Photo */}
                            {l.foto_url && (
                              <div className="flex flex-col gap-1">
                                <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#6B7280" }}>
                                  Foto Bukti
                                </span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={l.foto_url}
                                  alt="Bukti laporan"
                                  style={{
                                    width: "100%",
                                    maxHeight: 240,
                                    objectFit: "cover",
                                    borderRadius: 10,
                                    border: "1px solid #E5E7EB",
                                  }}
                                />
                              </div>
                            )}

                            {/* Meta */}
                            <div className="flex items-center gap-4 flex-wrap" style={{ paddingTop: 4 }}>
                              <span
                                className="flex items-center gap-1"
                                style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}
                              >
                                <Tag size={11} /> {KATEGORI_LABEL[l.kategori] ?? l.kategori}
                              </span>
                              <span
                                className="flex items-center gap-1"
                                style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}
                              >
                                <Clock size={11} /> {formatDate(l.created_at)}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="flex flex-col gap-1" style={{ paddingTop: 4 }}>
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#6B7280" }}>
                                Progress
                              </span>
                              <div className="flex items-center gap-2">
                                {["baru", "proses", "selesai"].map((step, idx) => {
                                  const steps = ["baru", "proses", "selesai"];
                                  const currentIdx = steps.indexOf(l.status);
                                  const isDone = idx <= currentIdx;
                                  const stepLabel = step === "baru" ? "Diterima" : step === "proses" ? "Diproses" : "Selesai";
                                  return (
                                    <div key={step} className="flex items-center gap-2 flex-1">
                                      <div className="flex flex-col items-center gap-1 flex-1">
                                        <div
                                          className="rounded-full"
                                          style={{
                                            width: "100%",
                                            height: 6,
                                            background: isDone ? "#16A34A" : "#E5E7EB",
                                            borderRadius: 3,
                                          }}
                                        />
                                        <span
                                          style={{
                                            fontFamily: "var(--font-inter)",
                                            fontSize: 10,
                                            fontWeight: isDone ? 600 : 400,
                                            color: isDone ? "#16A34A" : "#9CA3AF",
                                          }}
                                        >
                                          {stepLabel}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Initial state - before search */}
        {!searched && !loading && (
          <div className="flex flex-col items-center gap-4" style={{ paddingTop: 24 }}>
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 80, height: 80, background: "#F0FDF4", border: "2px solid #BBF7D0" }}
            >
              <Search size={32} color="#16A34A" />
            </div>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "#9CA3AF",
                textAlign: "center",
                maxWidth: 340,
                lineHeight: 1.6,
              }}
            >
              Cari laporan kamu dengan memasukkan nama yang kamu gunakan saat membuat laporan.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="flex items-center justify-center"
        style={{
          padding: "16px",
          borderTop: "1px solid #F3F4F6",
          background: "#FFFFFF",
        }}
      >
        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>
          © 2026 Tukang Lapor — Sistem Pelaporan Kebersihan Sekolah
        </span>
      </footer>
    </div>
  );
}
