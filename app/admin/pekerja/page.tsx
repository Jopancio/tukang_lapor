"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Users,
  Plus,
  CheckCircle2,
  Clock,
  TrendingUp,
  ClipboardList,
  Phone,
  Mail,
  MoreVertical,
  Shield,
  Loader2,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { createClient } from "@/lib/supabase/client";

/* ─── TYPES ──────────────────────────────────────────────────── */

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  area: string | null;
  phone: string | null;
  status: string | null;
  created_at: string;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─── WORKER DETAIL MODAL ───────────────────────────────────── */

function WorkerDetailModal({
  worker,
  onClose,
  onEdit,
  onAssign,
}: {
  worker: Profile;
  onClose: () => void;
  onEdit: () => void;
  onAssign: () => void;
}) {
  const initials = getInitials(worker.name, worker.email);
  const displayName = worker.name || worker.email;
  const role = worker.role || "Bapa Prakarya";
  const area = worker.area || "—";
  const isAktif = (worker.status ?? "aktif") === "aktif";
  const rows = [
    { label: "Email",       value: worker.email,                Icon: Mail },
    { label: "Telepon",     value: worker.phone || "—",         Icon: Phone },
    { label: "Area Tugas",  value: area,                        Icon: MapPin },
    { label: "Bergabung",   value: formatDate(worker.created_at), Icon: Calendar },
  ];
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
      <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", width: 440, boxShadow: "0 8px 40px #00000030" }} onClick={(e) => e.stopPropagation()}>
        {/* Banner */}
        <div className="relative flex flex-col items-center gap-2" style={{ background: "#1E3A5F", padding: "36px 24px 28px" }}>
          <button onClick={onClose} className="absolute flex items-center justify-center rounded-xl" style={{ top: 12, right: 12, width: 30, height: 30, background: "#FFFFFF22", border: "none", cursor: "pointer" }}>
            <X size={14} color="#FFFFFF" />
          </button>
          <div className="flex items-center justify-center rounded-full" style={{ width: 60, height: 60, background: "#2563EB" }}>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>{initials}</span>
          </div>
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 17, fontWeight: 700, color: "#FFFFFF" }}>{displayName}</span>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#93C5FD" }}>{role}</span>
          <span className="rounded-[20px]" style={{ background: isAktif ? "#16A34A33" : "#FFFFFF22", padding: "3px 14px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600, color: isAktif ? "#4ADE80" : "#CBD5E1", marginTop: 4 }}>
            {isAktif ? "Aktif" : "Libur"}
          </span>
        </div>
        {/* Info rows */}
        <div className="flex flex-col" style={{ padding: "8px 0" }}>
          {rows.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-center gap-3" style={{ padding: "12px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <div className="flex items-center justify-center rounded-[8px] flex-shrink-0" style={{ width: 32, height: 32, background: "#EFF6FF" }}>
                <Icon size={14} color="#2563EB" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.04em" }}>{label.toUpperCase()}</span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827" }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Actions */}
        <div className="flex gap-3" style={{ padding: "16px 24px" }}>
          <button onClick={onAssign} className="flex-1 flex items-center justify-center gap-2 rounded-[10px]" style={{ padding: "11px 0", border: "1.5px solid #1E3A5F", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#1E3A5F", cursor: "pointer" }}>
            <ClipboardList size={14} color="#1E3A5F" /> Assign Tugas
          </button>
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 rounded-[10px]" style={{ padding: "11px 0", border: "none", background: "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}>
            <Edit2 size={14} color="#FFFFFF" /> Edit Profil
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ASSIGN TUGAS MODAL ─────────────────────────────────────── */

const PRIORITAS_OPTIONS = [
  { id: "tinggi", label: "Tinggi", bg: "#FEE2E2", color: "#EF4444" },
  { id: "normal", label: "Normal", bg: "#DBEAFE", color: "#2563EB" },
  { id: "rendah", label: "Rendah", bg: "#F3F4F6", color: "#6B7280" },
] as const;

function AssignTugasModal({ worker, onClose }: { worker: Profile; onClose: () => void }) {
  const [form, setForm] = useState({ judul: "", prioritas: "normal", tenggat: "", catatan: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const displayName = worker.name || worker.email;

  async function handleSubmit() {
    if (!form.judul.trim()) { setError("Judul tugas wajib diisi"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pekerja_id: worker.id, judul: form.judul, prioritas: form.prioritas, tenggat: form.tenggat || null, catatan: form.catatan || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan tugas"); setLoading(false); return; }
      setSuccess(true); setLoading(false);
    } catch { setError("Terjadi kesalahan jaringan"); setLoading(false); }
  }

  if (success) return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
      <div className="flex flex-col items-center gap-4 rounded-2xl" style={{ background: "#FFFFFF", padding: 40, width: 400, boxShadow: "0 8px 40px #00000030" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#DCFCE7" }}><CheckCircle2 size={28} color="#16A34A" /></div>
        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>Tugas Ditetapkan!</span>
        <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280", textAlign: "center" }}>Tugas <strong>{form.judul}</strong> telah ditetapkan untuk <strong>{displayName}</strong>.</span>
        <button onClick={onClose} className="rounded-[10px] w-full" style={{ padding: "12px 0", border: "none", background: "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer", marginTop: 4 }}>Tutup</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
      <div className="flex flex-col gap-4 rounded-2xl" style={{ background: "#FFFFFF", padding: 32, width: 480, boxShadow: "0 8px 40px #00000030", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>Assign Tugas</span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>Untuk: {displayName}</span>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9CA3AF", fontSize: 20 }}>×</button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Judul Tugas</label>
          <input type="text" placeholder="Contoh: Bersihkan Toilet Lantai 2" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Prioritas</label>
          <div className="flex gap-2">
            {PRIORITAS_OPTIONS.map(({ id, label, bg, color }) => (
              <button key={id} onClick={() => setForm({ ...form, prioritas: id })} className="flex-1 rounded-[8px]" style={{ padding: "9px 0", border: form.prioritas === id ? `1.5px solid ${color}` : "1.5px solid #E5E7EB", background: form.prioritas === id ? bg : "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: form.prioritas === id ? 700 : 400, color: form.prioritas === id ? color : "#6B7280", cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Tenggat (opsional)</label>
          <input type="date" value={form.tenggat} onChange={(e) => setForm({ ...form, tenggat: e.target.value })} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Catatan (opsional)</label>
          <textarea placeholder="Instruksi tambahan..." value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} rows={3} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", resize: "none" }} />
        </div>
        {error && <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#EF4444" }}>{error}</span>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 rounded-[10px]" style={{ padding: "12px 0", border: "none", background: loading ? "#93C5FD" : "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading && <Loader2 size={14} color="#FFFFFF" className="animate-spin" />}
            {loading ? "Menyimpan..." : "Tetapkan Tugas"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── EDIT WORKER MODAL ──────────────────────────────────────── */

function EditWorkerModal({ worker, onClose, onSaved }: { worker: Profile; onClose: () => void; onSaved: (updated: Profile) => void }) {
  const [form, setForm] = useState({ name: worker.name || "", role: worker.role || "Bapa Prakarya", area: worker.area || "", phone: worker.phone || "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setLoading(true); setError("");
    const res = await fetch("/api/admin/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: worker.id, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Gagal menyimpan"); return; }
    onSaved({ ...worker, ...form });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
      <div className="flex flex-col gap-5 rounded-2xl" style={{ background: "#FFFFFF", padding: 32, width: 480, boxShadow: "0 8px 40px #00000030" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>Edit Profil Pekerja</span>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9CA3AF", fontSize: 20 }}>×</button>
        </div>
        {([
          { label: "Nama Lengkap", key: "name",  placeholder: "Nama pekerja" },
          { label: "Area Tugas",   key: "area",  placeholder: "Contoh: Gedung A — Lt.1" },
          { label: "No. Telepon",  key: "phone", placeholder: "0812-xxxx-xxxx" },
        ] as const).map(({ label, key, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
            <input type="text" placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none" }} />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Jabatan</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", background: "#FFFFFF" }}>
            <option>Bapa Prakarya</option>
            <option>Bapa Prakarya Senior</option>
            <option>Koordinator Kebersihan</option>
          </select>
        </div>
        {error && <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#EF4444" }}>{error}</span>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Batal</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "none", background: loading ? "#93C5FD" : "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DELETE CONFIRM MODAL ───────────────────────────────────── */

function DeleteConfirmModal({ worker, onClose, onDeleted }: { worker: Profile; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const displayName = worker.name || worker.email;

  async function handleDelete() {
    setLoading(true); setError("");
    const res = await fetch("/api/admin/delete-profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: worker.id }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Gagal menghapus"); return; }
    onDeleted(worker.id);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
      <div className="flex flex-col items-center gap-4 rounded-2xl" style={{ background: "#FFFFFF", padding: 36, width: 400, boxShadow: "0 8px 40px #00000030" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#FEE2E2" }}><AlertTriangle size={26} color="#EF4444" /></div>
        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 17, fontWeight: 700, color: "#111827" }}>Hapus Pekerja?</span>
        <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 1.6 }}>Akun <strong>{displayName}</strong> akan dihapus permanen beserta semua datanya. Tindakan ini tidak dapat dibatalkan.</span>
        {error && <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#EF4444" }}>{error}</span>}
        <div className="flex gap-3 w-full" style={{ marginTop: 4 }}>
          <button onClick={onClose} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Batal</button>
          <button onClick={handleDelete} disabled={loading} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "none", background: loading ? "#FCA5A5" : "#EF4444", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ADD WORKER MODAL ────────────────────────────────────────── */

function AddWorkerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", role: "Bapa Prakarya", area: "", phone: "", email: "", password: "" });
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
          area: form.area,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat akun");
        setStep("form");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      onSuccess();
    } catch {
      setError("Terjadi kesalahan jaringan");
      setStep("form");
      setLoading(false);
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={onClose}>
        <div className="flex flex-col items-center gap-4 rounded-2xl" style={{ background: "#FFFFFF", padding: 40, width: 420, boxShadow: "0 8px 40px #00000030" }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#DCFCE7" }}>
            <CheckCircle2 size={28} color="#16A34A" />
          </div>
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>Berhasil!</span>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280", textAlign: "center" }}>
            Akun untuk <strong>{form.email}</strong> berhasil dibuat. Pekerja sekarang bisa login.
          </span>
          <button onClick={onClose} className="rounded-[10px] w-full" style={{ padding: "12px 0", border: "none", background: "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer", marginTop: 4 }}>
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Confirmation popup
  if (step === "confirm") {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#00000055" }} onClick={() => setStep("form")}>
        <div className="flex flex-col gap-5 rounded-2xl" style={{ background: "#FFFFFF", padding: 32, width: 440, boxShadow: "0 8px 40px #00000030" }} onClick={(e) => e.stopPropagation()}>
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>Konfirmasi Buat Akun</span>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>Pastikan data login berikut sudah benar:</span>

          <div className="flex flex-col gap-3 rounded-xl" style={{ background: "#F0F4F0", padding: "16px 20px" }}>
            <div className="flex items-center gap-3">
              <Mail size={16} color="#1E3A5F" />
              <div className="flex flex-col">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280", fontWeight: 600 }}>EMAIL</span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#111827" }}>{form.email}</span>
              </div>
            </div>
            <div style={{ height: 1, background: "#E5E7EB" }} />
            <div className="flex items-center gap-3">
              <Shield size={16} color="#1E3A5F" />
              <div className="flex flex-col">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280", fontWeight: 600 }}>PASSWORD</span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#111827" }}>{form.password}</span>
              </div>
            </div>
          </div>

          {error && (
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#EF4444" }}>{error}</span>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep("form")} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              Kembali
            </button>
            <button onClick={handleCreate} disabled={loading} className="flex-1 rounded-[10px]" style={{ padding: "12px 0", border: "none", background: loading ? "#93C5FD" : "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Membuat..." : "Ya, Buat Akun"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "#00000055" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col gap-5 rounded-2xl"
        style={{ background: "#FFFFFF", padding: 32, width: 480, boxShadow: "0 8px 40px #00000030" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>
            Tambah Pekerja Baru
          </span>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 20, color: "#9CA3AF" }}>×</button>
        </div>

        {[
          { label: "Nama Lengkap",  key: "name",     type: "text",     placeholder: "Contoh: Pak Joko" },
          { label: "Area Tugas",    key: "area",     type: "text",     placeholder: "Contoh: Gedung A — Lt.1" },
          { label: "No. Telepon",   key: "phone",    type: "tel",      placeholder: "0812-xxxx-xxxx" },
          { label: "Email (Login)", key: "email",    type: "email",    placeholder: "email@tukanglap.id" },
          { label: "Password",      key: "password", type: "password", placeholder: "Minimal 6 karakter" },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              style={{
                border: "1.5px solid #E5E7EB",
                borderRadius: 10,
                padding: "10px 14px",
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "#111827",
                outline: "none",
              }}
            />
          </div>
        ))}

        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#374151" }}>Jabatan</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", fontSize: 13, color: "#111827", outline: "none", background: "#FFFFFF" }}
          >
            <option>Bapa Prakarya</option>
            <option>Bapa Prakarya Senior</option>
            <option>Koordinator Kebersihan</option>
          </select>
        </div>

        {error && (
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#EF4444" }}>{error}</span>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[10px]"
            style={{ padding: "12px 0", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}
          >
            Batal
          </button>
          <button
            onClick={() => {
              if (!form.email || !form.password) {
                setError("Email dan password wajib diisi");
                return;
              }
              if (form.password.length < 6) {
                setError("Password minimal 6 karakter");
                return;
              }
              setError("");
              setStep("confirm");
            }}
            className="flex-1 rounded-[10px]"
            style={{ padding: "12px 0", border: "none", background: "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
          >
            Buat Akun Pekerja
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE ──────────────────────────────────────────────────── */

export default function AdminPekerjaPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"aktif" | "semua">("aktif");
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [detailWorker, setDetailWorker] = useState<Profile | null>(null);
  const [assignWorker, setAssignWorker] = useState<Profile | null>(null);
  const [editWorker, setEditWorker] = useState<Profile | null>(null);
  const [deleteWorker, setDeleteWorker] = useState<Profile | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    const res = await fetch("/api/admin/list-users");
    const data = await res.json();
    if (res.ok) {
      setWorkers(data.profiles ?? []);
      setFetchError("");
    } else {
      setFetchError(data.error ?? "Gagal memuat data");
    }
    setLoading(false);
  }, []);

  async function handleToggleStatus(worker: Profile) {
    const newStatus = (worker.status ?? "aktif") === "aktif" ? "libur" : "aktif";
    const res = await fetch("/api/admin/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: worker.id, status: newStatus }),
    });
    if (res.ok) {
      setWorkers((prev) => prev.map((w) => w.id === worker.id ? { ...w, status: newStatus } : w));
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  // Initial load + Realtime subscription
  useEffect(() => {
    fetchWorkers();

    const supabase = createClient();
    const channel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          setWorkers((prev) => [payload.new as Profile, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          setWorkers((prev) =>
            prev.map((w) =>
              w.id === (payload.new as Profile).id ? (payload.new as Profile) : w
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "profiles" },
        (payload) => {
          setWorkers((prev) =>
            prev.filter((w) => w.id !== (payload.old as { id: string }).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWorkers]);

  const visible =
    selectedTab === "semua"
      ? workers
      : workers.filter((w) => (w.status ?? "aktif") === "aktif");

  const onlineCount = workers.filter((w) => (w.status ?? "aktif") === "aktif").length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F4F0" }}>
      <AdminSidebar />
      {showModal && (
        <AddWorkerModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchWorkers();
          }}
        />
      )}
      {detailWorker && (
        <WorkerDetailModal
          worker={detailWorker}
          onClose={() => setDetailWorker(null)}
          onEdit={() => { setEditWorker(detailWorker); setDetailWorker(null); }}
          onAssign={() => { setAssignWorker(detailWorker); setDetailWorker(null); }}
        />
      )}
      {assignWorker && (
        <AssignTugasModal worker={assignWorker} onClose={() => setAssignWorker(null)} />
      )}
      {editWorker && (
        <EditWorkerModal
          worker={editWorker}
          onClose={() => setEditWorker(null)}
          onSaved={(updated) => { setWorkers((prev) => prev.map((w) => w.id === updated.id ? updated : w)); setEditWorker(null); }}
        />
      )}
      {deleteWorker && (
        <DeleteConfirmModal
          worker={deleteWorker}
          onClose={() => setDeleteWorker(null)}
          onDeleted={(id) => { setWorkers((prev) => prev.filter((w) => w.id !== id)); setDeleteWorker(null); }}
        />
      )}

      <main className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <div className="flex items-center justify-between pl-14 pr-4 sm:pl-8 sm:pr-8" style={{ background: "#FFFFFF", height: 70, flexShrink: 0, boxShadow: "0 1px 6px #00000010" }}>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 20, fontWeight: 700, color: "#111827" }}>Manajemen Pekerja</span>
            <span className="hidden sm:block" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>Rabu, 8 April 2026 • Kelola & pantau performa seluruh pekerja kebersihan</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-[10px]"
              style={{ padding: "9px 16px", background: "#1E3A5F", border: "none", cursor: "pointer" }}
            >
              <Plus size={16} color="#FFFFFF" />
              <span className="hidden sm:inline" style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Tambah Pekerja</span>
            </button>
            <div className="relative flex items-center justify-center rounded-[10px]" style={{ width: 38, height: 38, background: "#F9FAFB", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <Bell size={17} color="#374151" />
              <span className="absolute rounded-full" style={{ width: 8, height: 8, background: "#EF4444", top: 6, right: 6 }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto" style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flex: 1 }}>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { Icon: Users,        iconBg: "#DBEAFE", iconColor: "#2563EB", label: "Total Pekerja",     value: loading ? "…" : String(workers.length) },
              { Icon: CheckCircle2, iconBg: "#DCFCE7", iconColor: "#16A34A", label: "Pekerja Aktif",     value: loading ? "…" : String(onlineCount) },
              { Icon: TrendingUp,   iconBg: "#FEF3C7", iconColor: "#D97706", label: "Avg Efisiensi",     value: "—" },
              { Icon: ClipboardList, iconBg: "#F3E8FF", iconColor: "#7C3AED", label: "Tugas Bulan Ini",  value: "—" },
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

          {/* TABS */}
          <div className="flex items-center gap-2">
            {(["aktif", "semua"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTab(t)}
                className="rounded-[8px]"
                style={{
                  padding: "7px 16px",
                  border: selectedTab === t ? "1.5px solid #1E3A5F" : "1.5px solid #E5E7EB",
                  background: selectedTab === t ? "#1E3A5F" : "#FFFFFF",
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  fontWeight: selectedTab === t ? 700 : 400,
                  color: selectedTab === t ? "#FFFFFF" : "#6B7280",
                  cursor: "pointer",
                }}
              >
                {t === "aktif" ? "Pekerja Aktif" : "Semua Pekerja"}
              </button>
            ))}
          </div>

          {/* WORKER CARDS */}
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3" style={{ paddingTop: 60 }}>
              <Loader2 size={32} color="#1E3A5F" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>Memuat data pekerja…</span>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-3" style={{ paddingTop: 60 }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#EF4444" }}>{fetchError}</span>
              <button onClick={fetchWorkers} className="rounded-[8px]" style={{ padding: "8px 16px", background: "#1E3A5F", border: "none", color: "#fff", fontFamily: "var(--font-inter)", fontSize: 13, cursor: "pointer" }}>Coba Lagi</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2" style={{ paddingTop: 60 }}>
              <Users size={36} color="#D1D5DB" />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>Belum ada pekerja. Tambahkan pekerja baru!</span>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((w) => {
              const initials = getInitials(w.name, w.email);
              const displayName = w.name || w.email;
              const role = w.role || "Bapa Prakarya";
              const area = w.area || "—";
              const isAktif = (w.status ?? "aktif") === "aktif";
              return (
              <div
                key={w.id}
                className="flex flex-col gap-4 rounded-2xl"
                style={{ background: "#FFFFFF", padding: "22px 22px", boxShadow: "0 2px 10px #00000012" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 48, height: 48, background: "#1E3A5F" }}>
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 17, fontWeight: 700, color: "#FFFFFF" }}>{initials}</span>
                      <span className="absolute rounded-full" style={{ width: 12, height: 12, background: isAktif ? "#22C55E" : "#9CA3AF", border: "2px solid white", bottom: 0, right: 0 }} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#111827" }}>{displayName}</span>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>{role}</span>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <span
                      className="rounded-[20px]"
                      style={{
                        background: isAktif ? "#DCFCE7" : "#F3F4F6",
                        padding: "3px 10px",
                        fontFamily: "var(--font-inter)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: isAktif ? "#16A34A" : "#6B7280",
                      }}
                    >
                      {isAktif ? "Aktif" : "Libur"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === w.id ? null : w.id); }}
                      style={{ border: "none", background: "transparent", cursor: "pointer" }}
                    >
                      <MoreVertical size={16} color={menuOpenId === w.id ? "#1E3A5F" : "#9CA3AF"} />
                    </button>
                    {menuOpenId === w.id && (
                      <div
                        className="absolute flex flex-col rounded-xl overflow-hidden"
                        style={{ right: 0, top: "calc(100% + 4px)", background: "#FFFFFF", boxShadow: "0 4px 24px #00000025", width: 190, zIndex: 20 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => { setDetailWorker(w); setMenuOpenId(null); }} className="flex items-center gap-2.5 w-full" style={{ padding: "11px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                          <TrendingUp size={14} color="#374151" />
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#374151" }}>Lihat Detail</span>
                        </button>
                        <button onClick={() => { setEditWorker(w); setMenuOpenId(null); }} className="flex items-center gap-2.5 w-full" style={{ padding: "11px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                          <Edit2 size={14} color="#374151" />
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#374151" }}>Edit Profil</span>
                        </button>
                        <button onClick={() => { handleToggleStatus(w); setMenuOpenId(null); }} className="flex items-center gap-2.5 w-full" style={{ padding: "11px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                          <CheckCircle2 size={14} color="#374151" />
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#374151" }}>Tandai {isAktif ? "Libur" : "Aktif"}</span>
                        </button>
                        <div style={{ height: 1, background: "#F3F4F6" }} />
                        <button onClick={() => { setDeleteWorker(w); setMenuOpenId(null); }} className="flex items-center gap-2.5 w-full" style={{ padding: "11px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                          <Trash2 size={14} color="#EF4444" />
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#EF4444" }}>Hapus Pekerja</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Area */}
                <div className="flex flex-col gap-1.5 rounded-[10px]" style={{ background: "#F0F4F0", padding: "10px 12px" }}>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#6B7280", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>Zona Tanggung Jawab</span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "#374151" }}>{area}</span>
                </div>

                {/* Contact & Meta */}
                <div className="flex flex-col gap-1.5">
                  {w.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} color="#6B7280" />
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>{w.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail size={12} color="#6B7280" />
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>{w.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} color="#6B7280" />
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>Bergabung: {formatDate(w.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignWorker(w)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px]"
                    style={{ padding: "9px 0", border: "1.5px solid #1E3A5F", background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "#1E3A5F", cursor: "pointer" }}
                  >
                    <ClipboardList size={14} color="#1E3A5F" />
                    Assign Tugas
                  </button>
                  <button
                    onClick={() => setDetailWorker(w)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px]"
                    style={{ padding: "9px 0", border: "none", background: "#1E3A5F", fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                  >
                    <TrendingUp size={14} color="#FFFFFF" />
                    Lihat Detail
                  </button>
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
