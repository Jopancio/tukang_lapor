"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  Inbox,
  Filter,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  User,
  ChevronDown,
  ChevronUp,
  ScanSearch,
  Eye,
  EyeOff,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { createClient } from "@/lib/supabase/client";

/* ─── DETECTION TYPES ───────────────────────────────────────── */

interface Detection {
  label: string;
  confidence: number;
  box: { x: number; y: number; w: number; h: number };
}

/* ─── ANNOTATED IMAGE COMPONENT ─────────────────────────────── */

function AnnotatedImage({ fotoUrl, savedAnnotations }: { fotoUrl: string; savedAnnotations?: Detection[] | null }) {
  const [detections, setDetections] = useState<Detection[]>(savedAnnotations ?? []);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(!!savedAnnotations && savedAnnotations.length >= 0);
  const [showBoxes, setShowBoxes] = useState(true);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/laporan/annotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foto_url: fotoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menganalisis");
      setDetections(json.detections ?? []);
      setAnalyzed(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menganalisis gambar");
    } finally {
      setAnalyzing(false);
    }
  }

  const BOX_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899"];

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Image container with overlays */}
      <div
        ref={containerRef}
        style={{ position: "relative", display: "inline-block", width: "100%", overflow: "hidden", borderRadius: 8 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotoUrl}
          alt="Foto laporan"
          style={{
            width: "100%",
            maxHeight: 400,
            objectFit: "cover",
            display: "block",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            background: "#F9FAFB",
          }}
        />

        {/* Bounding box overlays */}
        {analyzed && showBoxes && detections.map((d, i) => {
          const color = BOX_COLORS[i % BOX_COLORS.length];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${d.box.x}%`,
                top: `${d.box.y}%`,
                width: `${d.box.w}%`,
                height: `${d.box.h}%`,
                border: `2.5px solid ${color}`,
                borderRadius: 4,
                pointerEvents: "none",
                boxShadow: `0 0 0 1px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.3)`,
              }}
            >
              {/* Label inside top of box */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  background: color,
                  color: "#FFFFFF",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "0 0 4px 0",
                  whiteSpace: "nowrap",
                  lineHeight: 1.4,
                  letterSpacing: 0.2,
                }}
              >
                {d.label} {Math.round(d.confidence * 100)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
        {!analyzed ? (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1.5px solid #BFDBFE",
              background: "#EFF6FF",
              color: "#2563EB",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 12,
              fontWeight: 600,
              cursor: analyzing ? "wait" : "pointer",
              opacity: analyzing ? 0.7 : 1,
            }}
          >
            {analyzing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ScanSearch size={13} />
            )}
            {analyzing ? "Menganalisis..." : "Deteksi Sampah"}
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 8,
                border: showBoxes ? "1.5px solid #BBF7D0" : "1.5px solid #E5E7EB",
                background: showBoxes ? "#F0FDF4" : "#F9FAFB",
                color: showBoxes ? "#16A34A" : "#6B7280",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {showBoxes ? <Eye size={13} /> : <EyeOff size={13} />}
              {showBoxes ? "Sembunyikan" : "Tampilkan"} Anotasi
            </button>
            <span
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 11,
                color: detections.length > 0 ? "#DC2626" : "#16A34A",
                fontWeight: 600,
              }}
            >
              {detections.length > 0
                ? `${detections.length} sampah terdeteksi`
                : "Tidak ada sampah terdeteksi"}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 7,
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                color: "#6B7280",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 11,
                fontWeight: 500,
                cursor: analyzing ? "wait" : "pointer",
              }}
            >
              <RefreshCw size={11} className={analyzing ? "animate-spin" : ""} />
              Ulang
            </button>
          </>
        )}
      </div>

      {/* Detection list */}
      {analyzed && showBoxes && detections.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          style={{ marginTop: 8 }}
        >
          {detections.map((d, i) => {
            const color = BOX_COLORS[i % BOX_COLORS.length];
            return (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: `${color}14`,
                  border: `1px solid ${color}40`,
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: color,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {d.label}
              </span>
            );
          })}
        </div>
      )}

      {error && (
        <span
          style={{
            display: "block",
            marginTop: 6,
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            fontSize: 11,
            color: "#DC2626",
          }}
        >
          {error}
        </span>
      )}

      <a
        href={fotoUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "var(--font-inter, Inter, sans-serif)",
          fontSize: 11,
          color: "#9CA3AF",
          display: "block",
          marginTop: 4,
        }}
      >
        Klik untuk buka full size
      </a>
    </div>
  );
}

/* ─── TYPES ─────────────────────────────────────────────────── */

interface Laporan {
  id: string;
  reporter_name: string;
  lokasi: string;
  kategori: string;
  deskripsi: string;
  urgency: string;
  status: string;
  foto_url: string | null;
  annotations: Detection[] | null;
  created_at: string;
}

/* ─── CONSTANTS ─────────────────────────────────────────────── */

const URGENCY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  darurat: { bg: "#FEE2E2", color: "#DC2626", label: "DARURAT" },
  segera: { bg: "#FFEDD5", color: "#EA580C", label: "SEGERA" },
  normal: { bg: "#F0FDF4", color: "#16A34A", label: "NORMAL" },
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  baru: { bg: "#EFF6FF", color: "#2563EB", label: "Baru" },
  diproses: { bg: "#FFF7ED", color: "#EA580C", label: "Diproses" },
  selesai: { bg: "#F0FDF4", color: "#16A34A", label: "Selesai" },
};

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

const STATUS_FILTERS = ["semua", "baru", "diproses", "selesai"];

/* ─── HELPERS ───────────────────────────────────────────────── */

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  return `${Math.floor(hrs / 24)}h lalu`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayString() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── LAPORAN CARD ───────────────────────────────────────────── */

function LaporanCard({
  laporan,
  onStatusChange,
}: {
  laporan: Laporan;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const urgencyStyle = URGENCY_STYLE[laporan.urgency] ?? URGENCY_STYLE.normal;
  const statusStyle = STATUS_STYLE[laporan.status] ?? STATUS_STYLE.baru;

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch("/api/laporan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: laporan.id, status: newStatus }),
      });
      if (res.ok) {
        onStatusChange(laporan.id, newStatus);
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        border: laporan.urgency === "darurat" ? "1.5px solid #FECACA" : "1px solid #F3F4F6",
        overflow: "hidden",
      }}
    >
      {/* Card Header */}
      <div
        className="flex items-start gap-3 cursor-pointer"
        style={{ padding: "16px 20px" }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Urgency dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: urgencyStyle.color,
            marginTop: 5,
            flexShrink: 0,
          }}
        />

        <div className="flex-1 flex flex-col" style={{ gap: 6, minWidth: 0 }}>
          {/* Row 1: name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {laporan.reporter_name}
            </span>

            <span
              style={{
                background: urgencyStyle.bg,
                color: urgencyStyle.color,
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                letterSpacing: 0.3,
              }}
            >
              {urgencyStyle.label}
            </span>

            <span
              style={{
                background: statusStyle.bg,
                color: statusStyle.color,
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {statusStyle.label}
            </span>
          </div>

          {/* Row 2: lokasi + kategori */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              <MapPin size={11} />
              {laporan.lokasi}
            </span>
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              <Tag size={11} />
              {KATEGORI_LABEL[laporan.kategori] ?? laporan.kategori}
            </span>
          </div>

          {/* Row 3: time */}
          <span
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 11,
              color: "#9CA3AF",
            }}
          >
            {formatDate(laporan.created_at)}
          </span>
        </div>

        {/* Expand toggle */}
        {expanded ? (
          <ChevronUp size={16} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 2 }} />
        ) : (
          <ChevronDown size={16} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 2 }} />
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid #F3F4F6",
            padding: "16px 20px",
            background: "#FAFAFA",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 13,
              color: "#374151",
              lineHeight: 1.6,
              margin: "0 0 16px 0",
            }}
          >
            {laporan.deskripsi}
          </p>

          {/* Photo with AI annotation */}
          {laporan.foto_url && (
            <AnnotatedImage fotoUrl={laporan.foto_url} savedAnnotations={laporan.annotations} />
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {laporan.status !== "baru" && (
              <button
                onClick={() => updateStatus("baru")}
                disabled={updating}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #BFDBFE",
                  background: "#EFF6FF",
                  color: "#2563EB",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Clock size={12} />
                Tandai Baru
              </button>
            )}
            {laporan.status !== "diproses" && (
              <button
                onClick={() => updateStatus("diproses")}
                disabled={updating}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #FED7AA",
                  background: "#FFF7ED",
                  color: "#EA580C",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <RefreshCw size={12} />
                Diproses
              </button>
            )}
            {laporan.status !== "selesai" && (
              <button
                onClick={() => updateStatus("selesai")}
                disabled={updating}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #BBF7D0",
                  background: "#F0FDF4",
                  color: "#16A34A",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <CheckCircle2 size={12} />
                Selesai
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PAGE ─────────────────────────────────────────────────── */

export default function LaporanMasukPage() {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("semua");
  const [refreshing, setRefreshing] = useState(false);

  const fetchLaporan = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const url =
        statusFilter !== "semua"
          ? `/api/laporan?status=${statusFilter}`
          : "/api/laporan";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat laporan");
      setLaporan(json.laporan ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("laporan-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "laporan" },
        () => fetchLaporan(true)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLaporan]);

  function handleStatusChange(id: string, newStatus: string) {
    setLaporan((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
  }

  const stats = {
    total: laporan.length,
    baru: laporan.filter((l) => l.status === "baru").length,
    diproses: laporan.filter((l) => l.status === "diproses").length,
    darurat: laporan.filter((l) => l.urgency === "darurat").length,
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#F5F7FA" }}>
      <AdminSidebar activePage="laporan-masuk" />

      <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
        {/* ── Top bar ───────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 sm:px-8"
          style={{
            height: 70,
            background: "#FFFFFF",
            borderBottom: "1px solid #F3F4F6",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <div className="flex flex-col">
            <h1
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 20,
                fontWeight: 700,
                color: "#0D0D0D",
                margin: 0,
              }}
            >
              Laporan Masuk
            </h1>
            <span
              className="hidden sm:block"
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 12,
                color: "#9CA3AF",
              }}
            >
              {todayString()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLaporan(true)}
              disabled={refreshing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <Bell size={16} color="#374151" />
              {stats.baru > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#EF4444",
                    color: "#FFFFFF",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {stats.baru > 9 ? "9+" : stats.baru}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 px-4 sm:px-8 py-6" style={{ gap: 24 }}>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 12 }}>
            {[
              { label: "Total Laporan", value: stats.total, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
              { label: "Belum Diproses", value: stats.baru, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
              { label: "Sedang Diproses", value: stats.diproses, color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
              { label: "Darurat", value: stats.darurat, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                    fontSize: 28,
                    fontWeight: 700,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    fontSize: 12,
                    color: "#6B7280",
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} color="#6B7280" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: statusFilter === f ? "1.5px solid #1E3A5F" : "1px solid #E5E7EB",
                  background: statusFilter === f ? "#1E3A5F" : "#FFFFFF",
                  color: statusFilter === f ? "#FFFFFF" : "#6B7280",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 13,
                  fontWeight: statusFilter === f ? 600 : 400,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {f === "semua" ? "Semua" : STATUS_STYLE[f]?.label ?? f}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} color="#9CA3AF" className="animate-spin" />
            </div>
          ) : error ? (
            <div
              className="flex items-center gap-3"
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <AlertTriangle size={18} color="#DC2626" />
              <span
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 14,
                  color: "#B91C1C",
                }}
              >
                {error}
              </span>
            </div>
          ) : laporan.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ gap: 12 }}>
              <Inbox size={40} color="#D1D5DB" />
              <p
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 14,
                  color: "#9CA3AF",
                  margin: 0,
                }}
              >
                Belum ada laporan masuk
              </p>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {laporan.map((l) => (
                <LaporanCard key={l.id} laporan={l} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
