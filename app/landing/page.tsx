"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText, Users, MapPin, Bell, Shield, Zap, CheckCircle,
  ChevronRight, Menu, X, Star, ArrowRight, ClipboardList,
  BarChart3, Sparkles, Mail, ExternalLink,
} from "lucide-react";

/* ── helpers ── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

/* ── data ── */
const FEATURES = [
  { icon: FileText,    color: "#3B82F6", bg: "#EFF6FF", title: "Pelaporan Instan",         desc: "Kirim laporan kebersihan kapan saja, dari mana saja. Tanpa perlu login, cukup isi form singkat." },
  { icon: Zap,         color: "#F59E0B", bg: "#FFFBEB", title: "Analisis AI Otomatis",     desc: "Foto masalah kebersihan langsung dianalisis oleh AI untuk mendeteksi kategori dan tingkat urgensi." },
  { icon: Bell,        color: "#EF4444", bg: "#FEF2F2", title: "Notifikasi Real-time",     desc: "Petugas langsung menerima notifikasi push saat ada laporan baru masuk dari warga sekolah." },
  { icon: MapPin,      color: "#10B981", bg: "#ECFDF5", title: "Peta Area Interaktif",     desc: "Visualisasi peta gedung sekolah yang menunjukkan status kebersihan setiap zona secara live." },
  { icon: Users,       color: "#8B5CF6", bg: "#F5F3FF", title: "Manajemen Petugas",        desc: "Assign tugas ke petugas kebersihan, pantau progres, dan kelola jadwal dengan mudah." },
  { icon: BarChart3,   color: "#1E3A5F", bg: "#EFF6FF", title: "Dashboard Analitik",       desc: "Laporan statistik lengkap tentang tren kebersihan, waktu respons, dan performa tim." },
];

const STEPS = [
  { num: "01", color: "#3B82F6", title: "Laporkan Masalah",  desc: "Warga sekolah mengisi form laporan dengan foto, lokasi, dan deskripsi masalah." },
  { num: "02", color: "#F59E0B", title: "AI Menganalisis",    desc: "Sistem AI memproses foto dan mengklasifikasi urgensi laporan secara otomatis." },
  { num: "03", color: "#EF4444", title: "Petugas Ditugaskan", desc: "Admin mengassign tugas ke petugas yang tepat berdasarkan area dan keahlian." },
  { num: "04", color: "#10B981", title: "Masalah Teratasi",   desc: "Petugas menyelesaikan tugas dan update status — transparansi penuh untuk semua." },
];

const TESTIMONIALS = [
  { name: "Pak Budi Santoso",   role: "Kepala Sekolah SMAN 1",  text: "Tukang Lapor mengubah cara kami mengelola kebersihan sekolah. Respons tim jauh lebih cepat!", stars: 5 },
  { name: "Ibu Sari Dewi",      role: "Wali Murid",              text: "Sangat mudah digunakan! Tinggal foto dan kirim, masalah di depan kelas langsung ditangani.", stars: 5 },
  { name: "Mas Joko Prasetyo",  role: "Petugas Kebersihan",      text: "Tugas harian lebih terorganisir. Saya tahu persis area mana yang perlu dibersihkan duluan.", stars: 5 },
];

const STATS = [
  { value: "500+", label: "Laporan Terselesaikan" },
  { value: "12",   label: "Sekolah Bergabung" },
  { value: "95%",  label: "Tingkat Penyelesaian" },
  { value: "<30m", label: "Rata-rata Respons" },
];

