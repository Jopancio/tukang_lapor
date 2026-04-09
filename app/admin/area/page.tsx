"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, MapPin, Plus, Loader2, RefreshCw,
  Sparkles, TriangleAlert, Loader, ExternalLink,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* --- TYPES --- */
type Floor = "lantai1" | "lantai2" | "luar";
type RoomStatus = "clean" | "dirty" | "inprogress";

interface Laporan {
  id: string;
  reporter_name: string;
  lokasi: string;
  kategori: string;
  deskripsi: string;
  urgency: "darurat" | "segera" | "normal";
  status: "baru" | "diproses" | "selesai";
  created_at: string;
}

/* --- ROOM DEFINITIONS --- */
const ROOMS_L1: { key: string; name: string }[][] = [
  [{ key: "kelasxa", name: "Kelas X-A" }, { key: "kelasxb", name: "Kelas X-B" }],
  [{ key: "koridorlt1", name: "Koridor Lt.1" }, { key: "kantin", name: "Kantin" }],
  [{ key: "toilet", name: "Toilet Siswa" }, { key: "labipa", name: "Lab IPA" }],
];
const ROOMS_L2: { key: string; name: string }[][] = [
  [{ key: "x1a", name: "Kelas XI-A" }, { key: "x1b", name: "Kelas XI-B" }],
  [{ key: "k2", name: "Koridor Lt.2" }, { key: "tg", name: "Toilet Guru" }],
  [{ key: "au", name: "Aula" }, { key: "pp", name: "Perpustakaan" }],
];
const ROOMS_LUAR: { key: string; name: string }[][] = [
  [{ key: "lp", name: "Lapangan" }, { key: "pk", name: "Parkiran" }],
  [{ key: "ms", name: "Mushola" }, { key: "tm", name: "Taman" }],
  [{ key: "pu", name: "Pintu Utama" }, { key: "kp", name: "Kan. Penjaga" }],
];

const FLOOR_ROOMS: Record<Floor, { key: string; name: string }[][]> = {
  lantai1: ROOMS_L1,
  lantai2: ROOMS_L2,
  luar: ROOMS_LUAR,
};

const FLOOR_TITLE: Record<Floor, string> = {
  lantai1: "Denah Gedung A — Lantai 1",
  lantai2: "Denah Gedung A — Lantai 2",
  luar: "Area Luar Ruangan",
};

/* --- LOKASI MATCHING --- */
const ROOM_KEYWORDS: Record<string, string[]> = {
  kelasxa:    ["kelas x-a", "xa", "10a", "kelas xa", "x a", "kelas x a"],
  kelasxb:    ["kelas x-b", "xb", "10b", "kelas xb", "x b", "kelas x b"],
  koridorlt1: ["koridor lt.1", "koridor 1", "koridor lantai 1", "koridor l1"],
  kantin:     ["kantin"],
  toilet:     ["toilet siswa", "toilet lt1", "toilet lantai 1", "wc siswa", "toilet 1"],
  labipa:     ["lab ipa", "laboratorium"],
  x1a:        ["kelas xi-a", "xi-a", "11a", "xi a", "kelas 11a", "kelas xi a"],
  x1b:        ["kelas xi-b", "xi-b", "11b", "xi b", "kelas 11b", "kelas xi b"],
  k2:         ["koridor lt.2", "koridor 2", "koridor lantai 2", "koridor l2"],
  tg:         ["toilet guru", "wc guru", "toilet staff"],
  au:         ["aula"],
  pp:         ["perpustakaan", "perpus"],
  lp:         ["lapangan"],
  pk:         ["parkiran", "parkir"],
  ms:         ["mushola", "musola", "masjid"],
  tm:         ["taman"],
  pu:         ["pintu utama", "gerbang"],
  kp:         ["kantor penjaga", "pos satpam", "pos jaga", "penjaga"],
};

