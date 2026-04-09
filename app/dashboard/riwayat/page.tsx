"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Clock, TrendingUp, Calendar, Filter, ChevronDown } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

/* ─── TYPES & DATA ───────────────────────────────────────────── */

type PriorityKey = "DARURAT" | "SEGERA" | "NORMAL";

interface HistoryItem {
  id: number;
  title: string;
  location: string;
  tools: string;
  priority: PriorityKey;
  duration: string;
  date: string;
  time: string;
  completedBy: string;
}

const PRIORITY_STYLE: Record<PriorityKey, { bg: string; color: string }> = {
  DARURAT: { bg: "#FEE2E2", color: "#EF4444" },
  SEGERA:  { bg: "#FFEDD5", color: "#F97316" },
  NORMAL:  { bg: "#F0FDF4", color: "#16A34A" },
};

const HISTORY: HistoryItem[] = [
  { id: 1,  title: "Koridor Kelas XI-B — Selesai Dibersihkan",   location: "Lantai 2, Gedung A", tools: "Pel + Sapu",              priority: "NORMAL",  duration: "22 mnt", date: "7 Apr 2026",  time: "07:45", completedBy: "Pak Sumarno" },
  { id: 2,  title: "Tumpahan Cairan — Koridor Kelas X-B",       location: "Lantai 1, Gedung A", tools: "Pel + Papan Peringatan",   priority: "DARURAT", duration: "18 mnt", date: "7 Apr 2026",  time: "06:52", completedBy: "Pak Sumarno" },
  { id: 3,  title: "Kebersihan Toilet Siswa Lantai 1",          location: "Lantai 1, Gedung A", tools: "Sikat + Disinfektan",      priority: "NORMAL",  duration: "35 mnt", date: "6 Apr 2026",  time: "15:10", completedBy: "Pak Sumarno" },
  { id: 4,  title: "Sampah Kering — Depan Kantin",              location: "Lantai 1, Gedung A", tools: "Sapu + Serok Sampah",      priority: "SEGERA",  duration: "14 mnt", date: "6 Apr 2026",  time: "10:38", completedBy: "Pak Sumarno" },
  { id: 5,  title: "Bak Sampah Meluber — Kelas XI-A",           location: "Lantai 2, Gedung A", tools: "Kosongkan Tong Sampah",    priority: "NORMAL",  duration: "10 mnt", date: "6 Apr 2026",  time: "09:22", completedBy: "Pak Sumarno" },
  { id: 6,  title: "Kotoran Burung — Area Parkiran",            location: "Halaman Sekolah",    tools: "Sikat + Selang Air",       priority: "NORMAL",  duration: "28 mnt", date: "5 Apr 2026",  time: "14:05", completedBy: "Pak Sumarno" },
  { id: 7,  title: "Genangan Air — Depan Lab IPA",              location: "Lantai 1, Gedung A", tools: "Pel + Kain Lap",           priority: "SEGERA",  duration: "19 mnt", date: "5 Apr 2026",  time: "11:45", completedBy: "Pak Sumarno" },
  { id: 8,  title: "Aula Pasca Acara — Pembersihan Menyeluruh", location: "Lantai 2, Gedung A", tools: "Sapu + Pel + Vakum",       priority: "NORMAL",  duration: "55 mnt", date: "4 Apr 2026",  time: "16:30", completedBy: "Pak Sumarno" },
  { id: 9,  title: "Coretan Dinding — Ruang Kelas X-C",        location: "Lantai 1, Gedung B", tools: "Cat Tembok + Kuas",        priority: "NORMAL",  duration: "45 mnt", date: "4 Apr 2026",  time: "13:00", completedBy: "Pak Sumarno" },
  { id: 10, title: "Saluran Air Tersumbat — Toilet Guru",       location: "Lantai 2, Gedung A", tools: "Alat Pembuka Sumbatan",    priority: "DARURAT", duration: "30 mnt", date: "3 Apr 2026",  time: "09:15", completedBy: "Pak Sumarno" },
];

type FilterOpt = "Semua" | "DARURAT" | "SEGERA" | "NORMAL";

