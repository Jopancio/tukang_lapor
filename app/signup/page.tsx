"use client";

import Link from "next/link";
import { TrendingUp, ShieldAlert, Mail, ArrowRight } from "lucide-react";
import AuthLeftPanel from "@/components/AuthLeftPanel";

export default function SignupPage() {
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
          className="flex flex-col items-center w-full"
          style={{
            maxWidth: 440,
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "clamp(32px, 5vw, 48px)",
            gap: 28,
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
                fontFamily: "var(--font-space-grotesk)",
                fontSize: 13,
                fontWeight: 600,
                color: "#15803D",
              }}
            >
              Tukang Lapor
            </span>
          </div>

          {/* Icon */}
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              background: "#FEF3C7",
              border: "2px solid #FDE68A",
            }}
          >
            <ShieldAlert size={36} color="#D97706" />
          </div>

          {/* Text */}
          <div className="flex flex-col items-center text-center" style={{ gap: 10 }}>
            <h1
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: 24,
                fontWeight: 700,
                color: "#0D0D0D",
                letterSpacing: -0.5,
                margin: 0,
              }}
            >
              Pendaftaran Dibatasi
            </h1>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "#6B7280",
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 340,
              }}
            >
              Pendaftaran akun hanya dapat dilakukan oleh{" "}
              <strong style={{ color: "#111827" }}>Administrator</strong>.
              Silakan hubungi admin sekolah untuk mendapatkan akun.
            </p>
          </div>

          {/* Contact admin card */}
          <div
            className="flex items-center gap-3 w-full rounded-xl"
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              padding: "16px 18px",
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 42, height: 42, background: "#DBEAFE" }}
            >
              <Mail size={20} color="#2563EB" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Hubungi Admin
              </span>
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                Hubungi Tata Usaha untuk mendapatkan akun.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col w-full" style={{ gap: 12 }}>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2"
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 10,
                background: "#15803D",
                color: "#FFFFFF",
                fontFamily: "var(--font-inter)",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sudah Punya Akun? Masuk
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/lapor"
              className="flex items-center justify-center"
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                color: "#374151",
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Kirim Laporan Tanpa Akun →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}