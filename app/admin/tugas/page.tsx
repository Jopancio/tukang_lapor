"use client";

import { useState } from "react";
import {
  Bell,
  Plus,
  ClipboardList,
  Filter,
  ChevronDown,
  User,
  MapPin,
  Wrench,
  X,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

/* ─── TYPES & DATA ───────────────────────────────────────────── */

type Priority  = "DARURAT" | "SEGERA" | "NORMAL";
type TaskStatus = "menunggu" | "proses" | "selesai";

const PRIORITY_STYLE: Record<Priority, { bg: string; color: string; border: string }> = {
  DARURAT: { bg: "#FEE2E2", color: "#EF4444", border: "#EF4444" },
  SEGERA:  { bg: "#FFEDD5", color: "#F97316", border: "#F97316" },
  NORMAL:  { bg: "#F0FDF4", color: "#16A34A", border: "#16A34A" },
};

const STATUS_STYLE: Record<TaskStatus, { bg: string; color: string; label: string }> = {
  menunggu: { bg: "#F3F4F6", color: "#6B7280", label: "Menunggu" },
  proses:   { bg: "#DBEAFE", color: "#2563EB", label: "Dalam Proses" },
  selesai:  { bg: "#DCFCE7", color: "#16A34A", label: "Selesai" },
};

interface Task {
  id: number;
  title: string;
  location: string;
  area: string;
  tools: string;
  priority: Priority;
  status: TaskStatus;
  assignedTo: string;
  createdAt: string;
  dueTime: string;
}

const INITIAL_TASKS: Task[] = [
  { id: 1,  title: "Tumpahan Cairan — Koridor X-B",              location: "Lantai 1, Gd.A", area: "Koridor Lt.1", tools: "Pel + Papan Peringatan",  priority: "DARURAT", status: "proses",   assignedTo: "Pak Sumarno", createdAt: "08 Apr", dueTime: "07:30" },
  { id: 2,  title: "Sampah Kering — Depan Kantin",               location: "Lantai 1, Gd.A", area: "Kantin",       tools: "Sapu + Serok Sampah",     priority: "SEGERA",  status: "proses",   assignedTo: "Pak Budi",    createdAt: "08 Apr", dueTime: "08:00" },
  { id: 3,  title: "Lantai Berminyak — Kelas X-B",               location: "Lantai 1, Gd.A", area: "Kelas X-B",   tools: "Pel",                     priority: "SEGERA",  status: "menunggu", assignedTo: "Pak Sumarno", createdAt: "08 Apr", dueTime: "09:00" },
  { id: 4,  title: "Penyapuan Lapangan Sekolah",                 location: "Halaman",         area: "Lapangan",    tools: "Sapu + Pengki",           priority: "NORMAL",  status: "proses",   assignedTo: "Pak Ahmad",   createdAt: "08 Apr", dueTime: "08:30" },
  { id: 5,  title: "Kebersihan Toilet Siswa Lantai 1",           location: "Lantai 1, Gd.A", area: "Toilet Siswa", tools: "Sikat + Disinfektan",     priority: "NORMAL",  status: "menunggu", assignedTo: "Pak Sumarno", createdAt: "08 Apr", dueTime: "10:00" },
  { id: 6,  title: "Bak Sampah Meluber — Kelas XI-A",            location: "Lantai 2, Gd.A", area: "Kelas XI-A",  tools: "Kosongkan Tong Sampah",   priority: "NORMAL",  status: "menunggu", assignedTo: "Pak Budi",    createdAt: "08 Apr", dueTime: "09:30" },
  { id: 7,  title: "Kotoran Halaman Depan",                      location: "Halaman",         area: "Pintu Utama", tools: "Sapu + Selang Air",       priority: "NORMAL",  status: "menunggu", assignedTo: "Pak Ahmad",   createdAt: "08 Apr", dueTime: "10:30" },
  { id: 8,  title: "Koridor Kelas XI-B — Selesai Dibersihkan",   location: "Lantai 2, Gd.A", area: "Koridor Lt.2", tools: "Pel + Sapu",             priority: "NORMAL",  status: "selesai",  assignedTo: "Pak Sumarno", createdAt: "08 Apr", dueTime: "07:45" },
  { id: 9,  title: "Tumpahan di Area Parkiran",                  location: "Halaman",         area: "Parkiran",    tools: "Pasir Serap + Sapu",      priority: "DARURAT", status: "selesai",  assignedTo: "Pak Ahmad",   createdAt: "07 Apr", dueTime: "06:52" },
  { id: 10, title: "Pembersihan Area Lab IPA Pasca Praktikum",   location: "Lantai 1, Gd.A", area: "Lab IPA",     tools: "Lap + Disinfektan",       priority: "SEGERA",  status: "selesai",  assignedTo: "Pak Budi",    createdAt: "07 Apr", dueTime: "15:00" },
];

type TabFilter = "semua" | "menunggu" | "proses" | "selesai";

/* ─── CREATE TASK MODAL ─────────────────────────────────────── */

function CreateTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Task) => void }) {
  const [form, setForm] = useState({
    title: "",
    location: "",
    area: "",
    tools: "",
    priority: "NORMAL" as Priority,
    assignedTo: "Pak Sumarno",
    dueTime: "",
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onAdd({
      id: Date.now(),
      title: form.title,
      location: form.location,
      area: form.area,
      tools: form.tools,
      priority: form.priority,
      status: "menunggu",
      assignedTo: form.assignedTo,
      createdAt: "8 Apr",
      dueTime: form.dueTime || "—",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
      <div className="flex flex-col gap-4 rounded-2xl" style={{ background: "#FFFFFF", padding: 32, width: 520, boxShadow: "0 8px 40px #00000030", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>Buat Tugas Baru</span>
          <button onClick={onClose} style={{ border: "none", background: "#F3F4F6", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Judul Tugas *</label>
          <input
            type="text"
            placeholder="Contoh: Lantai Berminyak — Kelas X-B"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
          />
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Lokasi</label>
            <input
              type="text"
              placeholder="Lantai 1, Gd.A"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Zona Area</label>
            <input
              type="text"
              placeholder="Kelas X-B"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Alat yang Dibutuhkan</label>
          <input
            type="text"
            placeholder="Pel + Sapu + Disinfektan"
            value={form.tools}
            onChange={(e) => setForm({ ...form, tools: e.target.value })}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
          />
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Prioritas</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", background: "#FFFFFF" }}
            >
              <option value="NORMAL">NORMAL</option>
              <option value="SEGERA">SEGERA</option>
              <option value="DARURAT">DARURAT</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Assign ke</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", background: "#FFFFFF" }}
            >
              <option>Pak Sumarno</option>
              <option>Pak Budi</option>
              <option>Pak Ahmad</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Batas Waktu</label>
            <input
              type="time"
              value={form.dueTime}
              onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            Batal
          </button>
          <button onClick={handleSubmit} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "none", background: "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}>
            Buat Tugas
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE ──────────────────────────────────────────────────── */

export default function AdminTugasPage() {
  const [tasks, setTasks]     = useState<Task[]>(INITIAL_TASKS);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab]         = useState<TabFilter>("semua");
  const [search, setSearch]   = useState("");
  const [workerF, setWorkerF] = useState("Semua");

  const handleAdd = (t: Task) => setTasks((prev) => [t, ...prev]);

  const handleStatusChange = (id: number, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  };

  const visible = tasks.filter((t) => {
    const tMatch = tab === "semua" || t.status === tab;
    const sMatch = t.title.toLowerCase().includes(search.toLowerCase()) || t.location.toLowerCase().includes(search.toLowerCase());
    const wMatch = workerF === "Semua" || t.assignedTo === workerF;
    return tMatch && sMatch && wMatch;
  });

  const counts = {
    semua:    tasks.length,
    menunggu: tasks.filter((t) => t.status === "menunggu").length,
    proses:   tasks.filter((t) => t.status === "proses").length,
    selesai:  tasks.filter((t) => t.status === "selesai").length,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
      <AdminSidebar />
      {showModal && <CreateTaskModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      <main className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <div className="flex items-center justify-between pl-14 pr-4 sm:pl-8 sm:pr-8" style={{ background: "#FFFFFF", height: 70, flexShrink: 0, boxShadow: "0 1px 6px #00000010" }}>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#111827" }}>Manajemen Tugas</span>
            <span className="hidden sm:block" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>Rabu, 8 April 2026 • Buat, assign, dan pantau seluruh tugas kebersihan</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-[10px]"
              style={{ padding: "9px 16px", background: "#1E3A5F", border: "none", cursor: "pointer" }}
            >
              <Plus size={16} color="#FFFFFF" />
              <span className="hidden sm:inline" style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Buat Tugas Baru</span>
            </button>
            <div className="relative flex items-center justify-center rounded-[10px]" style={{ width: 38, height: 38, background: "#F9FAFB", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <Bell size={17} color="#374151" />
              <span className="absolute rounded-full" style={{ width: 8, height: 8, background: "#EF4444", top: 6, right: 6 }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto" style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}>

          {/* STAT TABS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { key: "semua",    label: "Semua Tugas",    bg: "#DBEAFE", color: "#2563EB" },
              { key: "menunggu", label: "Menunggu",        bg: "#F3F4F6", color: "#6B7280" },
              { key: "proses",   label: "Dalam Proses",    bg: "#FFF7ED", color: "#F97316" },
              { key: "selesai",  label: "Selesai",         bg: "#DCFCE7", color: "#16A34A" },
            ] as { key: TabFilter; label: string; bg: string; color: string }[]).map(({ key, label, bg, color }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-3 rounded-xl text-left"
                style={{
                  background: tab === key ? bg : "#FFFFFF",
                  padding: "18px 20px",
                  border: tab === key ? `2px solid ${color}33` : "2px solid transparent",
                  boxShadow: "0 2px 8px #00000012",
                  cursor: "pointer",
                }}
              >
                <ClipboardList size={20} color={color} />
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
                    {counts[key]}
                  </span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>{label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Worker filter */}
            <div className="flex items-center flex-wrap gap-1 rounded-[10px]" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "4px 6px" }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280", padding: "0 6px" }}>Pekerja:</span>
              {["Semua", "Pak Sumarno", "Pak Budi", "Pak Ahmad"].map((w) => (
                <button
                  key={w}
                  onClick={() => setWorkerF(w)}
                  className="rounded-[7px]"
                  style={{ padding: "5px 10px", border: "none", cursor: "pointer", background: workerF === w ? "#1E3A5F" : "transparent", fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: workerF === w ? 600 : 400, color: workerF === w ? "#FFFFFF" : "#6B7280" }}
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-[10px] w-full sm:w-auto sm:ml-auto" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "8px 14px" }}>
              <Filter size={14} color="#6B7280" />
              <input
                type="text"
                placeholder="Cari tugas atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", flex: 1 }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl" style={{ boxShadow: "0 2px 8px #00000012" }}>
          <div className="flex flex-col rounded-xl overflow-hidden" style={{ minWidth: 820, background: "#FFFFFF" }}>
            {/* Header */}
            <div
              className="grid"
              style={{ gridTemplateColumns: "1fr 130px 120px 100px 100px 120px 150px", padding: "13px 20px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}
            >
              {["Judul Tugas", "Lokasi", "Pekerja", "Prioritas", "Status", "Batas Waktu", "Ubah Status"].map((h) => (
                <div key={h} className="flex items-center gap-1" style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {h} {h === "Batas Waktu" && <ChevronDown size={12} />}
                </div>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="flex items-center justify-center" style={{ padding: "40px 20px" }}>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>Tidak ada tugas yang sesuai filter.</span>
              </div>
            ) : (
              visible.map((t, idx) => {
                const ps = PRIORITY_STYLE[t.priority];
                const ss = STATUS_STYLE[t.status];
                return (
                  <div
                    key={t.id}
                    className="grid items-center"
                    style={{ gridTemplateColumns: "1fr 130px 120px 100px 100px 120px 150px", padding: "13px 20px", borderBottom: idx < visible.length - 1 ? "1px solid #F3F4F6" : "none", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
                  >
                    {/* Title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex-shrink-0 rounded" style={{ width: 4, height: 32, background: ps.border }} />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.title}
                        </span>
                        <div className="flex items-center gap-1">
                          <Wrench size={10} color="#6B7280" />
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.tools}</span>
                        </div>
                      </div>
                    </div>
                    {/* Location */}
                    <div className="flex items-center gap-1">
                      <MapPin size={11} color="#6B7280" />
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>{t.location}</span>
                    </div>
                    {/* Worker */}
                    <div className="flex items-center gap-1">
                      <User size={11} color="#6B7280" />
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151", fontWeight: 500 }}>{t.assignedTo}</span>
                    </div>
                    {/* Priority */}
                    <span className="rounded-[20px] inline-flex" style={{ background: ps.bg, padding: "4px 10px", fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 700, color: ps.color, width: "fit-content" }}>
                      {t.priority}
                    </span>
                    {/* Status */}
                    <span className="rounded-[20px] inline-flex" style={{ background: ss.bg, padding: "4px 10px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: ss.color, width: "fit-content" }}>
                      {ss.label}
                    </span>
                    {/* Due time */}
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>{t.dueTime}</span>
                    {/* Action */}
                    <div className="flex items-center gap-1.5">
                      {t.status !== "proses" && t.status !== "selesai" && (
                        <button
                          onClick={() => handleStatusChange(t.id, "proses")}
                          className="rounded-[7px]"
                          style={{ padding: "5px 9px", border: "1px solid #BFDBFE", background: "#EFF6FF", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#2563EB", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Mulai
                        </button>
                      )}
                      {t.status !== "selesai" && (
                        <button
                          onClick={() => handleStatusChange(t.id, "selesai")}
                          className="rounded-[7px]"
                          style={{ padding: "5px 9px", border: "1px solid #86EFAC", background: "#F0FDF4", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#16A34A", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Selesai
                        </button>
                      )}
                      {t.status === "selesai" && (
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>✓ Selesai</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