/* ── Navbar ── */
function Navbar({ scrollY }: { scrollY: number }) {
  const [open, setOpen] = useState(false);
  const scrolled = scrollY > 20;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center"
      style={{ paddingTop: scrolled ? 10 : 18, transition: "padding 0.3s" }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          width: "min(1100px, calc(100% - 32px))",
          background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 999,
          padding: scrolled ? "10px 20px" : "12px 24px",
          boxShadow: scrolled
            ? "0 4px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)"
            : "0 2px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(255,255,255,0.6)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)" }}>
            <ClipboardList size={16} color="#FFFFFF" />
          </div>
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Tukang <span style={{ color: "#2563EB" }}>Lapor</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {[["Fitur", "#fitur"], ["Cara Kerja", "#cara-kerja"], ["Testimoni", "#testimoni"]].map(([label, href]) => (
            <a key={label} href={href}
              style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 500, color: "#374151", padding: "7px 14px", borderRadius: 999, textDecoration: "none", transition: "background 0.2s, color 0.2s" }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#F3F4F6"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; }}
            >{label}</a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#374151", padding: "8px 16px", borderRadius: 999, textDecoration: "none", border: "1.5px solid #E5E7EB", background: "transparent" }}>
            Masuk
          </Link>
          <Link href="/lapor" style={{ fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600, color: "#FFFFFF", padding: "8px 18px", borderRadius: 999, textDecoration: "none", background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)", boxShadow: "0 2px 10px rgba(37,99,235,0.4)" }}>
            Buat Laporan
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          {open ? <X size={22} color="#111827" /> : <Menu size={22} color="#111827" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="absolute top-full mt-2 flex flex-col gap-1"
          style={{
            width: "min(360px, calc(100% - 32px))",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            padding: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {[["Fitur", "#fitur"], ["Cara Kerja", "#cara-kerja"], ["Testimoni", "#testimoni"]].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setOpen(false)}
              style={{ fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 500, color: "#374151", padding: "11px 14px", borderRadius: 10, textDecoration: "none", display: "block" }}
            >{label}</a>
          ))}
          <div style={{ height: 1, background: "#F3F4F6", margin: "4px 0" }} />
          <Link href="/login" onClick={() => setOpen(false)} style={{ fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 600, color: "#374151", padding: "11px 14px", borderRadius: 10, textDecoration: "none", textAlign: "center", border: "1.5px solid #E5E7EB" }}>
            Masuk
          </Link>
          <Link href="/lapor" onClick={() => setOpen(false)} style={{ fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 600, color: "#FFFFFF", padding: "12px 14px", borderRadius: 10, textDecoration: "none", textAlign: "center", background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)" }}>
            Buat Laporan
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ── page ── */
export default function LandingPage() {
  const scrollY = useScrollY();

  const featRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const testiRef = useRef<HTMLElement>(null);

  const featVis  = useInView(featRef as React.RefObject<HTMLElement>);
  const stepsVis = useInView(stepsRef as React.RefObject<HTMLElement>);
  const statsVis = useInView(statsRef as React.RefObject<HTMLElement>);
  const testiVis = useInView(testiRef as React.RefObject<HTMLElement>);

  return (
    <div style={{ background: "#FAFBFF", overflowX: "hidden" }}>
      <Navbar scrollY={scrollY} />

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", paddingTop: 100, paddingBottom: 80 }}>
        {/* BG blobs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", top: "30%", right: "8%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(21,128,61,0.10) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: "15%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #E5E7EB 1px, transparent 1px)", backgroundSize: "32px 32px", opacity: 0.5 }} />
        </div>

        <div className="flex flex-col items-center text-center" style={{ maxWidth: 780, padding: "0 20px", gap: 28, position: "relative" }}>
          {/* Badge */}
          <div className="flex items-center gap-2 rounded-full" style={{ padding: "6px 16px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)" }}>
            <Sparkles size={13} color="#2563EB" />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#2563EB" }}>
              Platform Pelaporan Kebersihan Sekolah berbasis AI
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(38px, 7vw, 72px)", fontWeight: 800, color: "#0F172A", lineHeight: 1.1, margin: 0 }}>
            Sekolah Bersih{" "}
            <span style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Dimulai dari
            </span>
            {" "}Satu Laporan
          </h1>

          {/* Sub */}
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "clamp(16px, 2.5vw, 19px)", color: "#4B5563", lineHeight: 1.7, margin: 0, maxWidth: 580 }}>
            Tukang Lapor memudahkan warga sekolah melaporkan masalah kebersihan secara instan.
            AI kami menganalisis foto, sistem kami menugaskan petugas yang tepat.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/lapor"
              className="flex items-center gap-2"
              style={{ padding: "14px 28px", borderRadius: 999, background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)", boxShadow: "0 4px 20px rgba(37,99,235,0.45)", fontFamily: "var(--font-inter)", fontSize: 16, fontWeight: 700, color: "#FFFFFF", textDecoration: "none" }}>
              Buat Laporan Sekarang
              <ArrowRight size={18} />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2"
              style={{ padding: "14px 28px", borderRadius: 999, border: "2px solid #E5E7EB", background: "#FFFFFF", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", fontFamily: "var(--font-inter)", fontSize: 16, fontWeight: 600, color: "#374151", textDecoration: "none" }}>
              Masuk Dashboard
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={15} color="#FBBF24" fill="#FBBF24" />)}
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>5.0 dari 100+ ulasan</span>
            </div>
            <div style={{ width: 1, height: 16, background: "#E5E7EB" }} className="hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} color="#16A34A" />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>Gratis selamanya untuk sekolah</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef as React.RefObject<HTMLElement>} style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #1e40af 100%)", padding: "64px 20px" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6" style={{ maxWidth: 900, margin: "0 auto" }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} className="flex flex-col items-center gap-2" style={{ opacity: statsVis ? 1 : 0, transform: statsVis ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s` }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#FFFFFF" }}>{value}</span>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fitur" ref={featRef as React.RefObject<HTMLElement>} style={{ padding: "100px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="flex flex-col items-center text-center" style={{ gap: 16, marginBottom: 64 }}>
            <div className="rounded-full" style={{ padding: "5px 16px", background: "#EFF6FF", border: "1px solid #DBEAFE" }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#2563EB" }}>Fitur Unggulan</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.2 }}>
              Semua yang Dibutuhkan<br />Sekolah Modern
            </h2>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 17, color: "#4B5563", margin: 0, maxWidth: 520, lineHeight: 1.7 }}>
              Dari pelaporan hingga analitik — satu platform untuk mengelola kebersihan sekolah secara profesional.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <div key={title}
                className="flex flex-col gap-4 rounded-2xl"
                style={{
                  padding: 28, background: "#FFFFFF", border: "1px solid #F1F5F9",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  opacity: featVis ? 1 : 0,
                  transform: featVis ? "translateY(0)" : "translateY(32px)",
                  transition: `opacity 0.5s ${i * 0.08}s, transform 0.5s ${i * 0.08}s`,
                }}>
                <div className="flex items-center justify-center rounded-[14px] flex-shrink-0" style={{ width: 52, height: 52, background: bg }}>
                  <Icon size={24} color={color} />
                </div>
                <div className="flex flex-col gap-2">
                  <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 17, fontWeight: 700, color: "#111827" }}>{title}</span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="cara-kerja" ref={stepsRef as React.RefObject<HTMLElement>} style={{ padding: "100px 20px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="flex flex-col items-center text-center" style={{ gap: 16, marginBottom: 64 }}>
            <div className="rounded-full" style={{ padding: "5px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#16A34A" }}>Cara Kerja</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Dari Laporan ke Tindakan<br />dalam 4 Langkah
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {STEPS.map(({ num, color, title, desc }, i) => (
              <div key={num}
                className="flex items-start gap-6 rounded-2xl"
                style={{
                  padding: "28px 32px", background: "#FFFFFF", border: "1px solid #F1F5F9",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  opacity: stepsVis ? 1 : 0,
                  transform: stepsVis ? "translateX(0)" : "translateX(-32px)",
                  transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s`,
                }}>
                <div className="flex items-center justify-center rounded-2xl flex-shrink-0" style={{ width: 56, height: 56, background: color + "15", border: `2px solid ${color}30` }}>
                  <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 800, color }}>{num}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 18, fontWeight: 700, color: "#111827" }}>{title}</span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 15, color: "#6B7280", lineHeight: 1.65 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimoni" ref={testiRef as React.RefObject<HTMLElement>} style={{ padding: "100px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="flex flex-col items-center text-center" style={{ gap: 16, marginBottom: 64 }}>
            <div className="rounded-full" style={{ padding: "5px 16px", background: "#FFF7ED", border: "1px solid #FED7AA" }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#C2410C" }}>Testimoni</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Dipercaya oleh Komunitas Sekolah
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, text, stars }, i) => (
              <div key={name}
                className="flex flex-col gap-4 rounded-2xl"
                style={{
                  padding: 28, background: "#FFFFFF", border: "1px solid #F1F5F9",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  opacity: testiVis ? 1 : 0,
                  transform: testiVis ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s`,
                }}>
                <div className="flex items-center gap-0.5">
                  {[...Array(stars)].map((_, j) => <Star key={j} size={14} color="#FBBF24" fill="#FBBF24" />)}
                </div>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: 15, color: "#374151", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-auto pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                  <div className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)" }}>
                    <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 15, fontWeight: 700, color: "#FFF" }}>{name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 700, color: "#111827" }}>{name}</div>
                    <div style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF" }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #1d4ed8 100%)", borderRadius: 28, padding: "clamp(48px,6vw,72px) clamp(28px,5vw,64px)", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: "0 24px 80px rgba(30,58,95,0.35)" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div className="flex flex-col items-center gap-6" style={{ position: "relative" }}>
            <div className="rounded-full" style={{ padding: "6px 18px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>🎉 Gratis untuk semua sekolah</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800, color: "#FFFFFF", margin: 0, lineHeight: 1.2 }}>
              Siap Membuat Sekolah<br />Lebih Bersih?
            </h2>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "clamp(15px, 2.5vw, 18px)", color: "rgba(255,255,255,0.7)", margin: 0, maxWidth: 460, lineHeight: 1.7 }}>
              Mulai sekarang. Tidak perlu kartu kredit, tidak perlu instalasi — langsung lapor!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/lapor"
                className="flex items-center gap-2"
                style={{ padding: "14px 28px", borderRadius: 999, background: "#FFFFFF", fontFamily: "var(--font-inter)", fontSize: 16, fontWeight: 700, color: "#1E3A5F", textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                Buat Laporan Gratis
                <ChevronRight size={18} />
              </Link>
              <Link href="/signup"
                className="flex items-center gap-2"
                style={{ padding: "14px 28px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.3)", fontFamily: "var(--font-inter)", fontSize: 16, fontWeight: 600, color: "#FFFFFF", textDecoration: "none" }}>
                Daftar sebagai Petugas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0F172A", padding: "56px 20px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div className="flex flex-col gap-4" style={{ maxWidth: 300 }}>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)" }}>
                  <ClipboardList size={17} color="#FFFFFF" />
                </div>
                <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 17, fontWeight: 700, color: "#FFFFFF" }}>Tukang Lapor</span>
              </div>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: 0 }}>
                Platform pelaporan kebersihan sekolah berbasis AI. Menjadikan sekolah lebih bersih, satu laporan dalam satu waktu.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="flex flex-col gap-3">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Produk</span>
                {[["Fitur", "#fitur"], ["Cara Kerja", "#cara-kerja"], ["Testimoni", "#testimoni"]].map(([l, h]) => (
                  <a key={l} href={h} style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>{l}</a>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Platform</span>
                {[["Buat Laporan", "/lapor"], ["Masuk", "/login"], ["Daftar", "/signup"]].map(([l, h]) => (
                  <Link key={l} href={h} style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>{l}</Link>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Kontak</span>
                <a href="mailto:halo@tukanglap.id" className="flex items-center gap-2" style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                  <Mail size={13} /> Email
                </a>
                <a href="#" className="flex items-center gap-2" style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                  <ExternalLink size={13} /> GitHub
                </a>
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 24 }} />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              © 2026 Tukang Lapor. Dibuat dengan ❤️ untuk sekolah Indonesia.
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              Sistem Pelaporan ESG Sekolah Pintar
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
