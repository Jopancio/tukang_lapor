"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  User,
  FileText,
  Tag,
  Camera,
  X,
  ImageIcon,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* --- DETECTION TYPE ------------------------------------------ */

interface Detection {
  label: string;
  confidence: number;
  box: { x: number; y: number; w: number; h: number };
}

/* --- CONSTANTS ----------------------------------------------- */

const KATEGORI_OPTIONS = [
  { value: "kebersihan_kelas", label: "Kebersihan Kelas" },
  { value: "kebersihan_toilet", label: "Kebersihan Toilet" },
  { value: "kebersihan_koridor", label: "Kebersihan Koridor" },
  { value: "kebersihan_kantin", label: "Kebersihan Kantin" },
  { value: "kebersihan_halaman", label: "Kebersihan Halaman / Lapangan" },
  { value: "kerusakan_fasilitas", label: "Kerusakan Fasilitas" },
  { value: "sampah_menumpuk", label: "Sampah Menumpuk" },
  { value: "lainnya", label: "Lainnya" },
];

const URGENCY_OPTIONS = [
  { value: "normal", label: "Normal", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  { value: "segera", label: "Segera", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
  { value: "darurat", label: "Darurat", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
];

/* --- FIELD WRAPPER ------------------------------------------- */

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <label
        className="flex items-center gap-2"
        style={{
          fontFamily: "var(--font-inter, Inter, sans-serif)",
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid #E5E7EB",
  fontFamily: "var(--font-inter, Inter, sans-serif)",
  fontSize: 14,
  color: "#111827",
  background: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

/* --- PAGE --------------------------------------------------- */

export default function LaporPage() {
  const [reporterName, setReporterName] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [kategori, setKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [showCleanPopup, setShowCleanPopup] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

  function removePhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setDetections([]);
    setAnalysisDone(false);
    setAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!reporterName.trim() || !lokasi.trim() || !kategori || !deskripsi.trim()) {
      setError("Mohon isi semua kolom yang wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      // Upload photo if selected
      let foto_url: string | null = null;
      let photoAnnotations: Detection[] | null = null;
      if (photoFile) {
        const supabase = createClient();
        const ext = photoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("laporan-photos")
          .upload(fileName, photoFile, { upsert: false });
        if (uploadError) {
          setError("Gagal mengunggah foto. Coba lagi.");
          setLoading(false);
          return;
        }
        const { data: urlData } = supabase.storage
          .from("laporan-photos")
          .getPublicUrl(fileName);
        foto_url = urlData.publicUrl;

        // Auto-analyze the photo with AI
        if (!analysisDone) {
          setAnalyzing(true);
          try {
            const annotateRes = await fetch("/api/laporan/annotate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ foto_url }),
            });
            if (annotateRes.ok) {
              const annotateJson = await annotateRes.json();
              if (annotateJson.is_clean) {
                setShowCleanPopup(true);
                setAnalysisDone(true);
                setAnalyzing(false);
                setLoading(false);
                return;
              }
              photoAnnotations = annotateJson.detections ?? [];
              setDetections(photoAnnotations ?? []);
              setAnalysisDone(true);
            }
          } catch {
            // Analysis failure is non-blocking
          } finally {
            setAnalyzing(false);
          }
        } else {
          photoAnnotations = detections;
        }
      }

      const res = await fetch("/api/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporter_name: reporterName,
          lokasi,
          kategori,
          deskripsi,
          urgency,
          foto_url,
          annotations: photoAnnotations,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Terjadi kesalahan. Silakan coba lagi.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  /* --- SUCCESS STATE ---------------------------------------- */

  if (success) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen px-4"
        style={{ background: "#F5F7FA" }}
      >
        <div
          className="flex flex-col items-center text-center"
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "clamp(32px, 6vw, 56px) clamp(24px, 5vw, 48px)",
            maxWidth: 480,
            width: "100%",
            boxShadow: "0 8px 40px rgba(0,0,0,0.09)",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#F0FDF4",
              border: "2px solid #BBF7D0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={36} color="#16A34A" />
          </div>

          <div className="flex flex-col" style={{ gap: 10 }}>
            <h2
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 24,
                fontWeight: 700,
                color: "#0D0D0D",
                margin: 0,
              }}
            >
              Laporan Terkirim!
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 15,
                color: "#6B7280",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Terima kasih, <strong style={{ color: "#111827" }}>{reporterName}</strong>! Laporan
              kamu sudah diterima dan akan segera ditindaklanjuti oleh tim kebersihan.
            </p>
          </div>

          <div className="flex flex-col w-full" style={{ gap: 12 }}>
            <button
              onClick={() => {
                setSuccess(false);
                setReporterName("");
                setLokasi("");
                setKategori("");
                setDeskripsi("");
                setUrgency("normal");
                removePhoto();
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "#15803D",
                color: "#FFFFFF",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Kirim Laporan Lain
            </button>
            <Link
              href="/guest"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                color: "#374151",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Lihat Riwayat Laporan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* --- FORM ------------------------------------------------- */

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 sm:px-8"
        style={{
          height: 60,
          background: "#FFFFFF",
          borderBottom: "1px solid #F3F4F6",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={18} color="#15803D" />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
              fontSize: 15,
              fontWeight: 700,
              color: "#15803D",
            }}
          >
            Tukang Lapor
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/guest"
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 13,
              fontWeight: 500,
              color: "#6B7280",
              textDecoration: "none",
            }}
          >
            Riwayat
          </Link>
          <Link
            href="/login"
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 13,
              fontWeight: 500,
              color: "#6B7280",
              textDecoration: "none",
            }}
          >
            Masuk
          </Link>
          <Link
            href="/signup"
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 13,
              fontWeight: 600,
              color: "#15803D",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 8,
              padding: "6px 14px",
              textDecoration: "none",
            }}
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12" style={{ gap: 24 }}>
        {/* Header text */}
        <div className="flex flex-col items-center text-center" style={{ maxWidth: 520, gap: 8 }}>
          <div
            className="flex items-center gap-2 mb-1"
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 20,
              padding: "5px 14px",
            }}
          >
            <AlertTriangle size={13} color="#15803D" />
            <span
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 12,
                fontWeight: 600,
                color: "#15803D",
              }}
            >
              Laporankan   Sekarang!
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
              fontSize: "clamp(22px, 5vw, 32px)",
              fontWeight: 700,
              color: "#0D0D0D",
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            Laporkan Masalah Kebersihan
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 15,
              color: "#6B7280",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Temukan masalah di sekolah? Laporkan sekarang — Tim prakarya akan
            segera menindaklanjuti.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full"
          style={{
            maxWidth: 560,
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "clamp(24px, 5vw, 40px)",
            gap: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              className="flex items-center gap-2"
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <AlertTriangle size={16} color="#DC2626" />
              <span
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 13,
                  color: "#B91C1C",
                }}
              >
                {error}
              </span>
            </div>
          )}

          {/* Name */}
          <Field label="Nama Kamu *" icon={<User size={14} color="#6B7280" />}>
            <input
              type="text"
              placeholder="Masukkan nama lengkap kamu"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              required
              style={inputStyle}
            />
          </Field>

          {/* Lokasi */}
          <Field label="Lokasi / Area *" icon={<MapPin size={14} color="#6B7280" />}>
            <input
              type="text"
              placeholder="cth. Kelas 10A, Toilet Lantai 2, Kantin…"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              required
              style={inputStyle}
            />
          </Field>

          {/* Kategori */}
          <Field label="Kategori Masalah *" icon={<Tag size={14} color="#6B7280" />}>
            <div style={{ position: "relative" }}>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                required
                style={{
                  ...inputStyle,
                  appearance: "none",
                  paddingRight: 40,
                  color: kategori ? "#111827" : "#9CA3AF",
                }}
              >
                <option value="" disabled>
                  Pilih kategori…
                </option>
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                color="#9CA3AF"
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>
          </Field>

          {/* Deskripsi */}
          <Field label="Deskripsi Masalah *" icon={<FileText size={14} color="#6B7280" />}>
            <textarea
              placeholder="Jelaskan masalah yang kamu temukan secara singkat…"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              required
              rows={4}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 100,
              }}
            />
          </Field>

          {/* Foto */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <label
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Camera size={14} color="#6B7280" />
              Foto Bukti
              <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(opsional, maks. 5 MB)</span>
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />

            {photoPreview ? (
              /* Preview with annotations */
              <div className="flex flex-col" style={{ gap: 8 }}>
                <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1.5px solid #E5E7EB" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }}
                  />
                  {/* Annotation overlays */}
                  {analysisDone && detections.map((d, i) => {
                    const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899"];
                    const color = colors[i % colors.length];
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: `${d.box.x}%`,
                          top: `${d.box.y}%`,
                          width: `${d.box.w}%`,
                          height: `${d.box.h}%`,
                          border: `2px solid ${color}`,
                          borderRadius: 3,
                          pointerEvents: "none",
                          boxShadow: `0 0 0 1px rgba(0,0,0,0.12)`,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            background: color,
                            color: "#FFF",
                            fontSize: 9,
                            fontWeight: 700,
                            fontFamily: "var(--font-inter, Inter, sans-serif)",
                            padding: "1px 5px",
                            borderRadius: "0 0 3px 0",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.label}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={removePhoto}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.55)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                    }}
                  >
                    <X size={14} color="#FFFFFF" />
                  </button>
                  {/* Analyzing overlay */}
                  {analyzing && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        borderRadius: 10,
                      }}
                    >
                      <ScanSearch size={28} color="#FFFFFF" className="animate-pulse" />
                      <span
                        style={{
                          fontFamily: "var(--font-inter, Inter, sans-serif)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#FFFFFF",
                        }}
                      >
                        AI sedang menganalisis gambar...
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "6px 12px",
                      background: "rgba(0,0,0,0.35)",
                      fontFamily: "var(--font-inter, Inter, sans-serif)",
                      fontSize: 11,
                      color: "#FFFFFF",
                    }}
                  >
                    {photoFile?.name}
                  </div>
                </div>
                {/* Detection summary */}
                {analysisDone && (
                  <div
                    className="flex items-center gap-2 flex-wrap"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: detections.length > 0 ? "#FEF2F2" : "#F0FDF4",
                      border: detections.length > 0 ? "1px solid #FECACA" : "1px solid #BBF7D0",
                    }}
                  >
                    <ScanSearch size={14} color={detections.length > 0 ? "#DC2626" : "#16A34A"} />
                    <span
                      style={{
                        fontFamily: "var(--font-inter, Inter, sans-serif)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: detections.length > 0 ? "#DC2626" : "#16A34A",
                      }}
                    >
                      {detections.length > 0
                        ? `AI mendeteksi ${detections.length} masalah: ${detections.map((d) => d.label).join(", ")}`
                        : "AI tidak mendeteksi masalah pada foto"}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Upload trigger */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "24px 16px",
                  borderRadius: 10,
                  border: "1.5px dashed #D1D5DB",
                  background: "#F9FAFB",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <ImageIcon size={28} color="#9CA3AF" />
                <span
                  style={{
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    fontSize: 13,
                    color: "#6B7280",
                  }}
                >
                  Klik untuk pilih foto
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    fontSize: 11,
                    color: "#9CA3AF",
                  }}
                >
                  JPG, PNG, WEBP — Maks. 5 MB
                </span>
              </button>
            )}
          </div>

          {/* Urgency */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <label
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Tingkat Urgensi
            </label>
            <div className="flex gap-3 flex-wrap">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  style={{
                    flex: "1 1 auto",
                    padding: "9px 16px",
                    borderRadius: 10,
                    border: urgency === opt.value ? `2px solid ${opt.color}` : `1.5px solid ${opt.border}`,
                    background: urgency === opt.value ? opt.bg : "#FAFAFA",
                    color: urgency === opt.value ? opt.color : "#6B7280",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    fontSize: 13,
                    fontWeight: urgency === opt.value ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 10,
              background: loading ? "#86EFAC" : "#15803D",
              color: "#FFFFFF",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s ease",
              marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {analyzing ? "Menganalisis foto..." : "Mengirim..."}
              </>
            ) : (
              "Kirim Laporan"
            )}
          </button>

          <p
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 12,
              color: "#9CA3AF",
              textAlign: "center",
              margin: 0,
            }}
          >
            Laporan dikirim secara anonim. Punya akun?{" "}
            <Link href="/login" style={{ color: "#15803D", fontWeight: 600 }}>
              Masuk di sini
            </Link>
          </p>
        </form>
      </main>

      {/* Clean image rejection popup */}
      {showCleanPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              padding: "32px 28px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#F0FDF4",
                border: "2px solid #BBF7D0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={30} color="#16A34A" />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              Kondisi Terlihat Baik
            </h3>
            <p
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 13,
                color: "#6B7280",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              AI menganalisis foto Anda dan tidak mendeteksi masalah kebersihan,
              kerusakan, atau pemborosan energi. Area ini tampak dalam kondisi ideal.
              Silakan ganti foto jika Anda yakin ada masalah.
            </p>
            <div className="flex gap-3" style={{ width: "100%", marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setShowCleanPopup(false);
                  removePhoto();
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#15803D",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Ganti Foto
              </button>
              <button
                type="button"
                onClick={() => setShowCleanPopup(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#F3F4F6",
                  color: "#374151",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="flex items-center justify-center"
        style={{
          height: 52,
          borderTop: "1px solid #F3F4F6",
          background: "#FFFFFF",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            fontSize: 12,
            color: "#9CA3AF",
          }}
        >
          © 2025 Tukang Lapor · Sistem Pelaporan Kebersihan Sekolah
        </span>
      </footer>
    </div>
  );
}
