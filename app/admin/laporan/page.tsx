"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  Download,
  Filter,
  ChevronDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  Star,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Radio,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { createClient } from "@/lib/supabase/client";

/* --- TYPES -------------------------------------------------- */

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

type PriorityKey = "darurat" | "segera" | "normal";

const PRIORITY_STYLE: Record<PriorityKey, { bg: string; color: string; label: string }> = {
  darurat: { bg: "#FEE2E2", color: "#EF4444", label: "DARURAT" },
  segera:  { bg: "#FFEDD5", color: "#F97316", label: "SEGERA" },
  normal:  { bg: "#F0FDF4", color: "#16A34A", label: "NORMAL" },
};

/* --- HELPERS ------------------------------------------------ */

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayString() {
  const d = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function durationMinutes(task: Task): number | null {
  if (task.status !== "done" || !task.tenggat) return null;
  const created = new Date(task.created_at).getTime();
  const deadline = new Date(task.tenggat).getTime();
  const diff = Math.abs(deadline - created);
  return Math.max(1, Math.round(diff / 60000));
}

/* --- PAGE --------------------------------------------------- */

export default function AdminLaporanPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [workerFilter, setWorkerFilter] = useState("Semua");
  const [priorityFilter, setPriorityFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [liveCount, setLiveCount] = useState(0);

  const supabaseRef = useRef(createClient());

  /* -- Fetch -- */
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/dashboard-stats");
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      setTasks(data.tasks ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  /* -- Realtime -- */
  useEffect(() => {
    fetchData();

    const channel = supabaseRef.current
      .channel("laporan-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        setLiveCount((c) => c + 1);
        if (payload.eventType === "INSERT") {
          setTasks((prev) => [...prev, payload.new as Task]);
        } else if (payload.eventType === "UPDATE") {
          setTasks((prev) => prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t)));
        } else if (payload.eventType === "DELETE") {
          setTasks((prev) => prev.filter((t) => t.id !== (payload.old as Task).id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [fetchData]);

  /* -- Derived data -- */
  const profileMap = new Map(profiles.filter((p) => p.role === "prakarya").map((p) => [p.id, p]));
  const workers = Array.from(profileMap.values());

  const completedTasks = tasks.filter((t) => t.status === "done");

  const reports = completedTasks.map((t) => {
    const worker = profileMap.get(t.pekerja_id);
    const dur = durationMinutes(t);
    return {
      id: t.id,
      worker: worker?.name ?? "-",
      workerId: t.pekerja_id,
      title: t.judul,
      priority: (t.prioritas as PriorityKey) ?? "normal",
      duration: dur ?? 0,
      date: formatDate(t.created_at),
      time: formatTime(t.created_at),
      area: worker?.area ?? "-",
      catatan: t.catatan,
      tenggat: t.tenggat,
      created_at: t.created_at,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const visible = reports.filter((r) => {
    const wMatch = workerFilter === "Semua" || r.worker === workerFilter;
    const pMatch = priorityFilter === "Semua" || r.priority === priorityFilter;
    const sMatch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.worker.toLowerCase().includes(search.toLowerCase()) || r.area.toLowerCase().includes(search.toLowerCase());
    return wMatch && pMatch && sMatch;
  });

  const totalDuration = reports.reduce((a, r) => a + r.duration, 0);
  const avgDuration = reports.length ? Math.round(totalDuration / reports.length) : 0;
  const daruratCount = reports.filter((r) => r.priority === "darurat").length;
  const totalTasks = tasks.length;
  const efficiency = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  /* -- Export CSV -- */
  const handleExportCSV = () => {
    if (visible.length === 0) return;
    const header = "Judul,Pekerja,Area,Prioritas,Durasi (mnt),Tanggal,Waktu\n";
    const rows = visible.map((r) => {
      const ps = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.normal;
      return `"${r.title}","${r.worker}","${r.area}","${ps.label}",${r.duration},"${r.date}","${r.time}"`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-kegiatan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -- Loading / Error -- */
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
        <AdminSidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin" color="#1E3A5F" />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>Memuat laporan...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
        <AdminSidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle size={36} color="#EF4444" />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#EF4444" }}>{error}</span>
            <button onClick={() => { setLoading(true); fetchData(); }} className="rounded-lg" style={{ padding: "8px 20px", background: "#1E3A5F", color: "#FFFFFF", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600 }}>
              Coba Lagi
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
      <AdminSidebar />

      <main className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <div
          className="flex items-center justify-between pl-14 pr-4 sm:pl-8 sm:pr-8"
          style={{ background: "#FFFFFF", height: 70, flexShrink: 0, boxShadow: "0 1px 6px #00000010" }}
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#111827" }}>
                Laporan Kegiatan
              </span>
              <span className="flex items-center gap-1 rounded-full" style={{ padding: "3px 10px", background: "#F0FDF4", fontSize: 11, fontFamily: "var(--font-inter)", fontWeight: 600, color: "#16A34A" }}>
                <Radio size={10} /> Live
              </span>
            </div>
            <span className="hidden sm:block" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
              {todayString()} - Rekap seluruh tugas yang telah diselesaikan
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="flex items-center justify-center rounded-[10px]"
              style={{ width: 38, height: 38, background: "#F9FAFB", border: "1px solid #E5E7EB", cursor: "pointer" }}
              title="Refresh data"
            >
              <RefreshCw size={16} color="#374151" />
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-[10px]"
              style={{ padding: "9px 16px", background: "#1E3A5F", border: "none", cursor: "pointer", opacity: visible.length === 0 ? 0.5 : 1 }}
              disabled={visible.length === 0}
            >
              <Download size={14} color="#FFFFFF" />
              <span className="hidden sm:inline" style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>
                Export CSV
              </span>
            </button>
            <div className="relative flex items-center justify-center rounded-[10px]" style={{ width: 38, height: 38, background: "#F9FAFB", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <Bell size={17} color="#374151" />
              {liveCount > 0 && (
                <span className="absolute flex items-center justify-center rounded-full" style={{ minWidth: 16, height: 16, background: "#EF4444", top: 4, right: 4, fontSize: 9, fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-inter)", padding: "0 4px" }}>
                  {liveCount > 99 ? "99+" : liveCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col gap-5 overflow-y-auto" style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}>

          {/* STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { Icon: CheckCircle2, iconBg: "#DCFCE7", iconColor: "#16A34A", label: "Total Laporan",       value: String(reports.length) },
              { Icon: Clock,        iconBg: "#DBEAFE", iconColor: "#2563EB", label: "Rata-rata Waktu",    value: `${avgDuration} mnt` },
              { Icon: TrendingUp,   iconBg: "#FEF3C7", iconColor: "#D97706", label: "Tugas Darurat",      value: String(daruratCount) },
              { Icon: Star,         iconBg: "#F3E8FF", iconColor: "#7C3AED", label: "Efisiensi Selesai",   value: `${efficiency}%` },
            ].map(({ Icon, iconBg, iconColor, label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl" style={{ background: "#FFFFFF", padding: "18px 20px", boxShadow: "0 2px 8px #00000012" }}>
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

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Worker filter */}
            <div className="flex items-center flex-wrap gap-1 rounded-[10px]" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "4px 6px", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280", padding: "0 6px" }}>Pekerja:</span>
              {["Semua", ...workers.map((w) => w.name)].map((w) => (
                <button
                  key={w}
                  onClick={() => setWorkerFilter(w)}
                  className="rounded-[7px]"
                  style={{
                    padding: "5px 10px",
                    border: "none",
                    cursor: "pointer",
                    background: workerFilter === w ? "#1E3A5F" : "transparent",
                    fontFamily: "var(--font-inter)",
                    fontSize: 12,
                    fontWeight: workerFilter === w ? 600 : 400,
                    color: workerFilter === w ? "#FFFFFF" : "#6B7280",
                  }}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Priority filter */}
            <div className="flex items-center flex-wrap gap-1 rounded-[10px]" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "4px 6px" }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280", padding: "0 6px" }}>Prioritas:</span>
              {(["Semua", "darurat", "segera", "normal"] as const).map((p) => {
                const ps = p !== "Semua" ? PRIORITY_STYLE[p as PriorityKey] : null;
                return (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className="rounded-[7px]"
                    style={{
                      padding: "5px 10px",
                      border: "none",
                      cursor: "pointer",
                      background: priorityFilter === p ? (ps ? ps.bg : "#EEF2FF") : "transparent",
                      fontFamily: "var(--font-inter)",
                      fontSize: 12,
                      fontWeight: priorityFilter === p ? 700 : 400,
                      color: priorityFilter === p ? (ps ? ps.color : "#4338CA") : "#6B7280",
                    }}
                  >
                    {ps ? ps.label : "Semua"}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-[10px] w-full sm:w-auto sm:ml-auto" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "8px 14px" }}>
              <Filter size={14} color="#6B7280" />
              <input
                type="text"
                placeholder="Cari tugas, pekerja, atau area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", flex: 1 }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl" style={{ boxShadow: "0 2px 8px #00000012" }}>
            <div className="flex flex-col rounded-xl overflow-hidden" style={{ minWidth: 700, background: "#FFFFFF" }}>
              {/* Header */}
              <div
                className="grid"
                style={{ gridTemplateColumns: "1fr 120px 100px 100px 80px 80px 80px", padding: "13px 20px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}
              >
                {["Judul Tugas", "Pekerja", "Area", "Prioritas", "Durasi", "Tanggal", "Waktu"].map((h) => (
                  <div key={h} className="flex items-center gap-1" style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {h} {h === "Tanggal" && <ChevronDown size={12} />}
                  </div>
                ))}
              </div>

              {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2" style={{ padding: "60px 20px" }}>
                  <CheckCircle2 size={36} color="#D1D5DB" />
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                    {reports.length === 0 ? "Belum ada tugas yang diselesaikan." : "Tidak ada laporan yang sesuai filter."}
                  </span>
                </div>
              ) : (
                visible.map((r, idx) => {
                  const ps = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.normal;
                  return (
                    <div
                      key={r.id}
                      className="grid items-center"
                      style={{ gridTemplateColumns: "1fr 120px 100px 100px 80px 80px 80px", padding: "13px 20px", borderBottom: idx < visible.length - 1 ? "1px solid #F3F4F6" : "none", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 rounded-[8px]" style={{ width: 4, height: 32, background: ps.color }} />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                          {r.catatan && <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.catatan}</span>}
                        </div>
                      </div>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151", fontWeight: 500 }}>{r.worker}</span>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>{r.area}</span>
                      <span className="rounded-[20px] inline-flex" style={{ background: ps.bg, padding: "4px 10px", fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 700, color: ps.color, width: "fit-content" }}>
                        {ps.label}
                      </span>
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: "#374151" }}>{r.duration} mnt</span>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>{r.date}</span>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>{r.time}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* WORKER SUMMARY */}
          {workers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((w) => {
                const wReports = reports.filter((r) => r.workerId === w.id);
                const wAll = tasks.filter((t) => t.pekerja_id === w.id);
                const wAvg = wReports.length ? Math.round(wReports.reduce((a, r) => a + r.duration, 0) / wReports.length) : 0;
                const wDarurat = wReports.filter((r) => r.priority === "darurat").length;
                const wEfficiency = wAll.length > 0 ? Math.round((wReports.length / wAll.length) * 100) : 0;
                const initials = w.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={w.id} className="flex flex-col gap-3 rounded-xl" style={{ background: "#FFFFFF", padding: "18px 20px", boxShadow: "0 2px 8px #00000012" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center rounded-full" style={{ width: 38, height: 38, background: "#1E3A5F" }}>
                        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{initials}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 700, color: "#111827" }}>{w.name}</span>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>Bapa Prakarya - {w.area ?? "-"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Selesai", value: String(wReports.length) },
                        { label: "Avg Waktu", value: `${wAvg}m` },
                        { label: "Darurat", value: String(wDarurat) },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-0.5 rounded-[8px]" style={{ background: "#F9FAFB", padding: "8px 10px" }}>
                          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 16, fontWeight: 700, color: "#111827" }}>{value}</span>
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>Efisiensi Selesai</span>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#15803D" }}>{wEfficiency}%</span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 6, background: "#E5E7EB" }}>
                        <div className="h-full rounded-full" style={{ width: `${wEfficiency}%`, background: "#16A34A", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}