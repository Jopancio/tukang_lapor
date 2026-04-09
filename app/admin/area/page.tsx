"use client";

import { useState } from "react";
import { Bell, Sparkles, TriangleAlert, Loader, MapPin, Plus } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

type Floor = "lantai1" | "lantai2" | "luar";

const ROOMS_LANTAI1 = [
  [
    { key: "kelasxa",    name: "Kelas X-A",    bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
    { key: "kelasxb",    name: "Kelas X-B",    bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444", status: "Perlu Dibersihkan", statusColor: "#EF4444", nameColor: "#B91C1C", StatusIcon: TriangleAlert },
  ],
  [
    { key: "koridorlt1", name: "Koridor Lt.1", bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444", status: "Perlu Dibersihkan", statusColor: "#EF4444", nameColor: "#B91C1C", StatusIcon: TriangleAlert },
    { key: "kantin",     name: "Kantin",        bg: "#FFEDD5", border: "#FDBA74", dot: "#F97316", status: "Sedang Diproses",  statusColor: "#F97316", nameColor: "#C2410C", StatusIcon: Loader },
  ],
  [
    { key: "toilet",     name: "Toilet Siswa", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
    { key: "labipa",     name: "Lab IPA",       bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
  ],
];

const ROOMS_LANTAI2 = [
  [
    { key: "x1a", name: "Kelas XI-A", bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444", status: "Perlu Dibersihkan", statusColor: "#EF4444", nameColor: "#B91C1C", StatusIcon: TriangleAlert },
    { key: "x1b", name: "Kelas XI-B", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
  ],
  [
    { key: "k2",  name: "Koridor Lt.2", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
    { key: "tg",  name: "Toilet Guru",  bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
  ],
  [
    { key: "au",  name: "Aula",          bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
    { key: "pp",  name: "Perpustakaan", bg: "#FFEDD5", border: "#FDBA74", dot: "#F97316", status: "Sedang Diproses",  statusColor: "#F97316", nameColor: "#C2410C", StatusIcon: Loader },
  ],
];

const ROOMS_LUAR = [
  [
    { key: "lp",  name: "Lapangan",     bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
    { key: "pk",  name: "Parkiran",     bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
  ],
  [
    { key: "ms",  name: "Mushola",      bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444", status: "Perlu Dibersihkan", statusColor: "#EF4444", nameColor: "#B91C1C", StatusIcon: TriangleAlert },
    { key: "tm",  name: "Taman",        bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
  ],
  [
    { key: "pu",  name: "Pintu Utama",  bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
    { key: "kp",  name: "Kan. Penjaga", bg: "#DCFCE7", border: "#86EFAC", dot: "#22C55E", status: "Bersih",          statusColor: "#16A34A", nameColor: "#15803D", StatusIcon: Sparkles },
  ],
];

const FLOOR_DATA: Record<Floor, { title: string; rooms: typeof ROOMS_LANTAI1; bersih: number; kotor: number; proses: number; total: number; progress: number }> = {
  lantai1: { title: "Denah Gedung A — Lantai 1", rooms: ROOMS_LANTAI1, bersih: 4, kotor: 2, proses: 1, total: 7, progress: 57 },
  lantai2: { title: "Denah Gedung A — Lantai 2", rooms: ROOMS_LANTAI2, bersih: 5, kotor: 1, proses: 1, total: 7, progress: 71 },
  luar:    { title: "Area Luar Ruangan",           rooms: ROOMS_LUAR,    bersih: 5, kotor: 1, proses: 0, total: 6, progress: 83 },
};

export default function AdminAreaPage() {
  const [floor, setFloor] = useState<Floor>("lantai1");
  const d = FLOOR_DATA[floor];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
      <AdminSidebar />
      <main className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <div className="flex flex-col" style={{ background: "#FFFFFF", flexShrink: 0, boxShadow: "0 1px 6px #00000010" }}>
          <div className="flex items-center justify-between pl-14 pr-4 sm:pl-8 sm:pr-8" style={{ height: 70 }}>
            <div className="flex flex-col gap-0.5">
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#111827" }}>Peta Area Sekolah</span>
              <span className="hidden sm:block" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>Rabu, 8 April 2026 • Pemantauan kondisi semua zona</span>
            </div>
            <div className="flex items-center gap-2.5">
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
                <span className="absolute rounded-full" style={{ width: 8, height: 8, background: "#EF4444", top: 6, right: 6 }} />
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

        <div className="flex flex-col lg:flex-row gap-5 overflow-y-auto lg:overflow-hidden" style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}>
          {/* MAP */}
          <div className="flex flex-col gap-4 rounded-[14px] w-full lg:w-[620px] lg:shrink-0" style={{ background: "#FFFFFF", padding: 24, boxShadow: "0 2px 10px #00000012" }}>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 16, fontWeight: 700, color: "#111827" }}>{d.title}</span>
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
              {d.rooms.map((row, ri) => (
                <div key={ri} className="flex flex-1" style={{ borderBottom: ri < d.rooms.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                  {row.map((room) => (
                    <div key={room.key} className="flex flex-col justify-between rounded-lg flex-1" style={{ background: room.bg, border: `1.5px solid ${room.border}`, padding: 14, margin: 8, minHeight: 80 }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: room.nameColor }}>{room.name}</span>
                        <span className="rounded-full" style={{ width: 12, height: 12, background: room.dot, display: "inline-block" }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 500, color: room.statusColor }}>{room.status}</span>
                        <room.StatusIcon size={16} color={room.statusColor} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            {/* Stats */}
            <div className="flex flex-col gap-3 rounded-xl" style={{ background: "#FFFFFF", padding: 20, boxShadow: "0 2px 8px #00000012" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>Ringkasan Area</span>
              {[
                { bg: "#F0FDF4", dot: "#22C55E", label: "Area Bersih",        labelColor: "#15803D", value: `${d.bersih} area`, valueColor: "#15803D" },
                { bg: "#FEF2F2", dot: "#EF4444", label: "Perlu Dibersihkan", labelColor: "#B91C1C", value: `${d.kotor} area`, valueColor: "#EF4444" },
                { bg: "#FFF7ED", dot: "#F97316", label: "Sedang Diproses",   labelColor: "#C2410C", value: `${d.proses} area`, valueColor: "#F97316" },
                { bg: "#F8FAFC", dot: "#6B7280", label: "Total Area",        labelColor: "#6B7280", value: `${d.total} area`, valueColor: "#111827" },
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

            {/* Admin Actions */}
            <div className="flex flex-col gap-3 rounded-xl" style={{ background: "#FFFFFF", padding: 18, boxShadow: "0 2px 8px #00000012" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 14, fontWeight: 700, color: "#111827" }}>Tindakan Admin</span>
              <button className="flex items-center gap-2 rounded-[10px] w-full justify-center" style={{ padding: "11px 16px", border: "none", background: "#1E3A5F", cursor: "pointer" }}>
                <Plus size={14} color="#FFFFFF" />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Buat Tugas untuk Area Ini</span>
              </button>
              <button className="flex items-center gap-2 rounded-[10px] w-full justify-center" style={{ padding: "11px 16px", border: "1.5px solid #E5E7EB", background: "#FFFFFF", cursor: "pointer" }}>
                <MapPin size={14} color="#374151" />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Assign Pekerja ke Area Ini</span>
              </button>
            </div>

            {/* Progress */}
            <div className="flex flex-col gap-2.5 rounded-xl" style={{ background: "#F0FDF4", padding: 16 }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 13, fontWeight: 700, color: "#15803D" }}>Progres Kebersihan Hari Ini</span>
              <div className="relative rounded-[5px] overflow-hidden" style={{ height: 10, background: "#DCFCE7" }}>
                <div className="absolute left-0 top-0 h-full rounded-[5px]" style={{ width: `${d.progress}%`, background: "#16A34A", transition: "width 0.4s" }} />
              </div>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#15803D" }}>
                {d.bersih} dari {d.total} area telah dibersihkan ({d.progress}%)
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

