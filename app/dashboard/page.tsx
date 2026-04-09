"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  Timer,
  Wrench,
  CircleCheck,
  ClipboardList,
  TrendingUp,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { createClient } from "@/lib/supabase/client";

/* ─── TYPES ─────────────────────────────────────────────────── */

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

/* ─── HELPERS ───────────────────────────────────────────────── */

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

function priorityConfig(p: string) {
  switch (p) {
    case "darurat":
      return { bg: "#FEF2F2", color: "#EF4444", border: "#FECACA", label: "DARURAT" };
    case "segera":
      return { bg: "#FFF7ED", color: "#F97316", border: "#FED7AA", label: "SEGERA" };
    default:
      return { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "NORMAL" };
  }
}

function formatDate() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── PAGE ──────────────────────────────────────────────────── */

export default function DashboardBapaPrakarya() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Task[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const supabaseRef = useRef(createClient());

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks/my-tasks");
      if (!res.ok) throw new Error("Gagal memuat tugas");
      const data = await res.json();
      setTasks(data.tasks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime subscription
  useEffect(() => {
    const supabase = supabaseRef.current;
    let userId: string | null = null;

    supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null;
    });

    const channel = supabase
      .channel("my-tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task;
            if (newTask.pekerja_id === userId) {
              setTasks((prev) => [newTask, ...prev]);
              setNotifications((prev) => [newTask, ...prev].slice(0, 10));
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                new Notification("Tugas Baru!", {
                  body: newTask.judul,
                  icon: "/favicon.ico",
                });
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Task;
            if (updated.pekerja_id === userId) {
              setTasks((prev) =>
                prev.map((t) => (t.id === updated.id ? updated : t))
              );
            }
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setTasks((prev) => prev.filter((t) => t.id !== deleted.id));
          }
        }
      )
      .subscribe();

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkDone = async (taskId: string) => {
    try {
      const res = await fetch("/api/tasks/update-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, status: "done" }),
      });
      if (!res.ok) throw new Error("Gagal update status");
    } catch {
      alert("Gagal menandai selesai");
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/tasks/update-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, status: "in_progress" }),
      });
      if (!res.ok) throw new Error("Gagal update status");
    } catch {
      alert("Gagal memulai tugas");
    }
  };

  // Derived stats
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const activeTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const allActive = [...pendingTasks, ...activeTasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: 16,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Selamat Datang! 👋
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
              {formatDate()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => { setLoading(true); fetchTasks(); }}
              className="flex items-center justify-center rounded-[10px]"
              style={{
                width: 40,
                height: 40,
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} color="#16A34A" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative flex items-center justify-center rounded-[10px]"
                style={{
                  width: 40,
                  height: 40,
                  background: notifications.length > 0 ? "#FEF2F2" : "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  cursor: "pointer",
                }}
              >
                <Bell size={18} color={notifications.length > 0 ? "#EF4444" : "#6B7280"} />
                {notifications.length > 0 && (
                  <span
                    className="absolute rounded-full flex items-center justify-center"
                    style={{
                      width: 18,
                      height: 18,
                      background: "#EF4444",
                      border: "2px solid #FFFFFF",
                      top: -4,
                      right: -4,
                      fontFamily: "var(--font-inter)",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotif && (
                <div
                  className="absolute right-0 mt-2 rounded-xl overflow-hidden"
                  style={{
                    width: 320,
                    background: "#FFFFFF",
                    boxShadow: "0 8px 30px #00000020",
                    border: "1px solid #E5E7EB",
                    zIndex: 50,
                  }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      Notifikasi Tugas Baru
                    </span>
                    <button
                      onClick={() => { setNotifications([]); setShowNotif(false); }}
                      style={{ cursor: "pointer", background: "none", border: "none" }}
                    >
                      <X size={16} color="#9CA3AF" />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>
                        Tidak ada notifikasi
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col" style={{ maxHeight: 280, overflowY: "auto" }}>
                      {notifications.map((n) => {
                        const pc = priorityConfig(n.prioritas);
                        return (
                          <div
                            key={n.id}
                            className="flex items-start gap-3"
                            style={{ padding: "12px 16px", borderBottom: "1px solid #F9FAFB" }}
                          >
                            <div
                              className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                              style={{ width: 32, height: 32, background: pc.bg }}
                            >
                              <AlertTriangle size={14} color={pc.color} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span
                                style={{
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#111827",
                                }}
                              >
                                {n.judul}
                              </span>
                              <span
                                style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}
                              >
                                {timeAgo(n.created_at)} · {pc.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div
          className="flex flex-col gap-5 overflow-y-auto"
          style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}
        >
          {/* STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              iconBg="#FEF2F2"
              icon={<ClipboardList size={22} color="#EF4444" />}
              num={String(pendingTasks.length)}
              label="Tugas Menunggu"
            />
            <StatCard
              iconBg="#FFF7ED"
              icon={<Timer size={22} color="#F97316" />}
              num={String(activeTasks.length)}
              label="Sedang Dikerjakan"
            />
            <StatCard
              iconBg="#F0FDF4"
              icon={<CircleCheck size={22} color="#16A34A" />}
              num={String(doneTasks.length)}
              label="Tugas Selesai"
            />
            <div
              className="flex items-center gap-4 rounded-xl"
              style={{
                height: 100,
                padding: "0 20px",
                background: "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)",
                boxShadow: "0 4px 16px #16A34A40",
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 48, height: 48, background: "#FFFFFF22", flexShrink: 0 }}
              >
                <TrendingUp size={22} color="#FFFFFF" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  {tasks.length > 0
                    ? Math.round((doneTasks.length / tasks.length) * 100)
                    : 0}%
                </span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#DCFCE7" }}>
                  Tingkat Penyelesaian
                </span>
              </div>
            </div>
          </div>

          {/* LOADING / ERROR */}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3 rounded-xl" style={{ background: "#FFFFFF" }}>
              <Loader2 size={20} color="#16A34A" className="animate-spin" />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>
                Memuat data tugas...
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 rounded-xl" style={{ background: "#FEF2F2", padding: 16, border: "1px solid #FECACA" }}>
              <AlertTriangle size={18} color="#EF4444" />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#EF4444" }}>{error}</span>
              <button
                onClick={() => { setLoading(true); fetchTasks(); }}
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
              {/* ACTIVE TASKS */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Tugas Aktif
                  </span>
                  {allActive.length > 0 && (
                    <span
                      className="rounded-xl"
                      style={{
                        background: "#FEF2F2",
                        padding: "4px 10px",
                        fontFamily: "var(--font-inter)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#EF4444",
                      }}
                    >
                      {allActive.length} Tugas
                    </span>
                  )}
                </div>

                {allActive.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center py-12 rounded-xl"
                    style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
                  >
                    <CircleCheck size={40} color="#22C55E" />
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk)",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#111827",
                        marginTop: 12,
                      }}
                    >
                      Semua tugas selesai!
                    </span>
                    <span
                      style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280", marginTop: 4 }}
                    >
                      Tidak ada tugas yang perlu dikerjakan saat ini
                    </span>
                  </div>
                )}

                {allActive.map((task) => {
                  const pc = priorityConfig(task.prioritas);
                  const isInProgress = task.status === "in_progress";
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: "#FFFFFF",
                        border: `1.5px solid ${pc.border}`,
                        boxShadow: "0 2px 8px #00000010",
                      }}
                    >
                      <div style={{ height: 4, background: pc.color }} />
                      <div className="flex flex-col gap-2.5" style={{ padding: "14px 16px" }}>
                        <div className="flex items-center justify-between">
                          <span
                            className="flex items-center gap-1.5 rounded-[20px]"
                            style={{
                              background: pc.bg,
                              padding: "3px 8px",
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              fontWeight: 600,
                              color: pc.color,
                            }}
                          >
                            {pc.label}
                          </span>
                          <span
                            className="flex items-center gap-1"
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              fontWeight: 500,
                              color: "#9CA3AF",
                            }}
                          >
                            <span
                              className="rounded-full"
                              style={{
                                width: 6,
                                height: 6,
                                background: isInProgress ? "#F97316" : "#9CA3AF",
                                display: "inline-block",
                              }}
                            />
                            {isInProgress ? "Sedang Dikerjakan" : timeAgo(task.created_at)}
                          </span>
                        </div>

                        <span
                          style={{
                            fontFamily: "var(--font-space-grotesk)",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {task.judul}
                        </span>

                        <div className="flex items-center gap-3 flex-wrap">
                          {task.catatan && (
                            <div className="flex items-center gap-1.5">
                              <Wrench size={13} color="#9CA3AF" />
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                                {task.catatan}
                              </span>
                            </div>
                          )}
                          {task.tenggat && (
                            <div className="flex items-center gap-1.5">
                              <Timer size={13} color="#9CA3AF" />
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                                Tenggat: {new Date(task.tenggat).toLocaleDateString("id-ID")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {task.status === "pending" && (
                            <button
                              onClick={() => handleStartTask(task.id)}
                              className="flex items-center justify-center gap-1.5 rounded-lg flex-1"
                              style={{
                                background: "#F97316",
                                padding: "10px 0",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Timer size={15} color="#FFFFFF" />
                              <span
                                style={{
                                  fontFamily: "var(--font-space-grotesk)",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#FFFFFF",
                                }}
                              >
                                Mulai Kerjakan
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => handleMarkDone(task.id)}
                            className="flex items-center justify-center gap-1.5 rounded-lg flex-1"
                            style={{
                              background: "#16A34A",
                              padding: "10px 0",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 3px 12px #16A34A40",
                            }}
                          >
                            <CircleCheck size={15} color="#FFFFFF" />
                            <span
                              style={{
                                fontFamily: "var(--font-space-grotesk)",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#FFFFFF",
                              }}
                            >
                              Tandai Selesai
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* COMPLETED TASKS */}
              {doneTasks.length > 0 && (
                <div
                  className="rounded-xl"
                  style={{ background: "#FFFFFF", padding: 20, boxShadow: "0 2px 8px #00000012" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk)",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      Riwayat Tugas Selesai
                    </span>
                    <span
                      className="rounded-xl"
                      style={{
                        background: "#F0FDF4",
                        padding: "4px 10px",
                        fontFamily: "var(--font-inter)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#16A34A",
                      }}
                    >
                      {doneTasks.length} Selesai
                    </span>
                  </div>
                  <div style={{ height: 1, background: "#F3F4F6", marginBottom: 0 }} />
                  {doneTasks.slice(0, 5).map((task, i) => (
                    <div key={task.id}>
                      <div className="flex items-center justify-between" style={{ padding: "12px 0" }}>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex items-center justify-center rounded-lg"
                            style={{ width: 32, height: 32, background: "#F0FDF4", flexShrink: 0 }}
                          >
                            <CircleCheck size={16} color="#16A34A" />
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
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>
                              {task.catatan || "—"}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
                          {timeAgo(task.created_at)}
                        </span>
                      </div>
                      {i < Math.min(doneTasks.length, 5) - 1 && (
                        <div style={{ height: 1, background: "#F9FAFB" }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── SUB-COMPONENTS ────────────────────────────────────────── */

function StatCard({
  iconBg,
  icon,
  num,
  label,
}: {
  iconBg: string;
  icon: React.ReactNode;
  num: string;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl"
      style={{
        height: 100,
        padding: "0 20px",
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 2px 8px #00000010",
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 48, height: 48, background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: 28,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: -1,
            lineHeight: 1,
          }}
        >
          {num}
        </span>
        <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
          {label}
        </span>
      </div>
    </div>
  );
}
