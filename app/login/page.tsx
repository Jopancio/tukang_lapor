"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, TrendingUp, ArrowRight } from "lucide-react";
import AuthLeftPanel from "@/components/AuthLeftPanel";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = "admin@google.com";

  async function handleLogin() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError("Email atau kata sandi salah. Silakan coba lagi.");
      return;
    }
    const userEmail = data.user?.email ?? "";
    router.push(userEmail === ADMIN_EMAIL ? "/admin" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#F5F7FA" }}>
      {/* Left Panel */}
      <AuthLeftPanel mode="login" />

      {/* Right Panel */}
      <div
        className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 sm:py-16"
        style={{ background: "#F5F7FA" }}
      >
        {/* Form Card */}
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

          {/* Form Header */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <h2
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 26,
                fontWeight: 700,
                color: "#0D0D0D",
                letterSpacing: -0.5,
                margin: 0,
              }}
            >
              Selamat Datang Kembali
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 14,
                fontWeight: 400,
                color: "#6B7280",
                margin: 0,
              }}
            >
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {/* Email Group */}
          <div className="flex flex-col" style={{ gap: 6 }}>
            <label
              htmlFor="email"
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Alamat Email
            </label>
            <div
              className="flex items-center"
              style={{
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                height: 44,
                padding: "0 14px",
                gap: 10,
              }}
            >
              <Mail size={16} color="#9CA3AF" />
              <input
                id="email"
                type="email"
                placeholder="nama@sekolah.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 14,
                  color: "#0D0D0D",
                }}
              />
            </div>
          </div>

          {/* Password Group */}
          <div className="flex flex-col" style={{ gap: 6 }}>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Kata Sandi
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#16A34A",
                  textDecoration: "none",
                }}
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div
              className="flex items-center justify-between"
              style={{
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                height: 44,
                padding: "0 14px",
                gap: 8,
              }}
            >
              <div className="flex items-center gap-2 flex-1">
                <Lock size={16} color="#9CA3AF" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    fontSize: 14,
                    color: "#0D0D0D",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#9CA3AF" />
                ) : (
                  <Eye size={18} color="#9CA3AF" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                padding: "10px 14px",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 13,
                color: "#DC2626",
              }}
            >
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "#16A34A",
              borderRadius: 8,
              height: 48,
              width: "100%",
              border: "none",
              boxShadow: "0 4px 16px rgba(22,163,74,0.25)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 15,
                fontWeight: 600,
                color: "#FFFFFF",
              }}
            >
              {loading ? "Memproses..." : "Masuk"}
            </span>
            {!loading && <ArrowRight size={18} color="#FFFFFF" />}
          </button>

          {/* Register Link */}
          <div className="flex items-center justify-center" style={{ gap: 4 }}>
            <span
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 14,
                fontWeight: 400,
                color: "#6B7280",
              }}
            >
              Belum punya akun?
            </span>
            <Link
              href="/signup"
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 14,
                fontWeight: 600,
                color: "#D97706",
                textDecoration: "none",
              }}
            >
              Hubungi Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