function matchRoom(lokasi: string): string | null {
  const lower = lokasi.toLowerCase().trim();
  for (const [roomKey, keywords] of Object.entries(ROOM_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return roomKey;
  }
  return null;
}

const FLOOR_ROOM_KEYS: Record<Floor, string[]> = {
  lantai1: ["kelasxa", "kelasxb", "koridorlt1", "kantin", "toilet", "labipa"],
  lantai2: ["x1a", "x1b", "k2", "tg", "au", "pp"],
  luar:    ["lp", "pk", "ms", "tm", "pu", "kp"],
};

/* --- ROOM STYLE --- */
function roomStyle(st: RoomStatus): {
  bg: string; border: string; dot: string;
  status: string; statusColor: string; nameColor: string;
  StatusIcon: React.ElementType;
} {
  if (st === "dirty") return {
    bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444",
    status: "Perlu Dibersihkan", statusColor: "#EF4444", nameColor: "#B91C1C",
    StatusIcon: TriangleAlert,
  };
  if (st === "inprogress") return {
    bg: "#FFEDD5", border: "#FDBA74", dot: "#F97316",
    status: "Sedang Diproses", statusColor: "#F97316", nameColor: "#C2410C",
    StatusIcon: Loader,
  };
  return {
    bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E",
    status: "Bersih", statusColor: "#16A34A", nameColor: "#15803D",
    StatusIcon: Sparkles,
  };
}

const URGENCY: Record<string, { bg: string; color: string; border: string; label: string }> = {
  darurat: { bg: "#FEE2E2", color: "#EF4444", border: "#FECACA", label: "DARURAT" },
  segera:  { bg: "#FFEDD5", color: "#F97316", border: "#FED7AA", label: "SEGERA" },
  normal:  { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "NORMAL" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function todayString() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/* --- PAGE --- */
export default function AdminAreaPage() {
  const [floor, setFloor] = useState<Floor>("lantai1");
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLaporan = useCallback(async () => {
    try {
      const res = await fetch("/api/laporan");
      if (!res.ok) return;
      const { laporan: data } = await res.json();
      setLaporan((data as Laporan[]).filter((l) => l.status !== "selesai"));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaporan();
    const supabase = createClient();
    const channel = supabase
      .channel("admin-area-laporan")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "laporan" }, (payload) => {
        const nl = payload.new as Laporan;
        if (nl.status !== "selesai") setLaporan((prev) => [nl, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "laporan" }, (payload) => {
        const ul = payload.new as Laporan;
        setLaporan((prev) =>
          ul.status === "selesai"
            ? prev.filter((l) => l.id !== ul.id)
            : prev.map((l) => (l.id === ul.id ? ul : l))
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLaporan]);

  const handleStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await fetch("/api/laporan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const roomStatusMap: Record<string, RoomStatus> = {};
  for (const l of laporan) {
    const key = matchRoom(l.lokasi);
    if (!key) continue;
    if (l.status === "baru" && roomStatusMap[key] !== "dirty") roomStatusMap[key] = "dirty";
    else if (l.status === "diproses" && !roomStatusMap[key]) roomStatusMap[key] = "inprogress";
  }

  const floorKeys = FLOOR_ROOM_KEYS[floor];
  const floorLaporan = laporan.filter((l) => {
    const key = matchRoom(l.lokasi);
    return key ? floorKeys.includes(key) : false;
  });

  const bersih = floorKeys.filter((k) => !roomStatusMap[k]).length;
  const kotor  = floorKeys.filter((k) => roomStatusMap[k] === "dirty").length;
  const proses = floorKeys.filter((k) => roomStatusMap[k] === "inprogress").length;
  const total  = floorKeys.length;
  const progress = Math.round((bersih / total) * 100);
  const rooms = FLOOR_ROOMS[floor];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
      <AdminSidebar />
      <main className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <div className="flex flex-col" style={{ background: "#FFFFFF", flexShrink: 0, boxShadow: "0 1px 6px #00000010" }}>
          <div className="flex items-center justify-between pl-14 pr-4 sm:pl-8 sm:pr-8" style={{ height: 70 }}>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#111827" }}>
                  Peta Area Sekolah
                </span>
                <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "#DCFCE7" }}>
                  <span className="rounded-full animate-pulse" style={{ width: 6, height: 6, background: "#16A34A", display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 600, color: "#15803D" }}>Live</span>
                </div>
              </div>
              <span className="hidden sm:block" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                {todayString()} · Pemantauan kondisi semua zona secara real-time
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => { setLoading(true); fetchLaporan(); }} className="rounded-[10px] flex items-center gap-1.5" style={{ padding: "8px 12px", border: "1px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer" }}>
                {loading ? <Loader2 size={14} color="#6B7280" className="animate-spin" /> : <RefreshCw size={14} color="#6B7280" />}
                <span className="hidden sm:inline" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>Refresh</span>
              </button>
              <div className="hidden sm:flex gap-1 rounded-[10px] p-1" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
                {(["lantai1", "lantai2", "luar"] as Floor[]).map((f, i) => {
                  const active = floor === f;
                  return (
                    <button key={f} onClick={() => setFloor(f)} className="rounded-[7px]"
                      style={{ background: active ? "#1E3A5F" : "transparent", padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#FFFFFF" : "#6B7280" }}>
                      {["Lantai 1", "Lantai 2", "Luar Ruangan"][i]}
                    </button>
                  );
                })}
              </div>
              <div className="relative flex items-center justify-center rounded-[10px]" style={{ width: 38, height: 38, background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <Bell size={17} color="#374151" />
                {laporan.filter((l) => l.status === "baru").length > 0 && (
                  <span className="absolute flex items-center justify-center rounded-full" style={{ minWidth: 16, height: 16, background: "#EF4444", top: 4, right: 4, padding: "0 3px", fontFamily: "var(--font-inter)", fontSize: 9, fontWeight: 700, color: "#FFF" }}>
                    {laporan.filter((l) => l.status === "baru").length}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Mobile floor tabs */}
          <div className="flex sm:hidden gap-1 px-4 pb-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            {(["lantai1", "lantai2", "luar"] as Floor[]).map((f, i) => {
              const active = floor === f;
              return (
                <button key={f} onClick={() => setFloor(f)} className="flex-1 rounded-[7px]"
                  style={{ background: active ? "#1E3A5F" : "#F3F4F6", padding: "7px 4px", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#FFFFFF" : "#6B7280", marginTop: 8 }}>
                  {["Lantai 1", "Lantai 2", "Luar"][i]}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col lg:flex-row gap-5 overflow-y-auto lg:overflow-hidden" style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}>
          {/* MAP */}
          <div className="flex flex-col gap-4 rounded-[14px] w-full lg:w-[600px] lg:shrink-0" style={{ background: "#FFFFFF", padding: 24, boxShadow: "0 2px 10px #00000012" }}>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 16, fontWeight: 700, color: "#111827" }}>{FLOOR_TITLE[floor]}</span>
              <div className="flex items-center gap-3">
                {[{ dot: "#22C55E", label: "Bersih" }, { dot: "#EF4444", label: "Kotor" }, { dot: "#F97316", label: "Proses" }].map(({ dot, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="rounded-full" style={{ width: 8, height: 8, background: dot, display: "inline-block" }} />
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-0 rounded-xl overflow-hidden flex-1" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              {loading ? (
                <div className="flex items-center justify-center gap-2" style={{ padding: 60 }}>
                  <Loader2 size={20} color="#6B7280" className="animate-spin" />
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>Memuat data area...</span>
                </div>
              ) : (
                rooms.map((row, ri) => (
                  <div key={ri} className="flex flex-1" style={{ borderBottom: ri < rooms.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                    {row.map((room) => {
                      const st = roomStyle(roomStatusMap[room.key] ?? "clean");
                      const { StatusIcon } = st;
                      return (
                        <div key={room.key} className="flex flex-col justify-between rounded-lg flex-1"
                          style={{ background: st.bg, border: `1.5px solid ${st.border}`, padding: 14, margin: 8, minHeight: 80 }}>
                          <div className="flex items-center justify-between">
                            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: st.nameColor }}>{room.name}</span>
                            <span className="rounded-full" style={{ width: 12, height: 12, background: st.dot, display: "inline-block" }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 500, color: st.statusColor }}>{st.status}</span>
                            <StatusIcon size={16} color={st.statusColor} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            {/* Stats */}
            <div className="flex flex-col gap-3 rounded-xl" style={{ background: "#FFFFFF", padding: 20, boxShadow: "0 2px 8px #00000012" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>Ringkasan Area</span>
              {[
                { bg: "#F0FDF4", dot: "#22C55E", label: "Area Bersih",        labelColor: "#15803D", value: `${bersih} area`, valueColor: "#15803D" },
                { bg: "#FEF2F2", dot: "#EF4444", label: "Perlu Dibersihkan",  labelColor: "#B91C1C", value: `${kotor} area`, valueColor: "#EF4444" },
                { bg: "#FFF7ED", dot: "#F97316", label: "Sedang Diproses",    labelColor: "#C2410C", value: `${proses} area`, valueColor: "#F97316" },
                { bg: "#F8FAFC", dot: "#6B7280", label: "Total Area",         labelColor: "#6B7280", value: `${total} area`, valueColor: "#111827" },
              ].map(({ bg, dot, label, labelColor, value, valueColor }) => (
                <div key={label} className="flex items-center justify-between rounded-[10px]" style={{ background: bg, padding: "10px 14px" }}>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full" style={{ width: 12, height: 12, background: dot, display: "inline-block" }} />
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500, color: labelColor }}>{label}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 14, fontWeight: 700, color: valueColor }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Active laporan for floor */}
            <div className="flex flex-col gap-3 rounded-xl" style={{ background: "#FFFFFF", padding: 18, boxShadow: "0 2px 8px #00000012" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 14, fontWeight: 700, color: "#111827" }}>Laporan Aktif di Area Ini</span>
                {floorLaporan.length > 0 && (
                  <span className="rounded-full" style={{ background: "#FEE2E2", padding: "3px 10px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#EF4444" }}>
                    {floorLaporan.length} aktif
                  </span>
                )}
              </div>
              {floorLaporan.length === 0 ? (
                <div className="flex flex-col items-center gap-2" style={{ padding: "20px 0" }}>
                  <Sparkles size={24} color="#22C55E" />
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>Tidak ada laporan aktif di area ini</span>
                </div>
              ) : (
                [...floorLaporan]
                  .sort((a, b) => ({ darurat: 0, segera: 1, normal: 2 }[a.urgency] ?? 2) - ({ darurat: 0, segera: 1, normal: 2 }[b.urgency] ?? 2))
                  .map((l) => {
                    const ug = URGENCY[l.urgency] ?? URGENCY.normal;
                    const isUpdating = updatingId === l.id;
                    return (
                      <div key={l.id} className="flex flex-col gap-2 rounded-[10px]" style={{ background: ug.bg, padding: "10px 12px", border: `1px solid ${ug.border}` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 700, color: "#111827" }}>{l.reporter_name}</span>
                            <div className="flex items-center gap-1">
                              <MapPin size={10} color="#9CA3AF" />
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>{l.lokasi}</span>
                            </div>
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#374151" }}>{l.deskripsi.slice(0, 80)}{l.deskripsi.length > 80 ? "…" : ""}</span>
                          </div>
                          <span className="rounded-[20px] flex-shrink-0" style={{ padding: "3px 8px", border: `1px solid ${ug.color}40`, fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 700, color: ug.color, whiteSpace: "nowrap" }}>
                            {ug.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>{formatTime(l.created_at)}</span>
                          <div className="flex gap-1.5">
                            {l.status === "baru" && (
                              <button disabled={isUpdating} onClick={() => handleStatus(l.id, "diproses")} className="rounded-[6px]"
                                style={{ padding: "4px 8px", border: "1px solid #FED7AA", background: "#FFF7ED", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#F97316", cursor: isUpdating ? "wait" : "pointer", opacity: isUpdating ? 0.6 : 1 }}>
                                Proses
                              </button>
                            )}
                            <button disabled={isUpdating} onClick={() => handleStatus(l.id, "selesai")} className="rounded-[6px] flex items-center gap-1"
                              style={{ padding: "4px 8px", border: "1px solid #86EFAC", background: "#F0FDF4", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#16A34A", cursor: isUpdating ? "wait" : "pointer", opacity: isUpdating ? 0.6 : 1 }}>
                              {isUpdating && <Loader2 size={10} className="animate-spin" />}
                              Selesai
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 rounded-xl" style={{ background: "#FFFFFF", padding: 18, boxShadow: "0 2px 8px #00000012" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 14, fontWeight: 700, color: "#111827" }}>Tindakan Admin</span>
              <Link href="/admin/tugas" className="flex items-center gap-2 rounded-[10px] w-full justify-center" style={{ padding: "11px 16px", background: "#1E3A5F", textDecoration: "none" }}>
                <Plus size={14} color="#FFFFFF" />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Buat Tugas untuk Area Ini</span>
              </Link>
              <Link href="/admin/laporan-masuk" className="flex items-center gap-2 rounded-[10px] w-full justify-center" style={{ padding: "11px 16px", border: "1.5px solid #E5E7EB", background: "#FFFFFF", textDecoration: "none" }}>
                <ExternalLink size={14} color="#374151" />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Lihat Semua Laporan Masuk</span>
              </Link>
            </div>

            {/* Progress */}
            <div className="flex flex-col gap-2.5 rounded-xl" style={{ background: "#F0FDF4", padding: 16 }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: "#15803D" }}>Progres Kebersihan Area Ini</span>
              <div className="relative rounded-[5px] overflow-hidden" style={{ height: 10, background: "#DCFCE7" }}>
                <div className="absolute left-0 top-0 h-full rounded-[5px]" style={{ width: `${progress}%`, background: "#16A34A", transition: "width 0.4s" }} />
              </div>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#15803D" }}>
                {bersih} dari {total} area bersih ({progress}%)
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
