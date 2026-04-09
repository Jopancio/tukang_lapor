"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  TriangleAlert,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { createClient } from "@/lib/supabase/client";

/* ─── TYPES ─────────────────────────────────────────────────── */

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  area: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

interface Task {
  id: string;
  pekerja_id: string;
  judul: string;
  prioritas: string;
  tenggat: string | null;
  catatan: string | null;
  status: string;
  created_at: string;
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  darurat: { bg: "#FEE2E2", color: "#EF4444" },
  segera: { bg: "#FFEDD5", color: "#F97316" },
  normal: { bg: "#F0FDF4", color: "#16A34A" },
};

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

function formatDate() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── PAGE ─────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<{ actor: string; action: string; subject: string; time: string }[]>([]);
  const supabaseRef = useRef(createClient());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setProfiles(data.profiles);
      setTasks(data.tasks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    const supabase = supabaseRef.current;

    const profileChannel = supabase
      .channel("admin-profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const p = payload.new as Profile;
            setProfiles((prev) => [p, ...prev]);
            setRecentLogs((prev) =>
              [{ actor: "Sistem", action: "Pekerja baru ditambahkan", subject: p.name || p.email, time: timeAgo(p.created_at) }, ...prev].slice(0, 8)
            );
          } else if (payload.eventType === "UPDATE") {
            const p = payload.new as Profile;
            setProfiles((prev) =>
              prev.map((x) => (x.id === p.id ? p : x))
            );
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setProfiles((prev) => prev.filter((x) => x.id !== old.id));
          }
        }
      )
      .subscribe();

    const taskChannel = supabase
      .channel("admin-tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const t = payload.new as Task;
            setTasks((prev) => [t, ...prev]);
            setRecentLogs((prev) =>
              [{ actor: "Sistem", action: "Tugas baru dibuat", subject: t.judul, time: timeAgo(t.created_at) }, ...prev].slice(0, 8)
            );
          } else if (payload.eventType === "UPDATE") {
            const t = payload.new as Task;
            setTasks((prev) =>
              prev.map((x) => (x.id === t.id ? t : x))
            );
            if (t.status === "done") {
              setRecentLogs((prev) =>
                [{ actor: "Pekerja", action: "Menyelesaikan tugas", subject: t.judul, time: timeAgo(new Date().toISOString()) }, ...prev].slice(0, 8)
              );
            } else if (t.status === "in_progress") {
              setRecentLogs((prev) =>
                [{ actor: "Pekerja", action: "Memulai tugas", subject: t.judul, time: timeAgo(new Date().toISOString()) }, ...prev].slice(0, 8)
              );
            }
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setTasks((prev) => prev.filter((x) => x.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(taskChannel);
    };
  }, []);

  // Derived stats
  const totalWorkers = profiles.filter((p) => p.role !== "admin").length;
  const activeWorkers = profiles.filter((p) => p.role !== "admin" && p.status === "aktif").length;
  const activeTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const totalTaskCount = tasks.length;
  const completionRate = totalTaskCount > 0 ? Math.round((doneTasks.length / totalTaskCount) * 100) : 0;

  // Worker name map
  const nameMap = new Map(profiles.map((p) => [p.id, p.name || p.email]));

  // Recent active tasks (up to 6)
  const recentActive = activeTasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Worker summary
  const workerSummary = profiles
    .filter((p) => p.role !== "admin")
    .map((p) => {
      const workerTasks = tasks.filter((t) => t.pekerja_id === p.id);
      const doneToday = workerTasks.filter((t) => {
        if (t.status !== "done") return false;
        const d = new Date(t.created_at);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length;
      const activeCount = workerTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
      return {
        ...p,
        initials: (p.name || p.email).split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
        doneToday,
        activeCount,
        total: workerTasks.length,
      };
    })
    .slice(0, 5);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
      <AdminSidebar />

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
              style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#111827" }}
            >
              Dasbor Admin
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
              {formatDate()} · Data Realtime
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="flex items-center justify-center rounded-[10px]"
              style={{
                width: 38,
                height: 38,
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} color="#16A34A" />
            </button>
            <span
              className="flex items-center gap-1.5 rounded-[20px]"
              style={{
                background: "#F0FDF4",
                border: "1px solid #86EFAC",
                padding: "6px 12px",
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                fontWeight: 600,
                color: "#15803D",
              }}
            >
              <span className="rounded-full" style={{ width: 7, height: 7, background: "#22C55E", display: "inline-block" }} />
              Live
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col gap-5 overflow-y-auto" style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}>

          {/* LOADING / ERROR */}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3 rounded-xl" style={{ background: "#FFFFFF" }}>
              <Loader2 size={20} color="#1E3A5F" className="animate-spin" />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>
                Memuat data dashboard...
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 rounded-xl" style={{ background: "#FEF2F2", padding: 16, border: "1px solid #FECACA" }}>
              <AlertTriangle size={18} color="#EF4444" />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#EF4444" }}>{error}</span>
              <button
                onClick={() => { setLoading(true); fetchData(); }}
                style={{
                  marginLeft: "auto",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* STATS ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { Icon: ClipboardList, iconBg: "#DBEAFE", iconColor: "#2563EB", label: "Tugas Aktif", value: String(activeTasks.length), sub: "Sedang berjalan" },
                  { Icon: CheckCircle2, iconBg: "#DCFCE7", iconColor: "#16A34A", label: "Tugas Selesai", value: String(doneTasks.length), sub: `Total: ${totalTaskCount}` },
                  { Icon: TriangleAlert, iconBg: "#FEE2E2", iconColor: "#EF4444", label: "Prioritas Darurat", value: String(tasks.filter((t) => t.prioritas === "darurat" && t.status !== "done").length), sub: "Butuh perhatian" },
                  { Icon: Users, iconBg: "#F3E8FF", iconColor: "#7C3AED", label: "Pekerja Aktif", value: `${activeWorkers}/${totalWorkers}`, sub: activeWorkers === totalWorkers ? "Semua online" : `${totalWorkers - activeWorkers} libur` },
                ].map(({ Icon, iconBg, iconColor, label, value, sub }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl"
                    style={{ background: "#FFFFFF", padding: "18px 20px", boxShadow: "0 2px 8px #00000012" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ width: 46, height: 46, background: iconBg }}
                    >
                      <Icon size={22} color={iconColor} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>{value}</span>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>{sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* MIDDLE ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Active Tasks */}
                <div
                  className="flex flex-col gap-0 rounded-xl overflow-hidden"
                  style={{ background: "#FFFFFF", boxShadow: "0 2px 8px #00000012" }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} color="#1E3A5F" />
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                        Tugas Aktif
                      </span>
                      <span
                        className="rounded-full"
                        style={{ background: "#DBEAFE", padding: "2px 8px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#2563EB" }}
                      >
                        {activeTasks.length}
                      </span>
                    </div>
                    <a
                      href="/admin/tugas"
                      className="flex items-center gap-1"
                      style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#1E3A5F", textDecoration: "none" }}
                    >
                      Lihat Semua <ChevronRight size={14} />
                    </a>
                  </div>
                  <div className="flex flex-col">
                    {recentActive.length === 0 && (
                      <div className="flex items-center justify-center py-10">
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>
                          Tidak ada tugas aktif
                        </span>
                      </div>
                    )}
                    {recentActive.map((t, idx) => {
                      const ps = PRIORITY_STYLE[t.prioritas] || PRIORITY_STYLE.normal;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-3"
                          style={{
                            padding: "12px 20px",
                            borderBottom: idx < recentActive.length - 1 ? "1px solid #F9FAFB" : "none",
                            borderLeft: `3px solid ${ps.color}`,
                          }}
                        >
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.judul}
                            </span>
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>
                              {nameMap.get(t.pekerja_id) || "—"}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className="rounded-[20px]"
                              style={{ background: ps.bg, padding: "3px 8px", fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 700, color: ps.color }}
                            >
                              {t.prioritas.toUpperCase()}
                            </span>
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>
                              {timeAgo(t.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Worker Summary */}
                <div
                  className="flex flex-col gap-0 rounded-xl overflow-hidden"
                  style={{ background: "#FFFFFF", boxShadow: "0 2px 8px #00000012" }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} color="#1E3A5F" />
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                        Status Pekerja
                      </span>
                    </div>
                    <a
                      href="/admin/pekerja"
                      className="flex items-center gap-1"
                      style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#1E3A5F", textDecoration: "none" }}
                    >
                      Kelola <ChevronRight size={14} />
                    </a>
                  </div>
                  {workerSummary.length === 0 && (
                    <div className="flex items-center justify-center py-10">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>
                        Belum ada pekerja
                      </span>
                    </div>
                  )}
                  {workerSummary.map((w, idx) => (
                    <div
                      key={w.id}
                      className="flex items-center gap-3"
                      style={{ padding: "14px 20px", borderBottom: idx < workerSummary.length - 1 ? "1px solid #F9FAFB" : "none" }}
                    >
                      <div className="relative flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 38, height: 38, background: "#1E3A5F" }}>
                        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{w.initials}</span>
                        <span className="absolute rounded-full" style={{ width: 9, height: 9, background: w.status === "aktif" ? "#22C55E" : "#9CA3AF", border: "1.5px solid white", bottom: 0, right: 0 }} />
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#111827" }}>{w.name || w.email}</span>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>{w.role}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: "#111827" }}>
                          {w.doneToday} selesai
                        </span>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280" }}>
                          {w.activeCount} aktif
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTOM ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Activity Log */}
                <div
                  className="flex flex-col gap-0 rounded-xl overflow-hidden"
                  style={{ background: "#FFFFFF", boxShadow: "0 2px 8px #00000012" }}
                >
                  <div
                    className="flex items-center gap-2"
                    style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}
                  >
                    <TrendingUp size={16} color="#1E3A5F" />
                    <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                      Log Aktivitas Realtime
                    </span>
                  </div>
                  {recentLogs.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>
                        Belum ada aktivitas. Log akan muncul saat ada perubahan data.
                      </span>
                    </div>
                  ) : (
                    recentLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3"
                        style={{ padding: "12px 20px", borderBottom: idx < recentLogs.length - 1 ? "1px solid #F9FAFB" : "none" }}
                      >
                        <div
                          className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                          style={{ width: 30, height: 30, background: log.actor === "Sistem" ? "#F3F4F6" : "#DBEAFE" }}
                        >
                          {log.actor === "Sistem"
                            ? <Clock size={14} color="#6B7280" />
                            : <Users size={14} color="#2563EB" />
                          }
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1">
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>
                            <span style={{ fontWeight: 600 }}>{log.actor}</span> {log.action}
                          </span>
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>
                            {log.subject}
                          </span>
                        </div>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
                          {log.time}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Task Completion Summary */}
                <div
                  className="flex flex-col gap-4 rounded-xl"
                  style={{ background: "#FFFFFF", padding: 20, boxShadow: "0 2px 8px #00000012" }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} color="#1E3A5F" />
                    <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                      Ringkasan Tugas
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                        Tingkat Penyelesaian
                      </span>
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 16, fontWeight: 700, color: "#15803D" }}>
                        {completionRate}%
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 10, background: "#E5E7EB" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${completionRate}%`,
                          background: "linear-gradient(90deg, #15803D, #22C55E)",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>
                      {doneTasks.length} dari {totalTaskCount} tugas diselesaikan
                    </span>
                  </div>

                  {/* Priority Breakdown */}
                  <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                      Berdasarkan Prioritas
                    </span>
                    {(["darurat", "segera", "normal"] as const).map((p) => {
                      const count = tasks.filter((t) => t.prioritas === p && t.status !== "done").length;
                      const ps = PRIORITY_STYLE[p];
                      return (
                        <div key={p} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full" style={{ width: 8, height: 8, background: ps.color, display: "inline-block" }} />
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </span>
                          </div>
                          <span
                            className="rounded-[20px]"
                            style={{ background: ps.bg, padding: "2px 10px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 700, color: ps.color }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
