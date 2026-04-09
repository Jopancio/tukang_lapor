"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import AuthLeftPanel from "@/components/AuthLeftPanel";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSignup() {
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Semua kolom wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Pendaftaran gagal. Coba lagi.");
        return;
      }

      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        router.push("/login?registered=1");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/lapor"), 1500);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px 11px 40px",
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    fontFamily: "var(--font-inter, Inter, sans-serif)",
    fontSize: 14,
    color: "#111827",
    background: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#F5F7FA" }}>
      {/* Left Panel */}
      <AuthLeftPanel mode="signup" />

      {/* Right Panel */}
      <div
        className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 sm:py-16"
        style={{ background: "#F5F7FA" }}
      >
        <div
          className="flex flex-col w-full"
          style={{
            maxWidth: 440,
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "clamp(24px, 5vw, 40px)",
            gap: 24,
            boxShadow: "0 8px 32px rgba(0,0,0,0.094)",
          }}
        >
          {/* Logo Badge */}
          <div
            className="flex items-center gap-2 w-fit"
            style={{
              background: "#F0FDF4",
              borderRadius: 10,
              padding: "8px 12px",
              border: "1px solid #BBF7D0",
            }}
          >
            <TrendingUp size={16} color="#16A34A" />
            <span
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 13,
                fontWeight: 600,
                color: "#15803D",
              }}
            >
              Tukang Lapor
            </span>
          </div>

          {/* Header */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <h1
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 26,
                fontWeight: 700,
                color: "#0D0D0D",
                letterSpacing: -0.5,
                margin: 0,
              }}
            >
              Buat Akun
            </h1>
            <p
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 14,
                color: "#6B7280",
                margin: 0,
              }}
            >
              Daftar sebagai <strong style={{ color: "#15803D" }}>Guest</strong> untuk melacak
              laporan kamu, atau{" "}
              <Link href="/lapor" style={{ color: "#15803D", fontWeight: 600 }}>
                lapor tanpa akun
              </Link>
              .
            </p>
          </div>

          {/* Success State */}
          {done && (
            <div
              className="flex items-center gap-2"
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <CheckCircle2 size={16} color="#16A34A" />
              <span
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 13,
                  color: "#15803D",
                  fontWeight: 600,
                }}
              >
                Akun berhasil dibuat! Mengalihkan…
              </span>
            </div>
          )}

          {/* Error */}
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

          {/* Form Fields */}
          <div className="flex flex-col" style={{ gap: 16 }}>
            {/* Name */}
            <div style={{ position: "relative" }}>
              <User
                size={16}
                color="#9CA3AF"
                style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || done}
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                color="#9CA3AF"
                style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="email"
                placeholder="Alamat email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || done}
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                color="#9CA3AF"
                style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min. 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || done}
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                {showPassword ? (
                  <EyeOff size={16} color="#9CA3AF" />
                ) : (
                  <Eye size={16} color="#9CA3AF" />
                )}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSignup}
            disabled={loading || done}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 10,
              background: loading || done ? "#86EFAC" : "#15803D",
              color: "#FFFFFF",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: loading || done ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mendaftarkan…
              </>
            ) : done ? (
              <>
                <CheckCircle2 size={18} />
                Berhasil!
              </>
            ) : (
              <>
                Daftar Sekarang
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Footer links */}
          <div className="flex flex-col items-center" style={{ gap: 10 }}>
            <p
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 13,
                color: "#6B7280",
                margin: 0,
              }}
            >
              Sudah punya akun?{" "}
              <Link
                href="/login"
                style={{ color: "#15803D", fontWeight: 600, textDecoration: "none" }}
              >
                Masuk
              </Link>
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 13,
                color: "#9CA3AF",
                margin: 0,
              }}
            >
              Atau{" "}
              <Link
                href="/lapor"
                style={{ color: "#374151", fontWeight: 600, textDecoration: "none" }}
              >
                kirim laporan tanpa akun →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}