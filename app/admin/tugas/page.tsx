"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  Plus,
  ClipboardList,
  Filter,
  ChevronDown,
  User,
  MapPin,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Radio,
  Trash2,
  Edit3,
  Inbox,
  Tag,
  CheckCheck,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { createClient } from "@/lib/supabase/client";

/* â”€â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface Profile {
  id: string;
  name: string;
  role: string;
  area: string | null;
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
type StatusKey = "pending" | "in_progress" | "done";
type TabFilter = "semua" | "pending" | "in_progress" | "done";

interface Laporan {
  id: string;
  reporter_name: string;
  lokasi: string;
  kategori: string;
  deskripsi: string;
  urgency: string;
  foto_url: string | null;
  status: string;
  created_at: string;
}

const LAPORAN_URGENCY: Record<string, { bg: string; color: string; label: string }> = {
  darurat: { bg: "#FEE2E2", color: "#EF4444", label: "DARURAT" },
  segera:  { bg: "#FFEDD5", color: "#F97316", label: "SEGERA" },
  normal:  { bg: "#F0FDF4", color: "#16A34A", label: "NORMAL" },
};

const LAPORAN_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  baru:     { bg: "#EFF6FF", color: "#3B82F6", label: "Baru" },
  diproses: { bg: "#FFF7ED", color: "#F97316", label: "Diproses" },
  selesai:  { bg: "#DCFCE7", color: "#16A34A", label: "Selesai" },
};

const KATEGORI_LABEL: Record<string, string> = {
  kebersihan_kelas:    "Kebersihan Kelas",
  kebersihan_toilet:   "Kebersihan Toilet",
  kebersihan_koridor:  "Kebersihan Koridor",
  kebersihan_kantin:   "Kebersihan Kantin",
  kebersihan_halaman:  "Kebersihan Halaman",
  kerusakan_fasilitas: "Kerusakan Fasilitas",
  sampah_menumpuk:     "Sampah Menumpuk",
  kebersihan:          "Kebersihan",
  kerusakan:           "Kerusakan",
  keamanan:            "Keamanan",
  lainnya:             "Lainnya",
};

const PRIORITY_STYLE: Record<PriorityKey, { bg: string; color: string; label: string }> = {
  darurat: { bg: "#FEE2E2", color: "#EF4444", label: "DARURAT" },
  segera:  { bg: "#FFEDD5", color: "#F97316", label: "SEGERA" },
  normal:  { bg: "#F0FDF4", color: "#16A34A", label: "NORMAL" },
};

const STATUS_STYLE: Record<StatusKey, { bg: string; color: string; label: string }> = {
  pending:     { bg: "#F3F4F6", color: "#6B7280", label: "Menunggu" },
  in_progress: { bg: "#DBEAFE", color: "#2563EB", label: "Dalam Proses" },
  done:        { bg: "#DCFCE7", color: "#16A34A", label: "Selesai" },
};

/* â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function todayString() {
  const d = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTenggat(tenggat: string | null) {
  if (!tenggat) return "-";
  const d = new Date(tenggat);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/* â”€â”€â”€ CREATE TASK MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function CreateTaskModal({ workers, onClose }: { workers: Profile[]; onClose: () => void }) {
  const [form, setForm] = useState({
    judul: "",
    prioritas: "normal" as PriorityKey,
    pekerja_id: workers[0]?.id ?? "",
    tenggat: "",
    catatan: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.judul.trim() || !form.pekerja_id) return;
    setSubmitting(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pekerja_id: form.pekerja_id,
          judul: form.judul,
          prioritas: form.prioritas,
          tenggat: form.tenggat || null,
          catatan: form.catatan || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat tugas");
      }
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal membuat tugas");
    } finally {
      setSubmitting(false);
    }
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

        {err && <div className="rounded-lg" style={{ padding: "10px 14px", background: "#FEE2E2", fontSize: 13, fontFamily: "var(--font-inter)", color: "#EF4444" }}>{err}</div>}

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Judul Tugas *</label>
          <input
            type="text"
            placeholder="Contoh: Lantai Berminyak -elas X-B"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
          />
        </div>

        {/* Catatan */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Catatan</label>
          <textarea
            placeholder="Catatan tambahan untuk pekerja..."
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            rows={2}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", resize: "vertical" }}
          />
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Prioritas</label>
            <select
              value={form.prioritas}
              onChange={(e) => setForm({ ...form, prioritas: e.target.value as PriorityKey })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", background: "#FFFFFF" }}
            >
              <option value="normal">NORMAL</option>
              <option value="segera">SEGERA</option>
              <option value="darurat">DARURAT</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Assign ke *</label>
            <select
              value={form.pekerja_id}
              onChange={(e) => setForm({ ...form, pekerja_id: e.target.value })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", background: "#FFFFFF" }}
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Tenggat</label>
            <input
              type="datetime-local"
              value={form.tenggat}
              onChange={(e) => setForm({ ...form, tenggat: e.target.value })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.judul.trim() || !form.pekerja_id}
            className="flex-1 rounded-[10px]"
            style={{ padding: "12px 0", border: "none", background: "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Menyimpan..." : "Buat Tugas"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ EDIT TASK MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function EditTaskModal({ task, workers, onClose, onSave }: { task: Task; workers: Profile[]; onClose: () => void; onSave: (id: string, updates: Partial<Task>) => Promise<void> }) {
  const [form, setForm] = useState({
    judul: task.judul,
    prioritas: task.prioritas as PriorityKey,
    pekerja_id: task.pekerja_id,
    tenggat: task.tenggat ? new Date(task.tenggat).toISOString().slice(0, 16) : "",
    catatan: task.catatan ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.judul.trim()) return;
    setSubmitting(true);
    setErr("");
    try {
      await onSave(task.id, {
        judul: form.judul,
        prioritas: form.prioritas,
        pekerja_id: form.pekerja_id,
        tenggat: form.tenggat || null,
        catatan: form.catatan || null,
      });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal mengupdate tugas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
      <div className="flex flex-col gap-4 rounded-2xl" style={{ background: "#FFFFFF", padding: 32, width: 520, boxShadow: "0 8px 40px #00000030", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>Edit Tugas</span>
          <button onClick={onClose} style={{ border: "none", background: "#F3F4F6", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {err && <div className="rounded-lg" style={{ padding: "10px 14px", background: "#FEE2E2", fontSize: 13, fontFamily: "var(--font-inter)", color: "#EF4444" }}>{err}</div>}

        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Judul Tugas *</label>
          <input
            type="text"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Catatan</label>
          <textarea
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            rows={2}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", resize: "vertical" }}
          />
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Prioritas</label>
            <select
              value={form.prioritas}
              onChange={(e) => setForm({ ...form, prioritas: e.target.value as PriorityKey })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", background: "#FFFFFF" }}
            >
              <option value="normal">NORMAL</option>
              <option value="segera">SEGERA</option>
              <option value="darurat">DARURAT</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Assign ke</label>
            <select
              value={form.pekerja_id}
              onChange={(e) => setForm({ ...form, pekerja_id: e.target.value })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", background: "#FFFFFF" }}
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Tenggat</label>
            <input
              type="datetime-local"
              value={form.tenggat}
              onChange={(e) => setForm({ ...form, tenggat: e.target.value })}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.judul.trim()}
            className="flex-1 rounded-[10px]"
            style={{ padding: "12px 0", border: "none", background: "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ DELETE CONFIRM MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function DeleteTaskModal({ task, onClose, onDelete }: { task: Task; onClose: () => void; onDelete: (id: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
      <div className="flex flex-col gap-4 rounded-2xl items-center" style={{ background: "#FFFFFF", padding: 32, width: 400, boxShadow: "0 8px 40px #00000030" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#FEE2E2" }}>
          <Trash2 size={24} color="#EF4444" />
        </div>
        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827", textAlign: "center" }}>Hapus Tugas?</span>
        <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280", textAlign: "center" }}>
          &ldquo;{task.judul}&rdquo; akan dihapus secara permanen.
        </span>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-[10px]"
            style={{ padding: "12px 0", border: "none", background: "#EF4444", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: deleting ? "wait" : "pointer", opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function AdminTugasPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const [tab, setTab] = useState<TabFilter>("semua");
  const [search, setSearch] = useState("");
  const [workerF, setWorkerF] = useState("Semua");
  const [liveCount, setLiveCount] = useState(0);

  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [laporanLoading, setLaporanLoading] = useState(true);
  const [updatingLaporanId, setUpdatingLaporanId] = useState<string | null>(null);
  const [laporanTab, setLaporanTab] = useState<"semua" | "baru" | "diproses" | "selesai">("semua");

  const supabaseRef = useRef(createClient());

  /* â”€â”€ Fetch â”€â”€ */
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
  const fetchLaporan = useCallback(async () => {
    try {
      setLaporanLoading(true);
      const res = await fetch("/api/laporan");
      if (!res.ok) return;
      const data = await res.json();
      setLaporan(data.laporan ?? []);
    } catch {
      // silent
    } finally {
      setLaporanLoading(false);
    }
  }, []);

  const handleLaporanStatus = async (id: string, newStatus: string) => {
    setUpdatingLaporanId(id);
    try {
      const res = await fetch("/api/laporan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) return;
      setLaporan((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
    } finally {
      setUpdatingLaporanId(null);
    }
  };
  /* â”€â”€ Realtime â”€â”€ */
  useEffect(() => {
    fetchData();
    fetchLaporan();

    const channel = supabaseRef.current
      .channel("admin-tugas")
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "laporan" }, (payload) => {
        setLaporan((prev) => [payload.new as Laporan, ...prev]);
        setLiveCount((c) => c + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "laporan" }, (payload) => {
        setLaporan((prev) =>
          prev.map((l) => (l.id === (payload.new as Laporan).id ? (payload.new as Laporan) : l))
        );
      })
      .subscribe();

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [fetchData, fetchLaporan]);

  /* â”€â”€ Workers â”€â”€ */
  const workers = profiles.filter((p) => p.role === "prakarya");
  const profileMap = new Map(workers.map((p) => [p.id, p]));

  /* â”€â”€ Mutations â”€â”€ */
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const res = await fetch("/api/tasks/update-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, status: newStatus }),
    });
    if (!res.ok) return;
    // Realtime will handle the update
  };

  const handleEditSave = async (taskId: string, updates: Partial<Task>) => {
    const supabase = supabaseRef.current;
    const { error: err } = await supabase.from("tasks").update(updates).eq("id", taskId);
    if (err) throw new Error(err.message);
    // Realtime will handle the update
  };

  const handleDelete = async (taskId: string) => {
    const supabase = supabaseRef.current;
    await supabase.from("tasks").delete().eq("id", taskId);
    // Realtime will handle the removal
  };

  /* â”€â”€ Derived data â”€â”€ */
  const sorted = [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const visible = sorted.filter((t) => {
    const tMatch = tab === "semua" || t.status === tab;
    const sMatch = !search || t.judul.toLowerCase().includes(search.toLowerCase()) || (t.catatan ?? "").toLowerCase().includes(search.toLowerCase());
    const wName = profileMap.get(t.pekerja_id)?.name ?? "";
    const wMatch = workerF === "Semua" || wName === workerF;
    return tMatch && sMatch && wMatch;
  });

  const counts = {
    semua:       tasks.length,
    pending:     tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done:        tasks.filter((t) => t.status === "done").length,
  };

  /* â”€â”€ Loading / Error â”€â”€ */
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
        <AdminSidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin" color="#1E3A5F" />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>Memuat tugas...</span>
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
      {showCreate && <CreateTaskModal workers={workers} onClose={() => setShowCreate(false)} />}
      {editTask && <EditTaskModal task={editTask} workers={workers} onClose={() => setEditTask(null)} onSave={handleEditSave} />}
      {deleteTask && <DeleteTaskModal task={deleteTask} onClose={() => setDeleteTask(null)} onDelete={handleDelete} />}

      <main className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <div className="flex items-center justify-between pl-14 pr-4 sm:pl-8 sm:pr-8" style={{ background: "#FFFFFF", height: 70, flexShrink: 0, boxShadow: "0 1px 6px #00000010" }}>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#111827" }}>Manajemen Tugas</span>
              <span className="flex items-center gap-1 rounded-full" style={{ padding: "3px 10px", background: "#F0FDF4", fontSize: 11, fontFamily: "var(--font-inter)", fontWeight: 600, color: "#16A34A" }}>
                <Radio size={10} /> Live
              </span>
            </div>
            <span className="hidden sm:block" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>{todayString()} · Buat, assign, dan pantau seluruh tugas kebersihan</span>
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
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-[10px]"
              style={{ padding: "9px 16px", background: "#1E3A5F", border: "none", cursor: "pointer" }}
            >
              <Plus size={16} color="#FFFFFF" />
              <span className="hidden sm:inline" style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Buat Tugas Baru</span>
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

        <div className="flex flex-col gap-5 overflow-y-auto" style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}>

          {/* STAT TABS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { key: "semua" as TabFilter,       label: "Semua Tugas",   bg: "#DBEAFE", color: "#2563EB" },
              { key: "pending" as TabFilter,     label: "Menunggu",      bg: "#F3F4F6", color: "#6B7280" },
              { key: "in_progress" as TabFilter, label: "Dalam Proses",  bg: "#FFF7ED", color: "#F97316" },
              { key: "done" as TabFilter,        label: "Selesai",       bg: "#DCFCE7", color: "#16A34A" },
            ]).map(({ key, label, bg, color }) => (
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
              {["Semua", ...workers.map((w) => w.name)].map((w) => (
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
                placeholder="Cari tugas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", flex: 1 }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl" style={{ boxShadow: "0 2px 8px #00000012" }}>
            <div className="flex flex-col rounded-xl overflow-hidden" style={{ minWidth: 960, background: "#FFFFFF" }}>
              {/* Header */}
              <div
                className="grid"
                style={{ gridTemplateColumns: "2fr 130px 100px 100px 110px 150px", padding: "13px 20px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}
              >
                {["Judul Tugas", "Pekerja", "Prioritas", "Status", "Tenggat", "Aksi"].map((h) => (
                  <div key={h} className="flex items-center gap-1" style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {h} {h === "Tenggat" && <ChevronDown size={12} />}
                  </div>
                ))}
              </div>

              {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2" style={{ padding: "60px 20px" }}>
                  <ClipboardList size={36} color="#D1D5DB" />
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                    {tasks.length === 0 ? "Belum ada tugas. Buat tugas baru!" : "Tidak ada tugas yang sesuai filter."}
                  </span>
                </div>
              ) : (
                visible.map((t, idx) => {
                  const ps = PRIORITY_STYLE[(t.prioritas as PriorityKey)] ?? PRIORITY_STYLE.normal;
                  const ss = STATUS_STYLE[(t.status as StatusKey)] ?? STATUS_STYLE.pending;
                  const worker = profileMap.get(t.pekerja_id);
                  return (
                    <div
                      key={t.id}
                      className="grid items-center"
                      style={{ gridTemplateColumns: "2fr 130px 100px 100px 110px 150px", padding: "13px 20px", borderBottom: idx < visible.length - 1 ? "1px solid #F3F4F6" : "none", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
                    >
                      {/* Title */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex-shrink-0 rounded" style={{ width: 4, height: 32, background: ps.color }} />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.judul}
                          </span>
                          <div className="flex items-center gap-1">
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>{formatDate(t.created_at)}</span>
                            {t.catatan && (
                              <>
                                <span style={{ color: "#D1D5DB" }}>·</span>
                                <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.catatan}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Worker */}
                      <div className="flex items-center gap-1">
                        <User size={11} color="#6B7280" />
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151", fontWeight: 500 }}>{worker?.name ?? "-"}</span>
                      </div>
                      {/* Priority */}
                      <span className="rounded-[20px] inline-flex" style={{ background: ps.bg, padding: "4px 10px", fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 700, color: ps.color, width: "fit-content" }}>
                        {ps.label}
                      </span>
                      {/* Status */}
                      <span className="rounded-[20px] inline-flex" style={{ background: ss.bg, padding: "4px 10px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: ss.color, width: "fit-content" }}>
                        {ss.label}
                      </span>
                      {/* Tenggat */}
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>{formatTenggat(t.tenggat)}</span>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        {t.status === "pending" && (
                          <button
                            onClick={() => handleStatusChange(t.id, "in_progress")}
                            className="rounded-[7px]"
                            style={{ padding: "5px 9px", border: "1px solid #BFDBFE", background: "#EFF6FF", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#2563EB", cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            Mulai
                          </button>
                        )}
                        {t.status !== "done" && (
                          <button
                            onClick={() => handleStatusChange(t.id, "done")}
                            className="rounded-[7px]"
                            style={{ padding: "5px 9px", border: "1px solid #86EFAC", background: "#F0FDF4", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#16A34A", cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            Selesai
                          </button>
                        )}
                        <button
                          onClick={() => setEditTask(t)}
                          className="rounded-[7px]"
                          style={{ padding: "5px 7px", border: "1px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer" }}
                          title="Edit"
                        >
                          <Edit3 size={12} color="#6B7280" />
                        </button>
                        <button
                          onClick={() => setDeleteTask(t)}
                          className="rounded-[7px]"
                          style={{ padding: "5px 7px", border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer" }}
                          title="Hapus"
                        >
                          <Trash2 size={12} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* -- LAPORAN MASUK SECTION -- */}
          <div className="flex flex-col gap-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox size={18} color="#3B82F6" />
                <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 16, fontWeight: 700, color: "#111827" }}>
                  Laporan Masuk
                </span>
                <span className="rounded-full" style={{ background: "#EFF6FF", padding: "3px 10px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#3B82F6" }}>
                  {laporan.length} laporan
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-[10px]" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "4px 6px" }}>
                {(["semua", "baru", "diproses", "selesai"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setLaporanTab(k)}
                    className="rounded-[7px]"
                    style={{ padding: "5px 10px", border: "none", cursor: "pointer", background: laporanTab === k ? "#1E3A5F" : "transparent", fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: laporanTab === k ? 600 : 400, color: laporanTab === k ? "#FFFFFF" : "#6B7280" }}
                  >
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {laporanLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl py-10" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <Loader2 size={18} color="#3B82F6" className="animate-spin" />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>Memuat laporan...</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ boxShadow: "0 2px 8px #00000012" }}>
                <div className="flex flex-col rounded-xl overflow-hidden" style={{ minWidth: 760, background: "#FFFFFF" }}>
                  {/* Header */}
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: "1fr 130px 100px 110px 100px 160px", padding: "13px 20px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}
                  >
                    {["Pelapor / Deskripsi", "Lokasi", "Kategori", "Urgensi", "Status", "Aksi"].map((h) => (
                      <span key={h} style={{ fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {(() => {
                    const filtered = laporan.filter((l) => laporanTab === "semua" || l.status === laporanTab);
                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center gap-2" style={{ padding: "50px 20px" }}>
                          <Inbox size={36} color="#D1D5DB" />
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                            Tidak ada laporan{laporanTab !== "semua" ? ` dengan status "${laporanTab}"` : ""}
                          </span>
                        </div>
                      );
                    }
                    return filtered.map((l, idx) => {
                      const us = LAPORAN_URGENCY[l.urgency] ?? LAPORAN_URGENCY.normal;
                      const st = LAPORAN_STATUS[l.status] ?? LAPORAN_STATUS.baru;
                      const isUpdating = updatingLaporanId === l.id;
                      return (
                        <div
                          key={l.id}
                          className="grid items-center"
                          style={{ gridTemplateColumns: "1fr 130px 100px 110px 100px 160px", padding: "13px 20px", borderBottom: idx < filtered.length - 1 ? "1px solid #F3F4F6" : "none", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
                        >
                          {/* Reporter + description */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex-shrink-0 rounded" style={{ width: 4, height: 32, background: us.color }} />
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {l.reporter_name}
                              </span>
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {l.deskripsi}
                              </span>
                            </div>
                          </div>
                          {/* Lokasi */}
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin size={11} color="#9CA3AF" className="flex-shrink-0" />
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.lokasi}</span>
                          </div>
                          {/* Kategori */}
                          <div className="flex items-center gap-1">
                            <Tag size={11} color="#9CA3AF" />
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#374151" }}>{KATEGORI_LABEL[l.kategori] ?? l.kategori}</span>
                          </div>
                          {/* Urgency */}
                          <span className="rounded-[20px] inline-flex" style={{ background: us.bg, padding: "4px 10px", fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 700, color: us.color, width: "fit-content" }}>
                            {us.label}
                          </span>
                          {/* Status */}
                          <span className="rounded-[20px] inline-flex" style={{ background: st.bg, padding: "4px 10px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: st.color, width: "fit-content" }}>
                            {st.label}
                          </span>
                          {/* Actions */}
                          <div className="flex items-center gap-1.5">
                            {l.status === "baru" && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleLaporanStatus(l.id, "diproses")}
                                className="rounded-[7px]"
                                style={{ padding: "5px 9px", border: "1px solid #FED7AA", background: "#FFF7ED", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#F97316", cursor: isUpdating ? "wait" : "pointer", whiteSpace: "nowrap", opacity: isUpdating ? 0.6 : 1 }}
                              >
                                Proses
                              </button>
                            )}
                            {l.status !== "selesai" && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleLaporanStatus(l.id, "selesai")}
                                className="rounded-[7px] flex items-center gap-1"
                                style={{ padding: "5px 9px", border: "1px solid #86EFAC", background: "#F0FDF4", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: "#16A34A", cursor: isUpdating ? "wait" : "pointer", whiteSpace: "nowrap", opacity: isUpdating ? 0.6 : 1 }}
                              >
                                {isUpdating ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                                Selesai
                              </button>
                            )}
                            {l.foto_url && (
                              <a
                                href={l.foto_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-[7px] flex items-center justify-center"
                                style={{ padding: "5px 7px", border: "1px solid #E5E7EB", background: "#F9FAFB" }}
                                title="Lihat foto"
                              >
                                <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>📷</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
