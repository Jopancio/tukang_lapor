"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  Filter,
  ChevronDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { createClient } from "@/lib/supabase/client";

/* ─── TYPES ──────────────────────────────────────────────────── */

interface Task {
  id: string;
  pekerja_id: string;
  judul: string;
  prioritas: string;
  tenggat: string | null;
  catatan: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

type PriorityKey = "DARURAT" | "SEGERA" | "NORMAL";
type FilterOpt = "Semua" | "DARURAT" | "SEGERA" | "NORMAL";

const PRIORITY_STYLE: Record<PriorityKey, { bg: string; color: string }> = {
  DARURAT: { bg: "#FEE2E2", color: "#EF4444" },
  SEGERA: { bg: "#FFEDD5", color: "#F97316" },
  NORMAL: { bg: "#F0FDF4", color: "#16A34A" },
};

/* ─── HELPERS ────────────────────────────────────────────────── */

function priorityLabel(p: string): PriorityKey {
  if (p === "darurat") return "DARURAT";
  if (p === "segera") return "SEGERA";
  return "NORMAL";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
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

/** Approximate duration between created_at and updated_at (or now). */
function durationLabel(createdAt: string, updatedAt: string | null): string {
  const start = new Date(createdAt).getTime();
  const end = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const mins = Math.max(1, Math.round((end - start) / 60000));
  if (mins < 60) return `${mins} mnt`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} jam ${rem} mnt` : `${hrs} jam`;
}

/** Count unique active days from an array of date strings. */
function countActiveDays(dates: string[]): number {
  const unique = new Set(dates.map((d) => new Date(d).toDateString()));
  return unique.size;
}

/* ─── PAGE COMPONENT ─────────────────────────────────────────── */

export default function RiwayatPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOpt>("Semua");
  const [search, setSearch] = useState("");
  const supabaseRef = useRef(createClient());

  /* ── Fetch completed tasks ──────────────────────────────── */
  const fetchDoneTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks/my-tasks");
      if (!res.ok) throw new Error("Gagal memuat riwayat");
      const data = await res.json();
      const allTasks: Task[] = data.tasks ?? [];
      setTasks(allTasks.filter((t) => t.status === "done"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoneTasks();
  }, [fetchDoneTasks]);

  /* ── Realtime subscription ──────────────────────────────── */
  useEffect(() => {
    const supabase = supabaseRef.current;
    let userId: string | null = null;

    supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null;
    });

    const channel = supabase
      .channel("riwayat-kerja-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const t = payload.new as Task;
            if (t.pekerja_id === userId && t.status === "done") {
              setTasks((prev) => [t, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const t = payload.new as Task;
            if (t.pekerja_id === userId) {
              if (t.status === "done") {
                setTasks((prev) => {
                  const exists = prev.some((p) => p.id === t.id);
                  return exists
                    ? prev.map((p) => (p.id === t.id ? t : p))
                    : [t, ...prev];
                });
              } else {
                // No longer done — remove from history
                setTasks((prev) => prev.filter((p) => p.id !== t.id));
              }
            }
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setTasks((prev) => prev.filter((p) => p.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ── Derived data ───────────────────────────────────────── */
  const totalDone = tasks.length;
  const daruratCount = tasks.filter((t) => t.prioritas === "darurat").length;
  const segeraCount = tasks.filter((t) => t.prioritas === "segera").length;
  const normalCount = tasks.filter(
    (t) => t.prioritas !== "darurat" && t.prioritas !== "segera"
  ).length;

  const avgDuration =
    totalDone > 0
      ? Math.round(
          tasks.reduce((acc, t) => {
            const start = new Date(t.created_at).getTime();
            const end = t.updated_at
              ? new Date(t.updated_at).getTime()
              : Date.now();
            return acc + (end - start) / 60000;
          }, 0) / totalDone
        )
      : 0;

  const activeDays = countActiveDays(
    tasks.map((t) => t.updated_at ?? t.created_at)
  );

  const visible = tasks.filter((t) => {
    const pl = priorityLabel(t.prioritas);
    const matchPriority = activeFilter === "Semua" || pl === activeFilter;
    const matchSearch =
      t.judul.toLowerCase().includes(search.toLowerCase()) ||
      (t.catatan ?? "").toLowerCase().includes(search.toLowerCase());
    return matchPriority && matchSearch;
  });

  /* ── Loading / Error states ─────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
        <DashboardSidebar />
        <main className="flex flex-col flex-1 items-center justify-center gap-3">
          <Loader2 size={32} color="#16A34A" className="animate-spin" />
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>
            Memuat riwayat kerja...
          </span>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
        <DashboardSidebar />
        <main className="flex flex-col flex-1 items-center justify-center gap-3">
          <AlertTriangle size={32} color="#EF4444" />
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#EF4444" }}>
            {error}
          </span>
          <button
            onClick={() => { setLoading(true); fetchDoneTasks(); }}
            className="flex items-center gap-2 rounded-lg"
            style={{
              padding: "8px 16px",
              background: "#16A34A",
              color: "#FFFFFF",
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Coba Lagi
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
      <DashboardSidebar />

      <main className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <div
          className="flex items-center justify-between pl-14 pr-4 sm:pl-8 sm:pr-8"
          style={{
            background: "#FFFFFF",
            height: 70,
            flexShrink: 0,
            boxShadow: "0 1px 6px #00000010",
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: 20,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Riwayat Kerja
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
              {todayString()} • Rekap seluruh aktivitas kebersihan
            </span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchDoneTasks(); }}
            className="flex items-center justify-center rounded-[10px]"
            style={{
              width: 38,
              height: 38,
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              cursor: "pointer",
            }}
            title="Refresh"
          >
            <RefreshCw size={17} color="#374151" />
          </button>
        </div>

        {/* CONTENT */}
        <div
          className="flex flex-col gap-5 overflow-y-auto"
          style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}
        >
          {/* STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { Icon: CheckCircle2, iconColor: "#16A34A", iconBg: "#DCFCE7", title: "Total Tugas Selesai", value: `${totalDone} tugas`, sub: "Sepanjang riwayat" },
              { Icon: Clock, iconColor: "#2563EB", iconBg: "#DBEAFE", title: "Rata-rata Waktu", value: `${avgDuration} mnt`, sub: "Per tugas diselesaikan" },
              { Icon: TrendingUp, iconColor: "#D97706", iconBg: "#FEF3C7", title: "Tugas Darurat", value: `${daruratCount} tugas`, sub: "Berhasil ditangani" },
              { Icon: Calendar, iconColor: "#7C3AED", iconBg: "#EDE9FE", title: "Hari Aktif", value: `${activeDays} hari`, sub: "Berdasarkan riwayat" },
            ].map(({ Icon, iconColor, iconBg, title, value, sub }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-xl"
                style={{
                  background: "#FFFFFF",
                  padding: "18px 20px",
                  boxShadow: "0 2px 8px #00000012",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: 44, height: 44, background: iconBg }}
                >
                  <Icon size={20} color={iconColor} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>
                    {title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {value}
                  </span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>
                    {sub}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* FILTER + SEARCH */}
          <div className="flex flex-wrap items-center gap-3">
            {(["Semua", "DARURAT", "SEGERA", "NORMAL"] as FilterOpt[]).map((f) => {
              const active = activeFilter === f;
              const style = f !== "Semua" ? PRIORITY_STYLE[f as PriorityKey] : null;
              const count =
                f === "Semua"
                  ? totalDone
                  : f === "DARURAT"
                  ? daruratCount
                  : f === "SEGERA"
                  ? segeraCount
                  : normalCount;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="rounded-[8px]"
                  style={{
                    padding: "7px 14px",
                    border: active ? "1.5px solid #15803D" : "1.5px solid #E5E7EB",
                    background: active ? "#F0FDF4" : style ? style.bg : "#FFFFFF",
                    fontFamily: "var(--font-inter)",
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#15803D" : style ? style.color : "#6B7280",
                    cursor: "pointer",
                  }}
                >
                  {f === "Semua" ? `Semua (${count})` : `${f} (${count})`}
                </button>
              );
            })}
            <div
              className="flex items-center gap-2 rounded-[10px] ml-auto"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "8px 14px", minWidth: 240 }}
            >
              <Filter size={14} color="#6B7280" />
              <input
                type="text"
                placeholder="Cari tugas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "#111827",
                  flex: 1,
                }}
              />
            </div>
          </div>

          {/* HISTORY TABLE */}
          <div
            className="flex flex-col rounded-xl overflow-hidden"
            style={{ background: "#FFFFFF", boxShadow: "0 2px 8px #00000012" }}
          >
            {/* Table Header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "1fr 100px 80px 110px 90px",
                padding: "13px 20px",
                background: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              {["Tugas", "Prioritas", "Durasi", "Tanggal", "Waktu Selesai"].map((h) => (
                <div
                  key={h}
                  className="flex items-center gap-1"
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {h}
                  {h === "Tanggal" && <ChevronDown size={12} color="#6B7280" />}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            {visible.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2"
                style={{ padding: "40px 20px" }}
              >
                <CheckCircle2 size={32} color="#D1D5DB" />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                  {totalDone === 0
                    ? "Belum ada tugas yang diselesaikan."
                    : "Tidak ada riwayat yang sesuai filter."}
                </span>
              </div>
            ) : (
              visible.map((task, idx) => {
                const pl = priorityLabel(task.prioritas);
                const ps = PRIORITY_STYLE[pl];
                const completedDate = task.updated_at ?? task.created_at;
                return (
                  <div
                    key={task.id}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: "1fr 100px 80px 110px 90px",
                      padding: "14px 20px",
                      borderBottom: idx < visible.length - 1 ? "1px solid #F3F4F6" : "none",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                    }}
                  >
                    {/* Title */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-[10px] flex-shrink-0"
                        style={{ width: 32, height: 32, background: "#F0FDF4" }}
                      >
                        <CheckCircle2 size={16} color="#16A34A" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {task.judul}
                        </span>
                        {task.catatan && (
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>
                            {task.catatan}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Priority */}
                    <span
                      className="rounded-[20px] inline-flex"
                      style={{
                        background: ps.bg,
                        padding: "4px 10px",
                        fontFamily: "var(--font-inter)",
                        fontSize: 10,
                        fontWeight: 700,
                        color: ps.color,
                        width: "fit-content",
                      }}
                    >
                      {pl}
                    </span>
                    {/* Duration */}
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#374151",
                      }}
                    >
                      {durationLabel(task.created_at, task.updated_at)}
                    </span>
                    {/* Date */}
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>
                      {formatDate(completedDate)}
                    </span>
                    {/* Time + badge */}
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>
                        {formatTime(completedDate)}
                      </span>
                      <span
                        className="rounded-[20px]"
                        style={{
                          background: "#DCFCE7",
                          padding: "3px 8px",
                          fontFamily: "var(--font-inter)",
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#16A34A",
                        }}
                      >
                        Selesai
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
