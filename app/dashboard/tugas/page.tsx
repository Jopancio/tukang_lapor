"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  Search,
  MapPin,
  Wrench,
  Timer,
  TriangleAlert,
  Zap,
  Leaf,
  CircleCheck,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import PushNotificationManager from "@/components/PushNotificationManager";
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

type FilterKey = "semua" | "pending" | "in_progress" | "done";

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
      return {
        bg: "#FEF2F2", color: "#EF4444", border: "#FECACA", label: "DARURAT",
        Icon: TriangleAlert, stripe: "#EF4444", iconBg: "#FEF2F2",
      };
    case "segera":
      return {
        bg: "#FFF7ED", color: "#F97316", border: "#FED7AA", label: "SEGERA",
        Icon: Zap, stripe: "#F97316", iconBg: "#FFF7ED",
      };
    default:
      return {
        bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "NORMAL",
        Icon: Leaf, stripe: "#22C55E", iconBg: "#F0FDF4",
      };
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

/* ─── PAGE COMPONENT ─────────────────────────────────────────── */

export default function TugasSayaPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterKey>("semua");
  const [search, setSearch] = useState("");
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());
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
      .channel("tugas-saya-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task;
            if (newTask.pekerja_id === userId) {
              setTasks((prev) => [newTask, ...prev]);
              setNewTaskIds((prev) => new Set(prev).add(newTask.id));
              // Clear highlight after 5s
              setTimeout(() => {
                setNewTaskIds((prev) => {
                  const next = new Set(prev);
                  next.delete(newTask.id);
                  return next;
                });
              }, 5000);
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

  // Counts
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const progressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const TABS: { key: FilterKey; label: string; count: number; badgeBg: string; badgeColor: string }[] = [
    { key: "semua", label: "Semua", count: tasks.length, badgeBg: "#FFFFFF44", badgeColor: "#FFFFFF" },
    { key: "pending", label: "Menunggu", count: pendingCount, badgeBg: "#FEE2E2", badgeColor: "#EF4444" },
    { key: "in_progress", label: "Dalam Proses", count: progressCount, badgeBg: "#FFF7ED", badgeColor: "#F97316" },
    { key: "done", label: "Selesai", count: doneCount, badgeBg: "#F0FDF4", badgeColor: "#16A34A" },
  ];

  // Filtered tasks
  const filtered = tasks.filter((t) => {
    const matchTab = activeTab === "semua" || t.status === activeTab;
    const matchSearch = t.judul.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const activeTasks = filtered.filter((t) => t.status !== "done");
  const doneTasks = filtered.filter((t) => t.status === "done");

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
              Tugas Saya
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
              {formatDate()} · Data Realtime
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setLoading(true); fetchTasks(); }}
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
            <PushNotificationManager />
            <div
              className="flex items-center gap-1.5 rounded-[20px]"
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                padding: "6px 14px",
              }}
            >
              <span
                className="rounded-full"
                style={{ width: 7, height: 7, background: "#22C55E", display: "inline-block" }}
              />
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#16A34A",
                }}
              >
                Live
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="flex flex-col gap-5 overflow-y-auto"
          style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}
        >
          {/* FILTER BAR */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div
              className="flex gap-1 rounded-[10px] p-1"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 rounded-[7px]"
                    style={{
                      background: active ? "#15803D" : "transparent",
                      padding: "7px 14px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        color: active ? "#FFFFFF" : "#6B7280",
                      }}
                    >
                      {tab.label}
                    </span>
                    <span
                      className="flex items-center justify-center rounded-[9px]"
                      style={{
                        width: 18,
                        height: 18,
                        background: active ? "#FFFFFF44" : tab.badgeBg,
                        fontFamily: "var(--font-inter)",
                        fontSize: 10,
                        fontWeight: 700,
                        color: active ? "#FFFFFF" : tab.badgeColor,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="flex items-center gap-2 rounded-[10px]"
              style={{
                width: 260,
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                padding: "9px 14px",
              }}
            >
              <Search size={15} color="#9CA3AF" />
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
                  width: 0,
                }}
              />
            </div>
          </div>

          {/* LOADING */}
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
            <div className="flex flex-col gap-3">
              {/* Active Tasks */}
              {activeTasks.map((task) => {
                const pc = priorityConfig(task.prioritas);
                const isNew = newTaskIds.has(task.id);
                const isInProgress = task.status === "in_progress";
                return (
                  <div
                    key={task.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: "#FFFFFF",
                      border: `1.5px solid ${pc.border}`,
                      boxShadow: isNew
                        ? `0 0 0 2px ${pc.color}40, 0 2px 8px #00000010`
                        : "0 2px 8px #00000010",
                      transition: "box-shadow 0.3s ease",
                    }}
                  >
                    <div style={{ height: 4, background: pc.stripe }} />
                    <div
                      className="flex items-center justify-between"
                      style={{ padding: "16px 20px" }}
                    >
                      {/* Left */}
                      <div className="flex items-center gap-3.5">
                        <div
                          className="flex items-center justify-center rounded-xl flex-shrink-0"
                          style={{ width: 44, height: 44, background: pc.iconBg }}
                        >
                          <pc.Icon size={22} color={pc.color} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
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
                            {isNew && (
                              <span
                                className="rounded-[20px]"
                                style={{
                                  background: "#EF4444",
                                  padding: "2px 8px",
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: "#FFFFFF",
                                }}
                              >
                                BARU!
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3.5 flex-wrap">
                            {task.catatan && (
                              <span className="flex items-center gap-1">
                                <Wrench size={13} color="#9CA3AF" />
                                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                                  {task.catatan}
                                </span>
                              </span>
                            )}
                            {task.tenggat && (
                              <span className="flex items-center gap-1">
                                <MapPin size={13} color="#9CA3AF" />
                                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                                  Tenggat: {new Date(task.tenggat).toLocaleDateString("id-ID")}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Timer size={13} color={isInProgress ? "#F97316" : "#9CA3AF"} />
                              <span
                                style={{
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: isInProgress ? "#F97316" : "#9CA3AF",
                                }}
                              >
                                {isInProgress ? "Sedang Dikerjakan" : timeAgo(task.created_at)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex flex-col items-end gap-2.5">
                        <span
                          className="flex items-center gap-1.5 rounded-[20px]"
                          style={{
                            background: pc.bg,
                            padding: "5px 10px",
                            fontFamily: "var(--font-inter)",
                            fontSize: 11,
                            fontWeight: 700,
                            color: pc.color,
                          }}
                        >
                          <pc.Icon size={12} />
                          {pc.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {task.status === "pending" && (
                            <button
                              onClick={() => handleStartTask(task.id)}
                              className="flex items-center gap-1.5 rounded-lg"
                              style={{
                                background: "#F97316",
                                padding: "9px 14px",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Timer size={14} color="#FFFFFF" />
                              <span
                                style={{
                                  fontFamily: "var(--font-space-grotesk)",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#FFFFFF",
                                }}
                              >
                                Mulai
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => handleMarkDone(task.id)}
                            className="flex items-center gap-1.5 rounded-lg"
                            style={{
                              background: "#16A34A",
                              padding: "9px 18px",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 3px 10px #16A34A40",
                            }}
                          >
                            <CircleCheck size={14} color="#FFFFFF" />
                            <span
                              style={{
                                fontFamily: "var(--font-space-grotesk)",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#FFFFFF",
                              }}
                            >
                              Selesai
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Done Tasks */}
              {doneTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 2px 8px #00000010",
                  }}
                >
                  <div style={{ height: 4, background: "#9CA3AF" }} />
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: "14px 20px" }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{ width: 44, height: 44, background: "#F3F4F6" }}
                      >
                        <CircleCheck size={22} color="#9CA3AF" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span
                          style={{
                            fontFamily: "var(--font-space-grotesk)",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#9CA3AF",
                          }}
                        >
                          {task.judul}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer size={13} color="#D1D5DB" />
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF" }}>
                            {timeAgo(task.created_at)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <span
                      className="flex items-center gap-1 rounded-[20px]"
                      style={{
                        background: "#F3F4F6",
                        padding: "4px 10px",
                        fontFamily: "var(--font-inter)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#9CA3AF",
                      }}
                    >
                      Selesai
                    </span>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center rounded-xl py-16"
                  style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
                >
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                    Tidak ada tugas ditemukan
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