export default function RiwayatPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOpt>("Semua");
  const [search, setSearch] = useState("");

  const visible = HISTORY.filter((h) => {
    const matchPriority = activeFilter === "Semua" || h.priority === activeFilter;
    const matchSearch = h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase());
    return matchPriority && matchSearch;
  });

  // Summary stats
  const totalTasks   = HISTORY.length;
  const avgDuration  = Math.round(HISTORY.reduce((acc, h) => acc + parseInt(h.duration), 0) / totalTasks);
  const daruratCount = HISTORY.filter((h) => h.priority === "DARURAT").length;
  const activeDays   = 5;

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
              Senin, 7 April 2026 • Rekap seluruh aktivitas kebersihan
            </span>
          </div>
          <div
            className="relative flex items-center justify-center rounded-[10px]"
            style={{
              width: 38,
              height: 38,
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              cursor: "pointer",
            }}
          >
            <Bell size={17} color="#374151" />
            <span
              className="absolute rounded-full"
              style={{ width: 8, height: 8, background: "#EF4444", top: 6, right: 6 }}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="flex flex-col gap-5 overflow-y-auto"
          style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}
        >
          {/* STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { Icon: CheckCircle2, iconColor: "#16A34A", iconBg: "#DCFCE7", title: "Total Tugas Selesai", value: String(totalTasks) + " tugas", sub: "Sepanjang riwayat" },
              { Icon: Clock,        iconColor: "#2563EB", iconBg: "#DBEAFE", title: "Rata-rata Waktu",     value: `${avgDuration} mnt`,         sub: "Per tugas diselesaikan" },
              { Icon: TrendingUp,   iconColor: "#D97706", iconBg: "#FEF3C7", title: "Tugas Darurat",       value: String(daruratCount) + " tugas", sub: "Berhasil ditangani" },
              { Icon: Calendar,     iconColor: "#7C3AED", iconBg: "#EDE9FE", title: "Hari Aktif",          value: String(activeDays) + " hari",  sub: "7 hari terakhir" },
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
          <div className="flex items-center gap-3">
            {/* Priority filter */}
            {(["Semua", "DARURAT", "SEGERA", "NORMAL"] as FilterOpt[]).map((f) => {
              const active = activeFilter === f;
              const style = f !== "Semua" ? PRIORITY_STYLE[f as PriorityKey] : null;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="rounded-[8px]"
                  style={{
                    padding: "7px 14px",
                    border: active
                      ? "1.5px solid #15803D"
                      : "1.5px solid #E5E7EB",
                    background: active
                      ? "#F0FDF4"
                      : style
                      ? style.bg
                      : "#FFFFFF",
                    fontFamily: "var(--font-inter)",
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    color: active
                      ? "#15803D"
                      : style
                      ? style.color
                      : "#6B7280",
                    cursor: "pointer",
                  }}
                >
                  {f === "Semua" ? `Semua (${totalTasks})` : `${f} (${HISTORY.filter(h => h.priority === f).length})`}
                </button>
              );
            })}
            {/* Search */}
            <div className="flex items-center gap-2 rounded-[10px] ml-auto" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "8px 14px", minWidth: 240 }}>
              <Filter size={14} color="#6B7280" />
              <input
                type="text"
                placeholder="Cari tugas atau lokasi..."
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
                gridTemplateColumns: "1fr 160px 100px 80px 110px 90px",
                padding: "13px 20px",
                background: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              {["Tugas", "Lokasi", "Prioritas", "Durasi", "Tanggal", "Waktu Selesai"].map((h) => (
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
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                  Tidak ada riwayat yang sesuai filter.
                </span>
              </div>
            ) : (
              visible.map((item, idx) => {
                const ps = PRIORITY_STYLE[item.priority];
                return (
                  <div
                    key={item.id}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: "1fr 160px 100px 80px 110px 90px",
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
                          {item.title}
                        </span>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>
                          {item.tools}
                        </span>
                      </div>
                    </div>
                    {/* Location */}
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                      {item.location}
                    </span>
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
                      {item.priority}
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
                      {item.duration}
                    </span>
                    {/* Date */}
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>
                      {item.date}
                    </span>
                    {/* Time + badge */}
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>
                        {item.time}
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
