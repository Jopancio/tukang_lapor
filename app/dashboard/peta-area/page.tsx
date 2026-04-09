"use client";

import { useState } from "react";
import { Bell, Sparkles, TriangleAlert, Loader, MapPin } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

/* ─── DATA ─────────────────────────────────────────────────── */

type Floor = "lantai1" | "lantai2" | "luar";

const ROOMS_LANTAI1 = [
  [
    { key: "kelasxa", name: "Kelas X-A", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
    { key: "kelasxb", name: "Kelas X-B", bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444", status: "Perlu Dibersihkan", statusColor: "#EF4444", StatusIcon: TriangleAlert },
  ],
  [
    { key: "koridorlt1", name: "Koridor Lt.1", bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444", status: "Perlu Dibersihkan", statusColor: "#EF4444", StatusIcon: TriangleAlert },
    { key: "kantin", name: "Kantin", bg: "#FFEDD5", border: "#FDBA74", dot: "#F97316", status: "Sedang Diproses", statusColor: "#F97316", StatusIcon: Loader },
  ],
  [
    { key: "toiletsiswa", name: "Toilet Siswa", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
    { key: "labipa", name: "Lab IPA", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
  ],
];

const ROOMS_LANTAI2 = [
  [
    { key: "kelasx1a", name: "Kelas XI-A", bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444", status: "Perlu Dibersihkan", statusColor: "#EF4444", StatusIcon: TriangleAlert },
    { key: "kelasx1b", name: "Kelas XI-B", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
  ],
  [
    { key: "koridorlt2", name: "Koridor Lt.2", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
    { key: "toiletguru", name: "Toilet Guru", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
  ],
  [
    { key: "aula", name: "Aula Sekolah", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
    { key: "perpustakaan", name: "Perpustakaan", bg: "#FFF7ED", border: "#FDBA74", dot: "#F97316", status: "Sedang Diproses", statusColor: "#F97316", StatusIcon: Loader },
  ],
];

const ROOMS_LUAR = [
  [
    { key: "lapangan", name: "Lapangan", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
    { key: "parkiran", name: "Parkiran", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
  ],
  [
    { key: "mushola", name: "Mushola", bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444", status: "Perlu Dibersihkan", statusColor: "#EF4444", StatusIcon: TriangleAlert },
    { key: "taman", name: "Taman Sekolah", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
  ],
  [
    { key: "pintuutama", name: "Pintu Utama", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
    { key: "kanpenjaga", name: "Kan. Penjaga", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih", statusColor: "#16A34A", StatusIcon: Sparkles },
  ],
];

const FLOOR_DATA: Record<Floor, {
  title: string;
  rooms: typeof ROOMS_LANTAI1;
  stats: { bersih: number; kotor: number; proses: number; total: number };
  selected: { name: string; loc: string; lastCleaned: string };
  nearby: { title: string; sub: string; badge: string; badgeBg: string; badgeColor: string; bg: string }[];
  progress: { label: string; pct: number };
}> = {
  lantai1: {
    title: "Denah Gedung A — Lantai 1",
    rooms: ROOMS_LANTAI1,
    stats: { bersih: 4, kotor: 2, proses: 1, total: 7 },
    selected: { name: "Kelas X-B", loc: "📍 Lantai 1 — Gedung A", lastCleaned: "🕐 Terakhir dibersihkan: Kemarin 14:30" },
    nearby: [
      { title: "Sampah Berserakan", sub: "Kelas X-B · 08:15", badge: "DARURAT", badgeBg: "#FEE2E2", badgeColor: "#EF4444", bg: "#FEF2F2" },
      { title: "Lantai Berminyak", sub: "Kelas X-B · 09:00", badge: "SEGERA", badgeBg: "#FFEDD5", badgeColor: "#F97316", bg: "#FFF7ED" },
    ],
    progress: { label: "4 dari 7 area telah dibersihkan (57%)", pct: 57 },
  },
  lantai2: {
    title: "Denah Gedung A — Lantai 2",
    rooms: ROOMS_LANTAI2,
    stats: { bersih: 5, kotor: 1, proses: 1, total: 7 },
    selected: { name: "Kelas XI-A", loc: "📍 Lantai 2 — Gedung A", lastCleaned: "🕐 Terakhir dibersihkan: Hari ini 06:30" },
    nearby: [
      { title: "Bak Sampah Meluber", sub: "Kelas XI-A · 07:20", badge: "SEGERA", badgeBg: "#FFEDD5", badgeColor: "#F97316", bg: "#FFF7ED" },
    ],
    progress: { label: "5 dari 7 area telah dibersihkan (71%)", pct: 71 },
  },
  luar: {
    title: "Area Luar Ruangan",
    rooms: ROOMS_LUAR,
    stats: { bersih: 5, kotor: 1, proses: 0, total: 6 },
    selected: { name: "Mushola", loc: "📍 Halaman Sekolah", lastCleaned: "🕐 Terakhir dibersihkan: Kemarin 12:00" },
    nearby: [
      { title: "Perlu Penyapuan Daun", sub: "Mushola · 08:45", badge: "NORMAL", badgeBg: "#F0FDF4", badgeColor: "#16A34A", bg: "#F0FDF4" },
    ],
    progress: { label: "5 dari 6 area telah dibersihkan (83%)", pct: 83 },
  },
};

/* ─── PAGE COMPONENT ─────────────────────────────────────────── */

export default function PetaAreaPage() {
  const [floor, setFloor] = useState<Floor>("lantai1");
  const data = FLOOR_DATA[floor];

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
              Peta Area Sekolah
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
              Senin, 7 April 2026 • Pantau kondisi setiap zona
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Floor Selector */}
            <div
              className="flex gap-1 rounded-[10px] p-1"
              style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}
            >
              {(["lantai1", "lantai2", "luar"] as Floor[]).map((f, idx) => {
                const labels = ["Lantai 1", "Lantai 2", "Luar Ruangan"];
                const active = floor === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFloor(f)}
                    className="rounded-[7px]"
                    style={{
                      background: active ? "#15803D" : "transparent",
                      padding: "6px 12px",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-inter)",
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {labels[idx]}
                  </button>
                );
              })}
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
        </div>

        {/* CONTENT */}
        <div
          className="flex flex-col lg:flex-row gap-5 overflow-y-auto lg:overflow-hidden"
          style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}
        >
          {/* LEFT — Map */}
          <div
            className="flex flex-col gap-4 rounded-[14px] w-full lg:w-[660px] lg:shrink-0"
            style={{
              background: "#FFFFFF",
              padding: 24,
              boxShadow: "0 2px 10px #00000012",
            }}
          >
            {/* Map Header */}
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {data.title}
              </span>
              <div className="flex items-center gap-3">
                {[
                  { dot: "#22C55E", label: "Bersih" },
                  { dot: "#EF4444", label: "Kotor" },
                  { dot: "#F97316", label: "Proses" },
                ].map(({ dot, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span
                      className="rounded-full"
                      style={{ width: 8, height: 8, background: dot, display: "inline-block" }}
                    />
                    <span
                      style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Grid */}
            <div
              className="flex flex-col gap-0 rounded-xl overflow-hidden flex-1"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            >
              {data.rooms.map((row, ri) => (
                <div
                  key={ri}
                  className="flex flex-1"
                  style={{ borderBottom: ri < data.rooms.length - 1 ? "1px solid #E2E8F0" : "none" }}
                >
                  {row.map((room, ci) => (
                    <div
                      key={room.key}
                      className="flex flex-col justify-between rounded-lg flex-1"
                      style={{
                        background: room.bg,
                        border: `1.5px solid ${room.border}`,
                        padding: 14,
                        margin: 8,
                        minHeight: 80,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          style={{
                            fontFamily: "var(--font-space-grotesk)",
                            fontSize: 13,
                            fontWeight: 700,
                            color: room.dot === "#22C55E" ? "#15803D" : room.dot === "#EF4444" ? "#B91C1C" : "#C2410C",
                          }}
                        >
                          {room.name}
                        </span>
                        <span
                          className="rounded-full"
                          style={{
                            width: 12,
                            height: 12,
                            background: room.dot,
                            display: "inline-block",
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 11,
                            fontWeight: room.dot === "#22C55E" ? 500 : 600,
                            color: room.statusColor,
                          }}
                        >
                          {room.status}
                        </span>
                        <room.StatusIcon size={16} color={room.statusColor} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Panels */}
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            {/* Stats Panel */}
            <div
              className="flex flex-col gap-3.5 rounded-xl"
              style={{
                background: "#FFFFFF",
                padding: 20,
                boxShadow: "0 2px 8px #00000012",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Ringkasan Area
              </span>
              {[
                { bg: "#F0FDF4", dot: "#22C55E", label: "Area Bersih", labelColor: "#15803D", value: String(data.stats.bersih) + " area", valueColor: "#15803D" },
                { bg: "#FEF2F2", dot: "#EF4444", label: "Perlu Dibersihkan", labelColor: "#B91C1C", value: String(data.stats.kotor) + " area", valueColor: "#EF4444" },
                { bg: "#FFF7ED", dot: "#F97316", label: "Sedang Diproses", labelColor: "#C2410C", value: String(data.stats.proses) + " area", valueColor: "#F97316" },
                { bg: "#F8FAFC", dot: "#6B7280", label: "Total Area", labelColor: "#6B7280", value: String(data.stats.total) + " area", valueColor: "#111827" },
              ].map(({ bg, dot, label, labelColor, value, valueColor }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-[10px]"
                  style={{ background: bg, padding: "10px 14px" }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="rounded-full"
                      style={{ width: 12, height: 12, background: dot, display: "inline-block" }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: labelColor,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: valueColor,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Selected Area Card */}
            <div
              className="flex flex-col gap-3 rounded-xl"
              style={{
                background: "#FEF2F2",
                padding: 18,
                boxShadow: "0 2px 8px #EF444422",
                border: "1px solid #FECACA",
              }}
            >
              <div className="flex items-start justify-between">
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {data.selected.name}
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-[20px]"
                  style={{
                    background: "#EF4444",
                    padding: "5px 10px",
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#FFFFFF",
                  }}
                >
                  <span
                    className="rounded-full"
                    style={{ width: 6, height: 6, background: "#FFFFFF", display: "inline-block" }}
                  />
                  Perlu Dibersihkan
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                  {data.selected.loc}
                </span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                  {data.selected.lastCleaned}
                </span>
              </div>
              <button
                className="flex items-center justify-center gap-2 rounded-[10px] w-full"
                style={{
                  background: "#15803D",
                  padding: "12px 16px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <MapPin size={14} color="#FFFFFF" />
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#FFFFFF",
                  }}
                >
                  Mulai Bersihkan Area Ini
                </span>
              </button>
            </div>

            {/* Nearby Tasks */}
            <div
              className="flex flex-col gap-3 rounded-xl"
              style={{
                background: "#FFFFFF",
                padding: 18,
                boxShadow: "0 2px 8px #00000012",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Tugas Terkait Area
              </span>
              {data.nearby.map((n, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[10px]"
                  style={{ background: n.bg, padding: "12px 14px" }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {n.title}
                    </span>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>
                      {n.sub}
                    </span>
                  </div>
                  <span
                    className="rounded-[20px]"
                    style={{
                      background: n.badgeBg,
                      padding: "4px 10px",
                      fontFamily: "var(--font-inter)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: n.badgeColor,
                    }}
                  >
                    {n.badge}
                  </span>
                </div>
              ))}
            </div>

            {/* Performance Panel */}
            <div
              className="flex flex-col gap-2.5 rounded-xl"
              style={{ background: "#F0FDF4", padding: 16 }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#15803D",
                }}
              >
                Progres Kebersihan Hari Ini
              </span>
              <div
                className="relative rounded-[5px] overflow-hidden"
                style={{ height: 10, background: "#DCFCE7" }}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-[5px]"
                  style={{
                    width: `${data.progress.pct}%`,
                    background: "#16A34A",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#15803D" }}>
                {data.progress.label}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
